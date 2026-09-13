import os
import io
import csv
import time
import hashlib
import urllib.request
import urllib.parse
from pathlib import Path
from PIL import Image
from django.core.management.base import BaseCommand
from django.conf import settings
from django.utils import timezone
from apps.products.models import Product, ProductImage

SUPPORTED_FORMATS = {'JPEG': '.jpg', 'PNG': '.png', 'WEBP': '.webp'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
MIN_FILE_SIZE = 500               # 500 Bytes

class Command(BaseCommand):
    help = "Download authorized packaging photographs from a CSV file matching strictly by product SKU."

    def add_arguments(self, parser):
        parser.add_argument(
            '--csv',
            type=str,
            default='docs/product_image_urls.csv',
            help="Path to CSV file containing product image URLs (default: docs/product_image_urls.csv)"
        )
        parser.add_argument(
            '--timeout',
            type=int,
            default=15,
            help="HTTP request timeout in seconds (default: 15)"
        )
        parser.add_argument(
            '--retries',
            type=int,
            default=3,
            help="Number of download retry attempts (default: 3)"
        )

    def handle(self, *args, **options):
        csv_rel_path = options['csv']
        # Locate CSV relative to project root or absolute
        csv_path = Path(csv_rel_path)
        if not csv_path.is_absolute():
            # Try from settings.BASE_DIR.parent or settings.BASE_DIR
            candidate_1 = settings.BASE_DIR.parent / csv_rel_path
            candidate_2 = settings.BASE_DIR / csv_rel_path
            if candidate_1.exists():
                csv_path = candidate_1
            elif candidate_2.exists():
                csv_path = candidate_2
            else:
                csv_path = candidate_1  # fallback for error message

        self.stdout.write(self.style.MIGRATE_HEADING("\n=== MEDISWIFT AUTOMATIC PRODUCT IMAGE DOWNLOADER ==="))
        self.stdout.write(f"Target CSV: {csv_path}")

        if not csv_path.exists():
            self.stdout.write(self.style.ERROR(f"Error: CSV file '{csv_path}' does not exist."))
            return

        # Prepare directories
        pending_dir = Path(settings.MEDIA_ROOT) / 'product_images' / 'pending_review'
        pending_dir.mkdir(parents=True, exist_ok=True)

        exports_dir = settings.BASE_DIR.parent / 'exports'
        exports_dir.mkdir(parents=True, exist_ok=True)
        failed_csv_path = exports_dir / 'failed_downloads.csv'

        # Load CSV rows
        rows = []
        with open(csv_path, 'r', encoding='utf-8-sig', errors='replace') as f:
            reader = csv.DictReader(f)
            for r in reader:
                if any(r.values()):
                    rows.append(r)

        if not rows:
            self.stdout.write(self.style.WARNING("Notice: No product image URLs found in CSV. File is empty or header-only."))
            self.stdout.write(self.style.NOTICE("“No real product images were supplied. The import system is ready, but no images were downloaded.”\n"))
            return

        self.stdout.write(f"Found {len(rows)} entries in CSV. Processing downloads...\n")

        # Track stats
        stats = {
            'total': len(rows),
            'downloaded': 0,
            'skipped_verified': 0,
            'duplicate': 0,
            'failed': 0,
            'unmatched_sku': 0,
        }

        failed_logs = []
        seen_hashes = {}

        # Populate existing hashes from database to prevent duplicate files
        for pimg in ProductImage.objects.exclude(image_hash=''):
            seen_hashes[pimg.image_hash] = pimg.sku

        for idx, row in enumerate(rows, start=1):
            sku = (row.get('sku') or row.get('SKU') or '').strip()
            url = (row.get('image_url') or '').strip()
            source_url = (row.get('source_url') or '').strip()
            source_name = (row.get('brand') or row.get('name') or 'Authorized Supplier').strip()
            license_note = (row.get('license_note') or 'Authorized Distribution Asset').strip()

            if not sku:
                self.stdout.write(self.style.WARNING(f"[{idx}/{len(rows)}] Row missing SKU. Skipping."))
                stats['failed'] += 1
                failed_logs.append({'sku': 'MISSING_SKU', 'url': url, 'reason': 'Row missing SKU field'})
                continue

            if not url:
                self.stdout.write(self.style.WARNING(f"[{idx}/{len(rows)}] SKU {sku}: Empty image_url. Skipping."))
                stats['failed'] += 1
                failed_logs.append({'sku': sku, 'url': '', 'reason': 'Empty image_url'})
                continue

            # 1. Match Product strictly by exact SKU
            product = Product.objects.filter(sku__iexact=sku).first()
            if not product:
                self.stdout.write(self.style.WARNING(f"[{idx}/{len(rows)}] SKU '{sku}' not found in database catalog. Skipping."))
                stats['unmatched_sku'] += 1
                stats['failed'] += 1
                failed_logs.append({'sku': sku, 'url': url, 'reason': f"SKU '{sku}' not found in database catalog"})
                continue

            # 2. Never overwrite verified images
            if product.image_status == 'VERIFIED' or product.images.filter(image_status='VERIFIED').exists():
                self.stdout.write(self.style.SUCCESS(f"[{idx}/{len(rows)}] Skipping SKU {sku}: Already has verified packaging photo."))
                stats['skipped_verified'] += 1
                continue

            # 3. Validate URL format
            parsed_url = urllib.parse.urlparse(url)
            if not parsed_url.scheme or parsed_url.scheme not in ('http', 'https') or not parsed_url.netloc:
                self.stdout.write(self.style.ERROR(f"[{idx}/{len(rows)}] Invalid URL scheme for SKU {sku}: '{url}'"))
                stats['failed'] += 1
                failed_logs.append({'sku': sku, 'url': url, 'reason': 'Invalid HTTP/HTTPS URL scheme'})
                continue

            # 4. Safe download with retries
            download_success = False
            image_data = None
            last_err = ""
            for attempt in range(1, options['retries'] + 1):
                try:
                    req = urllib.request.Request(
                        url,
                        headers={'User-Agent': 'MediSwift-Packaging-Downloader/2.0 (Healthcare E-Commerce Compliance)'}
                    )
                    with urllib.request.urlopen(req, timeout=options['timeout']) as response:
                        image_data = response.read()
                        download_success = True
                        break
                except Exception as e:
                    last_err = str(e)
                    time.sleep(1.0 * attempt)

            if not download_success or not image_data:
                self.stdout.write(self.style.ERROR(f"[{idx}/{len(rows)}] Failed to download {sku} from {url}: {last_err}"))
                stats['failed'] += 1
                failed_logs.append({'sku': sku, 'url': url, 'reason': f"Download failed after {options['retries']} attempts: {last_err}"})
                continue

            # 5. File size limits
            file_size = len(image_data)
            if file_size > MAX_FILE_SIZE:
                self.stdout.write(self.style.ERROR(f"[{idx}/{len(rows)}] File size ({file_size} bytes) exceeds limit of 10MB for {sku}."))
                stats['failed'] += 1
                failed_logs.append({'sku': sku, 'url': url, 'reason': f'File exceeds 10MB limit ({file_size} bytes)'})
                continue
            if file_size < MIN_FILE_SIZE:
                self.stdout.write(self.style.ERROR(f"[{idx}/{len(rows)}] File size too small ({file_size} bytes) for {sku}."))
                stats['failed'] += 1
                failed_logs.append({'sku': sku, 'url': url, 'reason': f'File size below minimum ({file_size} bytes)'})
                continue

            # 6. Reject HTML files pretending to be images
            lower_prefix = image_data[:50].lower()
            if b'<html' in lower_prefix or b'<!doctype' in lower_prefix or b'<?xml' in lower_prefix:
                self.stdout.write(self.style.ERROR(f"[{idx}/{len(rows)}] Rejected HTML/XML payload pretending to be image for SKU {sku}."))
                stats['failed'] += 1
                failed_logs.append({'sku': sku, 'url': url, 'reason': 'HTML/XML error page returned instead of image binary'})
                continue

            # 7. Check real MIME type & integrity with Pillow
            try:
                buf = io.BytesIO(image_data)
                with Image.open(buf) as pil_img:
                    img_format = pil_img.format
                    pil_img.verify()
            except Exception as img_err:
                self.stdout.write(self.style.ERROR(f"[{idx}/{len(rows)}] Corrupted/invalid image for SKU {sku}: {img_err}"))
                stats['failed'] += 1
                failed_logs.append({'sku': sku, 'url': url, 'reason': f'Corrupted image data: {img_err}'})
                continue

            if img_format not in SUPPORTED_FORMATS:
                self.stdout.write(self.style.ERROR(f"[{idx}/{len(rows)}] Unsupported image format '{img_format}' for SKU {sku}. Must be JPEG, PNG, or WEBP."))
                stats['failed'] += 1
                failed_logs.append({'sku': sku, 'url': url, 'reason': f'Unsupported format {img_format}'})
                continue

            # 8. Duplicate check using SHA-256
            file_hash = hashlib.sha256(image_data).hexdigest()
            if file_hash in seen_hashes and seen_hashes[file_hash] != sku:
                dup_sku = seen_hashes[file_hash]
                self.stdout.write(self.style.WARNING(f"[{idx}/{len(rows)}] Duplicate image detected for SKU {sku}: Identical SHA-256 to SKU {dup_sku}."))
                stats['duplicate'] += 1
                status_to_set = Product.ImageStatus.DUPLICATE
            else:
                seen_hashes[file_hash] = sku
                status_to_set = Product.ImageStatus.PENDING_REVIEW

            # 9. Generate safe filename: <SKU>.<ext>
            ext = SUPPORTED_FORMATS[img_format]
            safe_filename = f"{product.sku}{ext}"
            file_path = pending_dir / safe_filename

            # Save to media/product_images/pending_review/
            with open(file_path, 'wb') as f_out:
                f_out.write(image_data)

            rel_media_name = f"product_images/pending_review/{safe_filename}"

            # 10. Update or create ProductImage in database
            pimg = product.images.filter(sku=product.sku).first() or product.images.filter(is_primary=True).first()
            if not pimg:
                pimg = ProductImage(product=product, sku=product.sku, is_primary=True)

            pimg.sku = product.sku
            pimg.image_file.name = rel_media_name
            pimg.image.name = rel_media_name
            pimg.image_url = f"/media/{rel_media_name}"
            pimg.source_url = source_url or url
            pimg.source_name = source_name
            pimg.source = source_name
            pimg.license_note = license_note
            pimg.license = license_note
            pimg.image_status = status_to_set
            pimg.status = status_to_set
            pimg.image_hash = file_hash
            pimg.alt_text = f"Packaging photograph for {product.name} ({product.sku})"
            pimg.save()

            # Update Product fields
            product.image_url = pimg.image_url
            product.image_status = status_to_set
            product.image_source = source_name
            product.source_url = source_url or url
            product.image_license = license_note
            product.save(update_fields=['image_url', 'image_status', 'image_source', 'source_url', 'image_license'])

            stats['downloaded'] += 1
            self.stdout.write(self.style.SUCCESS(f"[{idx}/{len(rows)}] [OK] SKU {sku}: Saved {safe_filename} ({img_format}, {file_size // 1024} KB) -> Status: {status_to_set}"))

        # Write failed downloads report
        if failed_logs:
            with open(failed_csv_path, 'w', newline='', encoding='utf-8') as f_fail:
                writer = csv.DictWriter(f_fail, fieldnames=['sku', 'url', 'reason'])
                writer.writeheader()
                writer.writerows(failed_logs)
            self.stdout.write(f"\nLogged failed downloads to: {failed_csv_path}")

        # Summary output
        self.stdout.write(self.style.MIGRATE_HEADING("\n=== DOWNLOAD EXECUTION SUMMARY ==="))
        self.stdout.write(f"Total URLs processed:          {stats['total']}")
        self.stdout.write(f"Successfully downloaded:       {stats['downloaded']}")
        self.stdout.write(f"Skipped (already verified):    {stats['skipped_verified']}")
        self.stdout.write(f"Duplicate images:              {stats['duplicate']}")
        self.stdout.write(f"Failed downloads:              {stats['failed']}")
        self.stdout.write(f"Unmatched SKUs:                {stats['unmatched_sku']}")
        self.stdout.write("==================================================\n")
