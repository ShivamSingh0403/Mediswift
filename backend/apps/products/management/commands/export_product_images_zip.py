import os
import io
import csv
import json
import zipfile
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings
from django.utils import timezone
from apps.products.models import Product, ProductImage

class Command(BaseCommand):
    help = "Exports all MediSwift AI demo and verified product images, metadata, and reports into a standardized ZIP archive."

    def add_arguments(self, parser):
        parser.add_argument(
            '--output',
            type=str,
            default=None,
            help="Custom output path for exported ZIP (defaults to exports/mediswift_ai_demo_product_images.zip)"
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("\n=== MEDISWIFT BULK PRODUCT IMAGE ZIP EXPORTER ==="))

        exports_dir = settings.BASE_DIR.parent / 'exports'
        exports_dir.mkdir(parents=True, exist_ok=True)

        if options.get('output'):
            zip_path = Path(options['output'])
        else:
            zip_path = exports_dir / 'mediswift_ai_demo_product_images.zip'

        self.stdout.write(f"Export target: {zip_path}")

        all_products = Product.objects.all().select_related('category', 'brand').prefetch_related('images').order_by('sku')
        total_count = all_products.count()

        images_to_archive = []  # (disk_path, arcname)
        mapping_rows = []
        mapping_dict = {}

        generated_rows = []
        missing_rows = []
        duplicate_rows = []
        failed_rows = []
        inventory_rows = []

        seen_hashes = {}
        archive_root = "mediswift_ai_demo_product_images"

        media_root = Path(settings.MEDIA_ROOT)
        demo_dir = media_root / 'product_images' / 'ai_demo'

        for p in all_products:
            sku = p.sku or f"SKU-{p.id}"
            pimg = p.images.filter(is_primary=True).first() or p.images.first()

            # Find actual disk file
            disk_file = None
            if demo_dir.exists():
                candidate_webp = demo_dir / f"{sku}.webp"
                if candidate_webp.exists():
                    disk_file = candidate_webp

            if not disk_file and pimg and (pimg.image_file or pimg.image):
                f = pimg.image_file or pimg.image
                if f and f.name:
                    fp = media_root / f.name
                    if fp.exists():
                        disk_file = fp

            # Status & mapping data
            status = p.image_status or (pimg.image_status if pimg else 'MISSING')
            has_image = bool(disk_file)

            # Metadata mapping entry
            img_rel_url = f"/media/product_images/ai_demo/{sku}.webp" if disk_file and "ai_demo" in str(disk_file) else (p.image_url or "")
            img_hash = pimg.image_hash if pimg else ""

            if disk_file:
                arcname = f"{archive_root}/images/{sku}{disk_file.suffix}"
                images_to_archive.append((disk_file, arcname))

                if img_hash:
                    if img_hash in seen_hashes:
                        duplicate_rows.append({
                            'sku': sku,
                            'original_sku': seen_hashes[img_hash],
                            'hash': img_hash
                        })
                    else:
                        seen_hashes[img_hash] = sku

                generated_rows.append({
                    'sku': sku,
                    'name': p.name,
                    'category': p.category.name if p.category else '',
                    'file': f"{sku}{disk_file.suffix}",
                    'hash': img_hash,
                    'status': status
                })
            else:
                missing_rows.append({
                    'sku': sku,
                    'name': p.name,
                    'category': p.category.name if p.category else '',
                    'reason': 'No visual asset generated or linked'
                })

            map_entry = {
                'sku': sku,
                'name': p.name,
                'brand': p.brand.name if p.brand else '',
                'category': p.category.name if p.category else '',
                'image_url': img_rel_url,
                'image_status': status,
                'is_real_product_photo': p.is_real_product_photo,
                'image_hash': img_hash,
            }
            mapping_rows.append(map_entry)
            mapping_dict[sku] = map_entry

            inventory_rows.append({
                'sku': sku,
                'product_name': p.name,
                'brand': p.brand.name if p.brand else '',
                'category': p.category.name if p.category else '',
                'strength': p.strength or '',
                'pack_size': p.pack_size or '',
                'existing_image': img_rel_url if has_image else '',
                'image_status': status,
                'demo_image_required': 'NO' if (status == 'VERIFIED' and p.is_real_product_photo) else 'YES'
            })

        # README content
        readme_text = f"""======================================================================
MEDISWIFT AI DEMO PRODUCT IMAGES ARCHIVE
======================================================================
Generated at: {timezone.now().isoformat()}
Total Products in Catalog: {total_count}
Total Visuals Archived: {len(images_to_archive)}

ARCHIVE STRUCTURE:
mediswift_ai_demo_product_images/
│
├── images/
│   ├── MS-DEMO-0001.webp
│   └── ... (Unique ecommerce studio packshots named strictly by SKU)
│
├── metadata/
│   ├── image_mapping.csv
│   └── image_mapping.json
│
├── reports/
│   ├── generated.csv
│   ├── failed.csv
│   ├── duplicates.csv
│   ├── missing.csv
│   └── inventory.csv
│
└── README.txt

REGULATORY NOTICE & COMPLIANCE RULES:
1. These visuals are AI-GENERATED DEMO VISUALS for catalogue presentation only.
2. They are NOT genuine manufacturer medicine photographs.
3. They must never be represented as real medicine packaging.
4. Each image visibly displays 'AI-GENERATED DEMO' and 'NOT A REAL PRODUCT PHOTO'.
======================================================================
"""

        # Write ZIP
        with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
            # 1. Images
            for disk_path, arcname in images_to_archive:
                zf.write(disk_path, arcname)

            # Helper for writing CSV into zip
            def write_csv_to_zip(subpath, fieldnames, rows):
                buf = io.StringIO()
                writer = csv.DictWriter(buf, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(rows)
                zf.writestr(f"{archive_root}/{subpath}", buf.getvalue().encode('utf-8'))

            # 2. Metadata
            mapping_fields = ['sku', 'name', 'brand', 'category', 'image_url', 'image_status', 'is_real_product_photo', 'image_hash']
            write_csv_to_zip('metadata/image_mapping.csv', mapping_fields, mapping_rows)
            zf.writestr(
                f"{archive_root}/metadata/image_mapping.json",
                json.dumps(mapping_dict, indent=2).encode('utf-8')
            )

            # 3. Reports
            write_csv_to_zip('reports/generated.csv', ['sku', 'name', 'category', 'file', 'hash', 'status'], generated_rows)
            write_csv_to_zip('reports/failed.csv', ['sku', 'name', 'error'], failed_rows)
            write_csv_to_zip('reports/duplicates.csv', ['sku', 'original_sku', 'hash'], duplicate_rows)
            write_csv_to_zip('reports/missing.csv', ['sku', 'name', 'category', 'reason'], missing_rows)
            inv_fields = ['sku', 'product_name', 'brand', 'category', 'strength', 'pack_size', 'existing_image', 'image_status', 'demo_image_required']
            write_csv_to_zip('reports/inventory.csv', inv_fields, inventory_rows)

            # 4. README
            zf.writestr(f"{archive_root}/README.txt", readme_text.encode('utf-8'))

        # Also mirror files into exports/reports for local inspection
        reports_dir = exports_dir / 'reports'
        reports_dir.mkdir(parents=True, exist_ok=True)
        with open(reports_dir / 'inventory.csv', 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=inv_fields)
            writer.writeheader()
            writer.writerows(inventory_rows)

        self.stdout.write(self.style.SUCCESS(f"\n[OK] Bulk ZIP export finished successfully:"))
        self.stdout.write(self.style.SUCCESS(f"     Archive: {zip_path}"))
        self.stdout.write(self.style.SUCCESS(f"     File Size: {os.path.getsize(zip_path) // 1024} KB"))
        self.stdout.write(f"     Archived {len(images_to_archive)} images, 2 metadata manifests, and 5 report CSVs.\n")
