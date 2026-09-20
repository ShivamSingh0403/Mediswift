import os
import sys
import hashlib
from pathlib import Path
from PIL import Image
from django.core.management.base import BaseCommand
from django.conf import settings
from apps.products.models import Product, ProductImage

VALID_IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.avif', '.svg'}

class Command(BaseCommand):
    help = "Validates the health, completeness, regulatory compliance, and integrity of MediSwift product images."

    def add_arguments(self, parser):
        parser.add_argument(
            '--json',
            action='store_true',
            help="Output metrics as JSON."
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("\n=== MEDISWIFT PRODUCT IMAGE AUDIT & COMPLIANCE VALIDATOR ==="))

        media_root = Path(settings.MEDIA_ROOT)
        dirs_to_check = [
            media_root / 'product_images' / 'verified',
            media_root / 'product_images' / 'ai_demo',
            media_root / 'product_images' / 'pending_review',
            media_root / 'product_images' / 'rejected',
        ]
        for d in dirs_to_check:
            d.mkdir(parents=True, exist_ok=True)

        all_products = Product.objects.all().prefetch_related('images').order_by('sku')
        total_products = all_products.count()

        # SKU lookup
        all_skus = set(all_products.values_list('sku', flat=True))
        sku_lookup = {sku.strip().upper(): sku for sku in all_skus if sku}

        verified_count = 0
        ai_demo_count = 0
        missing_count = 0
        pending_review_count = 0
        rejected_count = 0
        broken_count = 0
        duplicate_status_count = 0

        # Audit lists
        broken_files = []
        invalid_formats = []
        duplicate_hashes = []
        duplicate_urls = []
        missing_alt_text = []
        missing_status = []
        incorrectly_marked_verified = []
        products_without_primary = []
        unmatched_files = []

        seen_sha256 = {}
        seen_urls = {}

        for p in all_products:
            pimg = p.images.filter(is_primary=True).first() or p.images.first()

            # Status determination
            status = p.image_status or (pimg.image_status if pimg else 'MISSING')
            if not status:
                missing_status.append(p.sku)

            # Determine disk asset
            disk_file = None
            demo_file = media_root / 'product_images' / 'ai_demo' / f"{p.sku}.webp"
            if demo_file.exists():
                disk_file = demo_file

            file_field = (pimg.image_file or pimg.image) if pimg else None
            if not disk_file and file_field and file_field.name:
                fp = media_root / file_field.name
                if fp.exists():
                    disk_file = fp

            has_image = bool(disk_file) or bool(p.image_url) or (pimg and bool(pimg.image_url))

            if status == 'VERIFIED' or (pimg and pimg.image_status == 'VERIFIED'):
                verified_count += 1
            elif status == 'AI_DEMO_ONLY' or (pimg and pimg.image_status == 'AI_DEMO_ONLY') or (disk_file and 'ai_demo' in str(disk_file)):
                ai_demo_count += 1
            elif status in ('PENDING_REVIEW', 'DOWNLOADED') or (pimg and pimg.image_status in ('PENDING_REVIEW', 'DOWNLOADED')):
                pending_review_count += 1
            elif status == 'REJECTED' or (pimg and pimg.image_status == 'REJECTED'):
                rejected_count += 1
            elif status == 'BROKEN':
                broken_count += 1
            elif status == 'DUPLICATE':
                duplicate_status_count += 1
            else:
                missing_count += 1

            # Primary image / URL check
            if not has_image:
                products_without_primary.append(p.sku)

            # Checks when product has an image
            if has_image:
                # Alt text
                alt = p.image_alt_text or (pimg.alt_text if pimg else '')
                if not alt.strip():
                    missing_alt_text.append(p.sku)

                # Duplicate URL
                active_url = p.image_url or (pimg.image_url if pimg else '')
                if active_url:
                    if active_url in seen_urls:
                        duplicate_urls.append((p.sku, seen_urls[active_url], active_url))
                    else:
                        seen_urls[active_url] = p.sku

                # File integrity and hash check
                if disk_file:
                    try:
                        with Image.open(disk_file) as im:
                            im.verify()
                    except Exception as e:
                        invalid_formats.append((p.sku, disk_file.name, f"Corrupt image: {e}"))

                    try:
                        with open(disk_file, 'rb') as f_h:
                            sha = hashlib.sha256(f_h.read()).hexdigest()
                            if sha in seen_sha256:
                                duplicate_hashes.append((p.sku, seen_sha256[sha], disk_file.name))
                            else:
                                seen_sha256[sha] = p.sku
                    except Exception:
                        pass
                elif file_field and file_field.name:
                    broken_files.append((p.sku, str(file_field.name), "Database refers to file missing on disk"))

                # Incorrectly marked VERIFIED check
                if status == 'VERIFIED' or (pimg and pimg.image_status == 'VERIFIED'):
                    ver_by = p.verified_by or (pimg.verified_by if pimg else '')
                    if not ver_by.strip():
                        incorrectly_marked_verified.append((p.sku, "Status is VERIFIED but 'verified_by' is blank"))
                    if disk_file and 'ai_demo' in str(disk_file):
                        incorrectly_marked_verified.append((p.sku, "AI Demo visual incorrectly marked as VERIFIED REAL IMAGE"))

        # Scan folders for files not in catalog
        for sdir in dirs_to_check:
            if sdir.exists():
                for item in sdir.iterdir():
                    if item.is_file():
                        if item.suffix.lower() not in VALID_IMAGE_EXTENSIONS:
                            invalid_formats.append(('N/A', item.name, f"Invalid format: {item.suffix}"))
                            continue
                        stem = item.stem.strip().upper()
                        if stem not in sku_lookup and stem.split('_')[0] not in sku_lookup:
                            unmatched_files.append(item.name)

        # Print output
        self.stdout.write(f"Total Products in Catalog:     {total_products}")
        self.stdout.write(self.style.SUCCESS(f"AI Demo Images:                {ai_demo_count}"))
        self.stdout.write(self.style.SUCCESS(f"Verified Real Images:          {verified_count}"))
        self.stdout.write(f"Pending Review Images:         {pending_review_count}")
        self.stdout.write(f"Missing Product Images:        {missing_count}")
        self.stdout.write(f"Rejected Images:               {rejected_count}")
        self.stdout.write(f"Broken Files:                  {len(broken_files)}")
        self.stdout.write(f"Invalid Format Files:          {len(invalid_formats)}")
        self.stdout.write(f"Duplicate Hash Conflicts:      {len(duplicate_hashes)}")
        self.stdout.write(f"Missing Alt Texts:             {len(missing_alt_text)}")
        self.stdout.write(f"Unmatched Files on Disk:       {len(unmatched_files)}")
        self.stdout.write(f"Incorrectly Marked Verified:   {len(incorrectly_marked_verified)}")

        if incorrectly_marked_verified:
            self.stdout.write(self.style.ERROR("\n[ALERT] Incorrectly marked verified images:"))
            for sku, reason in incorrectly_marked_verified[:5]:
                self.stdout.write(f"  - {sku}: {reason}")

        if broken_files:
            self.stdout.write(self.style.ERROR(f"\n[ALERT] {len(broken_files)} broken file references found."))

        if not broken_files and not invalid_formats and not incorrectly_marked_verified:
            self.stdout.write(self.style.SUCCESS("\n[PASS] Validation completed with zero critical compliance violations.\n"))
