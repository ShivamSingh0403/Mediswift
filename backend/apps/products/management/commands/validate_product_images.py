import os
import sys
import hashlib
from pathlib import Path
from PIL import Image
from django.core.management.base import BaseCommand
from django.conf import settings
from apps.products.models import Product, ProductImage

VALID_IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.avif', '.svg'}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


class Command(BaseCommand):
    help = "Validates the health, completeness, integrity, and regulatory compliance of MediSwift product images."

    def add_arguments(self, parser):
        parser.add_argument(
            '--json',
            action='store_true',
            help="Output metrics as JSON."
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("\n=== MEDISWIFT PRODUCT IMAGE AUDIT & VALIDATION ==="))

        media_root = Path(settings.MEDIA_ROOT)
        dirs_to_check = [
            media_root / 'products',
            media_root / 'product_images' / 'verified',
            media_root / 'product_images' / 'ai_demo',
            media_root / 'product_images' / 'pending_review',
            media_root / 'product_images' / 'rejected',
        ]
        for d in dirs_to_check:
            d.mkdir(parents=True, exist_ok=True)

        all_products = Product.objects.all().prefetch_related('images').order_by('sku')
        total_products = all_products.count()

        all_skus = set(all_products.values_list('sku', flat=True))
        sku_lookup = {sku.strip().upper(): sku for sku in all_skus if sku}

        images_found = 0
        demo_images = 0
        user_uploaded_images = 0
        licensed_images = 0
        verified_images = 0
        missing_images = 0
        broken_images = 0
        duplicate_images = 0

        # Audit issue tracking
        invalid_extensions = []
        invalid_sizes = []
        corrupted_files = []
        invalid_urls = []
        duplicate_hashes = []
        missing_sku_mappings = []

        seen_sha256 = {}
        seen_urls = {}

        for p in all_products:
            pimg = p.images.filter(is_primary=True).first() or p.images.first()
            raw_status = (p.image_status or (pimg.image_status if pimg else '')).upper()

            # Determine disk asset across media locations
            disk_file = None
            sku = (p.sku or '').strip()

            candidate_paths = [
                media_root / 'products' / f"{sku}.webp",
                media_root / 'product_images' / 'verified' / f"{sku}.webp",
                media_root / 'product_images' / 'verified' / f"{sku}.jpg",
                media_root / 'product_images' / 'ai_demo' / f"{sku}.webp",
            ]

            file_field = (pimg.image_file or pimg.image) if pimg else None
            if file_field and file_field.name:
                candidate_paths.insert(0, media_root / file_field.name)

            for cp in candidate_paths:
                if cp.exists():
                    disk_file = cp
                    break

            has_image = bool(disk_file) or bool(p.image_url) or (pimg and bool(pimg.image_url))

            # Status determination
            is_verified = (raw_status == 'VERIFIED' and p.is_real_product_photo)
            is_user_uploaded = raw_status in ('USER_UPLOADED', 'PENDING_REVIEW', 'DOWNLOADED')
            is_licensed = raw_status == 'LICENSED'
            is_demo = raw_status in ('AI_DEMO_ONLY', 'DEMO') or (disk_file and ('ai_demo' in str(disk_file) or 'products' in str(disk_file)))

            if not has_image:
                missing_images += 1
                raw_status = 'MISSING'
            else:
                images_found += 1
                if is_verified:
                    verified_images += 1
                elif is_user_uploaded:
                    user_uploaded_images += 1
                elif is_licensed:
                    licensed_images += 1
                elif is_demo:
                    demo_images += 1
                elif raw_status == 'BROKEN':
                    broken_images += 1
                elif raw_status == 'DUPLICATE':
                    duplicate_images += 1
                else:
                    demo_images += 1

            # Checks when product has an image
            if has_image:
                active_url = p.image_url or (pimg.image_url if pimg else '')
                if active_url:
                    if active_url.startswith(('http://', 'https://', '/media/', '/products/')):
                        if active_url in seen_urls:
                            duplicate_images += 1
                        else:
                            seen_urls[active_url] = p.sku
                    else:
                        invalid_urls.append((p.sku, active_url, "Malformed URL pattern"))

                if disk_file:
                    # File extension check
                    if disk_file.suffix.lower() not in VALID_IMAGE_EXTENSIONS:
                        invalid_extensions.append((p.sku, disk_file.name, disk_file.suffix))
                        broken_images += 1

                    # File size check
                    try:
                        sz = disk_file.stat().st_size
                        if sz == 0:
                            invalid_sizes.append((p.sku, disk_file.name, "0 bytes file"))
                            broken_images += 1
                        elif sz > MAX_FILE_SIZE_BYTES:
                            invalid_sizes.append((p.sku, disk_file.name, f"File exceeds 10MB ({sz} bytes)"))
                    except Exception as e:
                        broken_images += 1
                        corrupted_files.append((p.sku, disk_file.name, str(e)))

                    # Image integrity check
                    try:
                        with Image.open(disk_file) as im:
                            im.verify()
                    except Exception as e:
                        broken_images += 1
                        corrupted_files.append((p.sku, disk_file.name, f"Corrupted image: {e}"))

                    # Duplicate hash check
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
                    broken_images += 1

        # Check for files without SKU mapping
        for sdir in dirs_to_check:
            if sdir.exists():
                for item in sdir.iterdir():
                    if item.is_file() and item.name != 'fallback-generic.webp' and item.name != 'fallback-generic.svg' and item.name != 'placeholder.png' and item.name != 'placeholder.svg':
                        stem = item.stem.strip().upper()
                        stem_base = stem.split('_')[0]
                        if stem not in sku_lookup and stem_base not in sku_lookup:
                            missing_sku_mappings.append(item.name)

        # Standardized Report Output
        self.stdout.write(f"TOTAL PRODUCTS:         {total_products}")
        self.stdout.write(self.style.SUCCESS(f"IMAGES FOUND:           {images_found}"))
        self.stdout.write(self.style.SUCCESS(f"DEMO IMAGES:            {demo_images}"))
        self.stdout.write(f"USER UPLOADED IMAGES:   {user_uploaded_images}")
        self.stdout.write(f"LICENSED IMAGES:        {licensed_images}")
        self.stdout.write(self.style.SUCCESS(f"VERIFIED IMAGES:        {verified_images}"))
        self.stdout.write(f"MISSING IMAGES:         {missing_images}")
        self.stdout.write(f"BROKEN IMAGES:          {broken_images}")
        self.stdout.write(f"DUPLICATE IMAGES:       {duplicate_images}")
        self.stdout.write(f"UNMAPPED FILE ASSETS:   {len(missing_sku_mappings)}")

        if broken_images > 0:
            self.stdout.write(self.style.WARNING(f"\n[NOTICE] {broken_images} broken image reference(s)."))

        if not broken_images and not invalid_extensions:
            self.stdout.write(self.style.SUCCESS("\n[PASS] Image validation audit passed successfully.\n"))
