import os
import shutil
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings
from apps.products.models import Product, ProductImage
from apps.products.management.commands.generate_ai_demo_product_images import (
    Command as GenerateDemoCommand,
    CATEGORY_PALETTES,
    DEFAULT_PALETTE,
    FICTIONAL_BRANDS,
    DISCLAIMER_TOP,
    DISCLAIMER_BOTTOM,
    get_font,
    calculate_perceptual_hash,
)
from PIL import Image, ImageDraw


class Command(BaseCommand):
    help = "Deterministically assigns or generates fictional demo visuals for products missing approved images."

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help="Reassign demo visuals even if demo image was previously set."
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("\n=== MEDISWIFT AUTOMATIC DEMO IMAGE ASSIGNMENT ==="))

        media_root = Path(settings.MEDIA_ROOT)
        media_products_dir = media_root / 'products'
        media_ai_demo_dir = media_root / 'product_images' / 'ai_demo'
        frontend_products_dir = Path(settings.BASE_DIR).parent / 'frontend' / 'public' / 'products'

        media_products_dir.mkdir(parents=True, exist_ok=True)
        media_ai_demo_dir.mkdir(parents=True, exist_ok=True)
        frontend_products_dir.mkdir(parents=True, exist_ok=True)

        generator = GenerateDemoCommand()

        products = Product.objects.all().prefetch_related('images').order_by('sku')
        total_products = products.count()

        assigned_count = 0
        skipped_verified = 0
        skipped_user = 0
        skipped_licensed = 0
        generated_count = 0

        for product in products:
            sku = (product.sku or '').strip()
            if not sku:
                continue

            raw_status = (product.image_status or '').upper()
            is_real = product.is_real_product_photo or raw_status == 'VERIFIED'

            # 1. Never overwrite verified, user-uploaded, or licensed images
            if is_real:
                skipped_verified += 1
                continue
            if raw_status in ('USER_UPLOADED', 'PENDING_REVIEW', 'DOWNLOADED'):
                skipped_user += 1
                continue
            if raw_status == 'LICENSED':
                skipped_licensed += 1
                continue

            # Deterministic SKU visual filename
            filename = f"{sku}.webp"
            media_prod_path = media_products_dir / filename
            media_ai_path = media_ai_demo_dir / filename
            fe_prod_path = frontend_products_dir / filename

            # If not yet on disk, generate or copy from existing ai_demo
            disk_exists = media_prod_path.exists() or media_ai_path.exists() or fe_prod_path.exists()

            if not disk_exists:
                # Generate new procedural demo image specifically for this product
                img = generator._generate_procedural_mockup(product)
                img.save(media_prod_path, 'WEBP', quality=88, method=4)
                img.save(media_ai_path, 'WEBP', quality=88, method=4)
                img.save(fe_prod_path, 'WEBP', quality=88, method=4)
                generated_count += 1
            else:
                # Ensure all 3 directories have the file
                src = None
                if media_prod_path.exists():
                    src = media_prod_path
                elif media_ai_path.exists():
                    src = media_ai_path
                elif fe_prod_path.exists():
                    src = fe_prod_path

                if src:
                    if not media_prod_path.exists():
                        shutil.copy2(src, media_prod_path)
                    if not media_ai_path.exists():
                        shutil.copy2(src, media_ai_path)
                    if not fe_prod_path.exists():
                        shutil.copy2(src, fe_prod_path)

            # Assign product image data
            product.image_url = f"/media/products/{filename}"
            if not product.image_status or product.image_status in ('MISSING', 'PENDING_REVIEW'):
                product.image_status = 'AI_DEMO_ONLY'
            product.is_demo_data = True
            product.save(update_fields=['image_url', 'image_status', 'is_demo_data'])

            # Link or create ProductImage relation
            pimg = product.images.filter(sku=sku).first()
            if not pimg:
                pimg = ProductImage.objects.create(
                    product=product,
                    sku=sku,
                    image_url=f"/media/products/{filename}",
                    image_status=Product.ImageStatus.AI_DEMO_ONLY,
                    status=Product.ImageStatus.AI_DEMO_ONLY,
                    source_type='AI_GENERATED_DEMO',
                    source_name='MediSwift Demo Generator',
                    is_primary=True,
                    is_real_product_photo=False,
                    requires_real_photo_replacement=True,
                    alt_text=f"Fictional demo visual for {product.name} ({sku})",
                )
            else:
                pimg.image_url = f"/media/products/{filename}"
                pimg.is_primary = True
                pimg.save(update_fields=['image_url', 'is_primary'])

            assigned_count += 1

        self.stdout.write(f"Total Products Checked:       {total_products}")
        self.stdout.write(self.style.SUCCESS(f"Demo Visuals Assigned:        {assigned_count}"))
        self.stdout.write(f"Newly Generated Assets:       {generated_count}")
        self.stdout.write(f"Skipped Verified Images:      {skipped_verified}")
        self.stdout.write(f"Skipped User Uploaded:        {skipped_user}")
        self.stdout.write(f"Skipped Licensed:             {skipped_licensed}")
        self.stdout.write(self.style.SUCCESS("\n[SUCCESS] Demo image assignment complete. All products resolve deterministically.\n"))
