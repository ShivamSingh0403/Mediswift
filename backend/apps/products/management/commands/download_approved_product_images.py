import io
import os
import hashlib
import urllib.request
import urllib.parse
from pathlib import Path
from PIL import Image
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from django.conf import settings
from apps.products.models import Product, ProductImage, ProductImageCandidate

USER_AGENT = 'MediSwift-ImageDownloader/2.0 (Medical Catalog Auditing; https://mediswift.org/compliance; contact: compliance@mediswift.org)'
ALLOWED_MIMES = {'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp'}
MIN_DIMENSION = 150
MIN_SIZE_BYTES = 500
MAX_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

class Command(BaseCommand):
    help = "Downloads ONLY image candidates that have been reviewed and marked APPROVED_FOR_DOWNLOAD."

    def add_arguments(self, parser):
        parser.add_argument('--sku', type=str, help="Download approved candidate for specific SKU.")
        parser.add_argument('--candidate-id', type=str, help="Download candidate by ID.")
        parser.add_argument('--auto-approve-high-confidence', action='store_true', help="Auto-approve candidates with >= 0.70 confidence and valid rights before downloading.")

    def handle(self, *args, **options):
        sku = options.get('sku')
        cid = options.get('candidate_id')
        auto_approve = options.get('auto_approve_high_confidence')

        self.stdout.write(self.style.MIGRATE_HEADING("\n=== MEDISWIFT APPROVED IMAGE DOWNLOAD & VALIDATION ENGINE ==="))

        if auto_approve:
            eligible = ProductImageCandidate.objects.filter(
                status=ProductImageCandidate.CandidateStatus.PENDING_REVIEW,
                matching_confidence__gte=0.70
            ).exclude(rights_note__icontains="permission has not been confirmed")
            cnt = eligible.update(status=ProductImageCandidate.CandidateStatus.APPROVED_FOR_DOWNLOAD)
            self.stdout.write(self.style.SUCCESS(f"Auto-approved {cnt} high-confidence candidate(s) for download."))

        candidates = ProductImageCandidate.objects.filter(
            status=ProductImageCandidate.CandidateStatus.APPROVED_FOR_DOWNLOAD
        ).select_related('product')

        if cid:
            candidates = candidates.filter(id=cid)
        elif sku:
            candidates = candidates.filter(sku__iexact=sku.strip())

        total = candidates.count()
        if total == 0:
            self.stdout.write("No candidates currently marked APPROVED_FOR_DOWNLOAD.")
            self.stdout.write("Tip: Review candidates in admin workspace or use --auto-approve-high-confidence.\n")
            return

        self.stdout.write(f"Found {total} candidate(s) approved for download. Processing...\n")

        download_dir = Path(settings.MEDIA_ROOT) / 'product_images' / 'pending_review'
        download_dir.mkdir(parents=True, exist_ok=True)

        downloaded_count = 0
        broken_count = 0
        duplicate_count = 0
        rejected_dimension_count = 0

        for cand in candidates:
            img_url = cand.candidate_image_url
            self.stdout.write(f"Downloading candidate #{cand.id} for {cand.sku} from {cand.source_domain}...")

            req = urllib.request.Request(img_url, headers={'User-Agent': USER_AGENT})
            try:
                with urllib.request.urlopen(req, timeout=12) as response:
                    if response.status != 200:
                        self.stderr.write(f"   [BROKEN] HTTP {response.status}")
                        cand.status = ProductImageCandidate.CandidateStatus.BROKEN
                        cand.review_reason = f"Download failed with HTTP status {response.status}"
                        cand.save(update_fields=['status', 'review_reason'])
                        broken_count += 1
                        continue

                    raw_bytes = response.read()

            except Exception as e:
                self.stderr.write(f"   [BROKEN] Network error: {e}")
                cand.status = ProductImageCandidate.CandidateStatus.BROKEN
                cand.review_reason = f"Network download error: {str(e)}"
                cand.save(update_fields=['status', 'review_reason'])
                broken_count += 1
                continue

            # Size Check
            size = len(raw_bytes)
            if size < MIN_SIZE_BYTES or size > MAX_SIZE_BYTES:
                self.stderr.write(f"   [REJECTED] Invalid file size ({size} bytes)")
                cand.status = ProductImageCandidate.CandidateStatus.REJECTED
                cand.review_reason = f"File size {size} bytes is outside allowed range (500B - 10MB)"
                cand.save(update_fields=['status', 'review_reason'])
                rejected_dimension_count += 1
                continue

            # Pillow Image Verification
            try:
                pil_img = Image.open(io.BytesIO(raw_bytes))
                pil_img.verify()
                # Reopen to get dimensions and format after verify()
                pil_img = Image.open(io.BytesIO(raw_bytes))
                width, height = pil_img.size
                format_name = (pil_img.format or 'JPEG').upper()
            except Exception as e:
                self.stderr.write(f"   [CORRUPT/BROKEN] Pillow could not decode image: {e}")
                cand.status = ProductImageCandidate.CandidateStatus.BROKEN
                cand.review_reason = f"Corrupt image file: {str(e)}"
                cand.save(update_fields=['status', 'review_reason'])
                broken_count += 1
                continue

            # Dimension Check
            if width < MIN_DIMENSION or height < MIN_DIMENSION:
                self.stderr.write(f"   [REJECTED] Dimensions too small ({width}x{height} < {MIN_DIMENSION}x{MIN_DIMENSION})")
                cand.status = ProductImageCandidate.CandidateStatus.REJECTED
                cand.review_reason = f"Image dimensions {width}x{height} below minimum {MIN_DIMENSION}x{MIN_DIMENSION}"
                cand.save(update_fields=['status', 'review_reason'])
                rejected_dimension_count += 1
                continue

            # SHA-256 Duplicate Check
            sha256 = hashlib.sha256(raw_bytes).hexdigest()
            existing_hash = ProductImage.objects.filter(image_hash=sha256).exclude(product=cand.product).first()
            if existing_hash:
                self.stdout.write(f"   [DUPLICATE] Identical file hash already used by SKU {existing_hash.sku}")
                cand.status = ProductImageCandidate.CandidateStatus.DUPLICATE
                cand.review_reason = f"Exact duplicate image hash already registered for SKU {existing_hash.sku}"
                cand.save(update_fields=['status', 'review_reason'])
                duplicate_count += 1
                continue

            # Determine extension & mime
            ext = '.jpg'
            mime_type = 'image/jpeg'
            if format_name == 'PNG':
                ext = '.png'
                mime_type = 'image/png'
            elif format_name == 'WEBP':
                ext = '.webp'
                mime_type = 'image/webp'

            filename = f"{cand.sku.lower()}_{cand.id}{ext}"
            rel_path = f"product_images/pending_review/{filename}"
            abs_path = download_dir / filename

            with open(abs_path, 'wb') as f:
                f.write(raw_bytes)

            # Create or update ProductImage record (PENDING_REVIEW, NOT VERIFIED)
            pimg, _ = ProductImage.objects.update_or_create(
                product=cand.product,
                sku=cand.sku,
                image_hash=sha256,
                defaults={
                    'image_file': rel_path,
                    'image': rel_path,
                    'mime_type': mime_type,
                    'width': width,
                    'height': height,
                    'source_url': cand.candidate_image_url,
                    'source_page_url': cand.source_page_url,
                    'source_domain': cand.source_domain,
                    'source_name': cand.source_type,
                    'source': cand.source_type,
                    'license_note': cand.rights_note,
                    'license': cand.license_url,
                    'image_status': Product.ImageStatus.PENDING_REVIEW,
                    'status': Product.ImageStatus.PENDING_REVIEW,
                    'is_primary': True,
                    'alt_text': cand.detected_alt_text or f"Packaging photo for {cand.product_name}",
                }
            )

            # Link candidate to product image and mark DOWNLOADED
            cand.status = ProductImageCandidate.CandidateStatus.DOWNLOADED
            cand.downloaded_image = pimg
            cand.review_reason = f"Downloaded successfully ({width}x{height}, {size}B). Ready for visual verification."
            cand.save()

            # Connect product image_url and set PENDING_REVIEW (Do NOT mark VERIFIED)
            cand.product.image_url = pimg.image_file.url
            cand.product.image_status = Product.ImageStatus.PENDING_REVIEW
            cand.product.source_url = cand.candidate_image_url
            cand.product.image_license = cand.rights_note
            cand.product.save(update_fields=['image_url', 'image_status', 'source_url', 'image_license'])

            downloaded_count += 1
            self.stdout.write(self.style.SUCCESS(f"   [SUCCESS] Saved {filename} ({width}x{height}, {mime_type}) -> Status: PENDING_REVIEW"))

        self.stdout.write(self.style.SUCCESS(f"\nDownload run finished: {downloaded_count} downloaded, {broken_count} broken, {duplicate_count} duplicates, {rejected_dimension_count} rejected."))
