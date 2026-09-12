"""
MediSwift Product Image Verification & Ingestion Management Command

Performs authoritative auditing of all product images in the MediSwift catalog:
1. Cleans out misleading, duplicated generic stock imagery from pharmaceuticals.
2. Audits local packshots in media/products/packshots/ and remote images.
3. Automatically links local uploaded packshot files by SKU or slug.
4. Updates image verification status, license, and clinically accurate alt text.
5. Emits a comprehensive Image Verification Report.
"""

import os
import shutil
from pathlib import Path
from collections import Counter
from urllib.parse import urlparse
from django.core.management.base import BaseCommand
from django.conf import settings
from django.db import transaction
from django.utils.text import slugify
from apps.products.models import Product, ProductImage

class Command(BaseCommand):
    help = "Audits, cleans, imports, and verifies medicine product photography."

    def add_arguments(self, parser):
        parser.add_argument(
            '--clean-unverified-stock',
            action='store_true',
            help='Purge generic repeated stock URLs that do not represent authentic packaging.',
        )
        parser.add_argument(
            '--import-dir',
            type=str,
            help='Directory containing authentic packshots (named <sku>.* or <slug>.*) to ingest.',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("=== MediSwift Real Medicine Image Verification System ==="))

        media_products_dir = Path(settings.MEDIA_ROOT) / 'products'
        packshots_dir = media_products_dir / 'packshots'
        packshots_dir.mkdir(parents=True, exist_ok=True)

        clean_stock = options.get('clean_unverified_stock', False)
        import_dir_arg = options.get('import_dir')

        # 1. Ingest from custom directory if provided
        if import_dir_arg:
            source_dir = Path(import_dir_arg)
            if source_dir.exists() and source_dir.is_dir():
                self.stdout.write(f"Scanning for packshots to import from: {source_dir}")
                for file_path in source_dir.glob('*'):
                    if file_path.suffix.lower() in ['.jpg', '.jpeg', '.png', '.webp']:
                        dest = packshots_dir / file_path.name
                        shutil.copy2(file_path, dest)
                        self.stdout.write(self.style.SUCCESS(f"  Staged packshot: {file_path.name}"))
            else:
                self.stdout.write(self.style.WARNING(f"Import directory not found: {source_dir}"))

        # 2. Check local packshots in media/products/packshots/
        available_packshots = {}
        for img_file in packshots_dir.glob('*'):
            if img_file.suffix.lower() in ['.jpg', '.jpeg', '.png', '.webp']:
                stem_lower = img_file.stem.lower()
                available_packshots[stem_lower] = img_file

        self.stdout.write(f"Available local packshots in {packshots_dir}: {len(available_packshots)}")

        total_products = Product.objects.count()
        verified_count = 0
        missing_count = 0
        invalid_urls_count = 0
        purged_fake_stock = 0
        local_linked_count = 0

        # Step 3: Check duplicates in current DB
        raw_urls = [p.image_url for p in Product.objects.all() if p.image_url]
        url_counts = Counter(raw_urls)
        duplicate_urls = {u: c for u, c in url_counts.items() if c > 1}

        # Step 4: Process products transactionally
        with transaction.atomic():
            for product in Product.objects.all():
                # Derive clinically descriptive alt text
                brand_name = product.brand.name if product.brand else 'MediSwift'
                form_strength = f"{product.dosage_form}"
                if product.strength:
                    form_strength += f" ({product.strength})"
                pack_str = f" - {product.pack_size}" if product.pack_size else ""
                product.image_alt_text = f"{product.name} {form_strength} by {brand_name}{pack_str}"

                sku_key = product.sku.lower() if product.sku else ''
                slug_key = product.slug.lower() if product.slug else ''

                # Check if a real local packshot exists for this SKU or slug
                matched_local_file = available_packshots.get(sku_key) or available_packshots.get(slug_key)

                if matched_local_file:
                    # Link local verified packshot
                    rel_url = f"{settings.MEDIA_URL}products/packshots/{matched_local_file.name}"
                    product.image_url = rel_url
                    product.image_status = Product.ImageStatus.VERIFIED
                    product.image_source = 'Authorized Local Packshot'
                    product.image_license = 'Authorized Distributor Asset'
                    product.save()

                    # Also update or create ProductImage relation
                    ProductImage.objects.update_or_create(
                        product=product,
                        is_primary=True,
                        defaults={
                            'image_url': rel_url,
                            'alt_text': product.image_alt_text,
                            'source': 'Authorized Local Packshot',
                            'status': 'VERIFIED',
                            'license': 'Authorized Distributor Asset',
                        }
                    )
                    local_linked_count += 1
                    verified_count += 1
                    continue

                # Check if the product has a repeated, unverified stock URL
                is_repeated_unsplash = (
                    product.image_url and 
                    'unsplash.com' in product.image_url and 
                    url_counts.get(product.image_url, 0) > 1
                )

                if clean_stock and is_repeated_unsplash:
                    # Remove misleading Unsplash assignment
                    product.image_url = ''
                    product.image_status = Product.ImageStatus.NEEDS_VERIFIED_IMAGE
                    product.image_source = ''
                    product.image_license = 'Awaiting Authorized Packshot'
                    product.save()
                    product.images.all().delete()
                    purged_fake_stock += 1
                    missing_count += 1
                    continue

                # Evaluate current URL
                if product.image_url:
                    parsed = urlparse(product.image_url)
                    if not parsed.scheme or not parsed.netloc:
                        invalid_urls_count += 1
                    
                    if product.image_status == Product.ImageStatus.VERIFIED:
                        verified_count += 1
                    else:
                        missing_count += 1
                else:
                    product.image_status = Product.ImageStatus.NEEDS_VERIFIED_IMAGE
                    if not product.image_license:
                        product.image_license = 'Awaiting Authorized Packshot'
                    product.save()
                    missing_count += 1

        # Re-evaluate duplicate mappings after possible cleanup
        post_urls = [p.image_url for p in Product.objects.all() if p.image_url]
        post_url_counts = Counter(post_urls)
        post_duplicates = {u: c for u, c in post_url_counts.items() if c > 1}

        # Step 5: Emit Verification Report
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(self.style.SUCCESS("           IMAGE VERIFICATION AUDIT REPORT"))
        self.stdout.write("=" * 60)
        self.stdout.write(f"Total Products in Catalog:            {total_products}")
        self.stdout.write(f"Products with Verified Images:         {verified_count}")
        self.stdout.write(f"Products Missing Real Photos:          {missing_count}")
        self.stdout.write(f"Products with Invalid URLs:            {invalid_urls_count}")
        self.stdout.write(f"Duplicate Image Mappings Remaining:    {len(post_duplicates)}")
        if purged_fake_stock > 0:
            self.stdout.write(f"Deceptive Stock Photos Purged:        {purged_fake_stock}")
        if local_linked_count > 0:
            self.stdout.write(f"Local Packshots Linked & Verified:     {local_linked_count}")
        self.stdout.write(f"Products Requiring Packshot Upload:    {missing_count}")
        self.stdout.write("=" * 60)

        if post_duplicates:
            self.stdout.write(self.style.WARNING(f"\nWarning: {len(post_duplicates)} URLs are mapped to multiple products:"))
            for u, c in list(post_duplicates.items())[:5]:
                self.stdout.write(f"  ({c}x) {u[:75]}...")
            self.stdout.write(self.style.NOTICE("Run with '--clean-unverified-stock' to purge repeated stock URLs."))
        else:
            self.stdout.write(self.style.SUCCESS("\n[OK] No duplicate image collisions detected in catalog!"))

        self.stdout.write(f"\nPackshot Drop Location: {packshots_dir}")
        self.stdout.write("To add verified packaging photos, save them as <SKU>.jpg or <slug>.png into that folder and re-run this command.")
