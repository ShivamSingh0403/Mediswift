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
    help = "Exports all MediSwift product packaging photographs, reports, and manifests into a standardized ZIP archive."

    def add_arguments(self, parser):
        parser.add_argument(
            '--output',
            type=str,
            default=None,
            help="Custom output path for the exported ZIP file (defaults to exports/mediswift_product_images.zip)"
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("\n=== MEDISWIFT PRODUCT IMAGE ZIP EXPORTER ==="))

        exports_dir = settings.BASE_DIR.parent / 'exports'
        exports_dir.mkdir(parents=True, exist_ok=True)

        if options['output']:
            zip_path = Path(options['output'])
        else:
            zip_path = exports_dir / 'mediswift_product_images.zip'

        json_report_path = exports_dir / 'mediswift_product_images_report.json'

        self.stdout.write(f"Export target: {zip_path}")

        # Gather database records
        all_products = Product.objects.all().select_related('category', 'brand').prefetch_related('images')
        total_count = all_products.count()

        imported_rows = []
        missing_rows = []
        pending_review_rows = []
        verified_rows = []
        duplicate_rows = []

        images_to_archive = []  # list of (full_path, arcname)

        seen_hashes = {}
        duplicates_set = set()

        for p in all_products:
            # Check primary image or image_url
            pimg = p.images.filter(is_primary=True).first() or p.images.first()

            if p.image_status == 'VERIFIED' or (pimg and pimg.image_status == 'VERIFIED'):
                img_status = 'VERIFIED'
            elif p.image_status == 'DUPLICATE' or (pimg and pimg.image_status == 'DUPLICATE'):
                img_status = 'DUPLICATE'
            elif p.image_status in ('PENDING_REVIEW', 'DOWNLOADED') or (pimg and pimg.image_status in ('PENDING_REVIEW', 'DOWNLOADED')):
                img_status = 'PENDING_REVIEW'
            elif p.image_status == 'REJECTED' or (pimg and pimg.image_status == 'REJECTED'):
                img_status = 'REJECTED'
            elif p.image_url or (pimg and (pimg.image_file or pimg.image)):
                img_status = p.image_status or 'PENDING_REVIEW'
            else:
                img_status = 'MISSING'

            # Missing check
            if img_status == 'MISSING':
                missing_rows.append({
                    'sku': p.sku,
                    'name': p.name,
                    'brand': p.brand.name if p.brand else '',
                    'category': p.category.name if p.category else '',
                    'dosage_form': p.dosage_form,
                    'price_inr': str(p.price_inr or p.price or ''),
                })
                continue

            # Found an image
            file_field = None
            if pimg:
                file_field = pimg.image_file or pimg.image
            
            file_rel_path = file_field.name if file_field else p.image_url
            img_hash = pimg.image_hash if pimg else ''
            src_name = p.image_source or (pimg.source_name if pimg else '')
            src_url = p.source_url or (pimg.source_url if pimg else '')
            lic_note = p.image_license or (pimg.license_note if pimg else '')
            ver_by = p.verified_by or (pimg.verified_by if pimg else '')
            ver_at = p.verified_at or (pimg.verified_at if pimg else None)

            row_data = {
                'sku': p.sku,
                'name': p.name,
                'brand': p.brand.name if p.brand else '',
                'status': img_status,
                'file_path': file_rel_path,
                'image_url': p.image_url,
                'image_hash': img_hash,
                'source_name': src_name,
                'source_url': src_url,
                'license_note': lic_note,
                'verified_by': ver_by,
                'verified_at': ver_at.isoformat() if ver_at else '',
            }
            imported_rows.append(row_data)

            if img_status == 'VERIFIED':
                verified_rows.append(row_data)
            elif img_status in ('PENDING_REVIEW', 'DOWNLOADED'):
                pending_review_rows.append(row_data)
            elif img_status == 'DUPLICATE':
                duplicate_rows.append(row_data)

            # Check if file exists on disk to include in zip
            if file_field and file_field.name:
                disk_path = Path(settings.MEDIA_ROOT) / file_field.name
                if disk_path.exists() and disk_path.is_file():
                    ext = disk_path.suffix
                    arcname = f"mediswift_product_images/images/{p.sku}{ext}"
                    images_to_archive.append((disk_path, arcname))

        # Check existing failed_downloads.csv in exports
        failed_csv_source = exports_dir / 'failed_downloads.csv'
        failed_rows = []
        if failed_csv_source.exists():
            with open(failed_csv_source, 'r', encoding='utf-8', errors='replace') as f_fail:
                reader = csv.DictReader(f_fail)
                for r in reader:
                    failed_rows.append(r)

        # Build README text
        readme_text = f"""======================================================================
MEDISWIFT PHARMACEUTICAL PRODUCT IMAGE REPOSITORY & AUDIT ARCHIVE
======================================================================
Generated at: {timezone.now().isoformat()}
Platform: MediSwift Healthcare 2.0 (Indian E-Commerce & Telehealth)

DIRECTORY STRUCTURE:
├── images/             High-resolution authorized pharmaceutical packshots named by SKU
├── reports/            Complete audit logs & tracking CSVs
│   ├── imported_images.csv     All catalog items with active image mappings
│   ├── missing_images.csv      Products awaiting packaging photography
│   ├── verified_images.csv     Officially authenticated photographs
│   ├── pending_review.csv      Downloaded/imported images awaiting audit
│   ├── duplicate_images.csv    Redundant or identical image hashes
│   └── failed_downloads.csv    Download attempts that failed validation
└── README.txt          This compliance and metadata reference

COMPLIANCE RULES:
1. Strict Exact SKU Matching: Images must strictly be named `<SKU>.<ext>` (e.g. `MS-0001.jpg`).
2. No Artificial Packaging: MediSwift strictly forbids fake/AI-generated medicine packaging.
3. Separation of Storage: Product packshots are strictly isolated from private prescription records.
======================================================================
"""

        # Write ZIP archive
        with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
            # 1. Add images
            for disk_path, arcname in images_to_archive:
                zf.write(disk_path, arcname)

            # 2. Add reports
            def add_csv(report_filename, fieldnames, rows):
                buf = io.StringIO()
                writer = csv.DictWriter(buf, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(rows)
                zf.writestr(f"mediswift_product_images/reports/{report_filename}", buf.getvalue().encode('utf-8'))

            report_fields = [
                'sku', 'name', 'brand', 'status', 'file_path', 'image_url',
                'image_hash', 'source_name', 'source_url', 'license_note', 'verified_by', 'verified_at'
            ]

            add_csv('imported_images.csv', report_fields, imported_rows)
            add_csv('missing_images.csv', ['sku', 'name', 'brand', 'category', 'dosage_form', 'price_inr'], missing_rows)
            add_csv('verified_images.csv', report_fields, verified_rows)
            add_csv('pending_review.csv', report_fields, pending_review_rows)
            add_csv('duplicate_images.csv', report_fields, duplicate_rows)
            add_csv('failed_downloads.csv', ['sku', 'url', 'reason'], failed_rows)

            # 3. Add README
            zf.writestr("mediswift_product_images/README.txt", readme_text.encode('utf-8'))

        # Also write JSON summary report to exports/
        summary_report = {
            'generated_at': timezone.now().isoformat(),
            'zip_file_path': str(zip_path),
            'zip_size_bytes': os.path.getsize(zip_path),
            'metrics': {
                'total_products': total_count,
                'imported_images': len(imported_rows),
                'verified_images': len(verified_rows),
                'pending_review_images': len(pending_review_rows),
                'missing_images': len(missing_rows),
                'duplicate_images': len(duplicate_rows),
                'failed_downloads': len(failed_rows),
                'images_archived_in_zip': len(images_to_archive),
            }
        }
        with open(json_report_path, 'w', encoding='utf-8') as f_json:
            json.dump(summary_report, f_json, indent=2)

        self.stdout.write(self.style.SUCCESS(f"\n[OK] ZIP archive generated successfully:"))
        self.stdout.write(self.style.SUCCESS(f"     Path: {zip_path}"))
        self.stdout.write(self.style.SUCCESS(f"     Size: {os.path.getsize(zip_path) // 1024} KB"))
        self.stdout.write(f"JSON summary report: {json_report_path}")
        self.stdout.write(f"\nArchived {len(images_to_archive)} images and 6 report manifests into ZIP.\n")
