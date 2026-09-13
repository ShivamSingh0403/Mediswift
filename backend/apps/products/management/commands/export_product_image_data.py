import os
import csv
import json
import zipfile
from io import StringIO
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings
from django.utils import timezone
from apps.products.models import Product, ProductImage, ProductImageCandidate

class Command(BaseCommand):
    help = "Generates comprehensive export ZIP (exports/mediswift_product_image_data.zip) containing images, 9 CSV audits, discovery report, and README."

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("\n=== GENERATING MEDISWIFT PRODUCT IMAGE AUDIT & DATA PACKAGE ==="))

        # Base directories
        base_dir = Path(settings.BASE_DIR).parent  # Project root
        exports_dir = base_dir / 'exports'
        exports_dir.mkdir(parents=True, exist_ok=True)
        zip_path = exports_dir / 'mediswift_product_image_data.zip'

        media_root = Path(settings.MEDIA_ROOT)
        products = Product.objects.all().select_related('brand', 'category').prefetch_related('images', 'image_candidates')
        all_candidates = ProductImageCandidate.objects.all().select_related('product')
        all_images = ProductImage.objects.all().select_related('product')

        # 1. Prepare CSV data
        # CSV 1: all_products_image_audit.csv
        out1 = StringIO()
        w1 = csv.writer(out1)
        w1.writerow(['sku', 'name', 'brand', 'category', 'price_inr', 'image_status', 'is_verified', 'image_url', 'source_name', 'source_url', 'license_note', 'verified_by', 'verified_at'])
        for p in products:
            w1.writerow([
                p.sku, p.name, p.brand.name if p.brand else '', p.category.name if p.category else '',
                str(p.price_inr or p.price or '0.00'), p.image_status,
                'Yes' if p.image_status == Product.ImageStatus.VERIFIED else 'No',
                p.image_url or '', p.image_source or '', p.source_url or '', p.image_license or '',
                p.verified_by or '', p.verified_at.isoformat() if p.verified_at else ''
            ])


        # CSV 2: verified_images.csv
        out2 = StringIO()
        w2 = csv.writer(out2)
        w2.writerow(['sku', 'product_name', 'brand', 'image_file', 'image_hash', 'verified_by', 'verified_at', 'license_note'])
        for img in all_images.filter(image_status=Product.ImageStatus.VERIFIED):
            w2.writerow([
                img.sku, img.product.name, img.product.brand.name if img.product.brand else '',
                img.image_file.name if img.image_file else '', img.image_hash,
                img.verified_by or '', img.verified_at.isoformat() if img.verified_at else '',
                img.license_note or ''
            ])

        # CSV 3: pending_review_images.csv
        out3 = StringIO()
        w3 = csv.writer(out3)
        w3.writerow(['sku', 'product_name', 'brand', 'image_file', 'source_domain', 'source_page_url', 'license_note', 'created_at'])
        for img in all_images.filter(image_status=Product.ImageStatus.PENDING_REVIEW):
            w3.writerow([
                img.sku, img.product.name, img.product.brand.name if img.product.brand else '',
                img.image_file.name if img.image_file else '', img.source_domain or '',
                img.source_page_url or img.source_url or '', img.license_note or '',
                img.created_at.isoformat() if img.created_at else ''
            ])

        # CSV 4: rejected_images.csv
        out4 = StringIO()
        w4 = csv.writer(out4)
        w4.writerow(['sku', 'product_name', 'image_file', 'image_status', 'updated_at'])
        for img in all_images.filter(image_status=Product.ImageStatus.REJECTED):
            w4.writerow([
                img.sku, img.product.name, img.image_file.name if img.image_file else '',
                img.image_status, img.updated_at.isoformat() if img.updated_at else ''
            ])

        # CSV 5: missing_images.csv
        out5 = StringIO()
        w5 = csv.writer(out5)
        w5.writerow(['sku', 'product_name', 'brand', 'category', 'current_status', 'placeholder_rendered'])
        for p in products.filter(image_status__in=['MISSING', 'REJECTED', 'BROKEN']):
            w5.writerow([
                p.sku, p.name, p.brand.name if p.brand else '', p.category.name if p.category else '',
                p.image_status, 'Yes (Custom MediSwift Clinical Placeholder)'
            ])

        # CSV 6: discovered_candidates.csv
        out6 = StringIO()
        w6 = csv.writer(out6)
        w6.writerow(['candidate_id', 'sku', 'product_name', 'brand', 'candidate_image_url', 'source_domain', 'source_type', 'matching_confidence', 'status', 'rights_note', 'license_url'])
        for c in all_candidates:
            w6.writerow([
                c.id, c.sku, c.product_name, c.brand, c.candidate_image_url,
                c.source_domain, c.source_type, f"{c.matching_confidence:.2f}",
                c.status, c.rights_note, c.license_url
            ])

        # CSV 7: rights_unknown_candidates.csv
        out7 = StringIO()
        w7 = csv.writer(out7)
        w7.writerow(['candidate_id', 'sku', 'product_name', 'source_domain', 'candidate_image_url', 'rights_warning', 'review_reason'])
        for c in all_candidates.filter(status=ProductImageCandidate.CandidateStatus.RIGHTS_UNKNOWN):
            w7.writerow([
                c.id, c.sku, c.product_name, c.source_domain, c.candidate_image_url,
                c.rights_note, c.review_reason
            ])

        # CSV 8: product_mismatch_candidates.csv
        out8 = StringIO()
        w8 = csv.writer(out8)
        w8.writerow(['candidate_id', 'sku', 'catalog_product_name', 'candidate_image_title', 'detected_alt_text', 'mismatch_reason'])
        for c in all_candidates.filter(status=ProductImageCandidate.CandidateStatus.PRODUCT_MISMATCH):
            w8.writerow([
                c.id, c.sku, c.product_name, c.image_title, c.detected_alt_text, c.review_reason
            ])

        # CSV 9: duplicate_images.csv
        out9 = StringIO()
        w9 = csv.writer(out9)
        w9.writerow(['candidate_id', 'sku', 'product_name', 'candidate_image_url', 'reason'])
        for c in all_candidates.filter(status=ProductImageCandidate.CandidateStatus.DUPLICATE):
            w9.writerow([
                c.id, c.sku, c.product_name, c.candidate_image_url, c.review_reason
            ])

        # 2. image_discovery_report.json
        verified_count = products.filter(image_status=Product.ImageStatus.VERIFIED).count()
        pending_review_count = products.filter(image_status=Product.ImageStatus.PENDING_REVIEW).count()
        missing_count = products.filter(image_status=Product.ImageStatus.MISSING).count()
        rejected_count = products.filter(image_status=Product.ImageStatus.REJECTED).count()

        cand_stats = {
            'total_candidates': all_candidates.count(),
            'pending_review': all_candidates.filter(status=ProductImageCandidate.CandidateStatus.PENDING_REVIEW).count(),
            'approved_for_download': all_candidates.filter(status=ProductImageCandidate.CandidateStatus.APPROVED_FOR_DOWNLOAD).count(),
            'downloaded': all_candidates.filter(status=ProductImageCandidate.CandidateStatus.DOWNLOADED).count(),
            'discovered': all_candidates.filter(status=ProductImageCandidate.CandidateStatus.DISCOVERED).count(),
            'rights_unknown': all_candidates.filter(status=ProductImageCandidate.CandidateStatus.RIGHTS_UNKNOWN).count(),
            'product_mismatch': all_candidates.filter(status=ProductImageCandidate.CandidateStatus.PRODUCT_MISMATCH).count(),
            'blocked_source': all_candidates.filter(status=ProductImageCandidate.CandidateStatus.BLOCKED_SOURCE).count(),
            'broken': all_candidates.filter(status=ProductImageCandidate.CandidateStatus.BROKEN).count(),
            'duplicate': all_candidates.filter(status=ProductImageCandidate.CandidateStatus.DUPLICATE).count(),
        }

        report_json = {
            'mediswift_version': '2.0.0-PROD',
            'catalog_total_products': products.count(),
            'product_status_breakdown': {
                'VERIFIED': verified_count,
                'PENDING_REVIEW': pending_review_count,
                'MISSING': missing_count,
                'REJECTED': rejected_count,
            },
            'web_image_discovery': cand_stats,
            'compliance_policy': {
                'no_ai_generated_packaging': True,
                'no_google_images_scraping': True,
                'permitted_registries_only': ['DailyMed (NIH)', 'Open Food Facts', 'Open Beauty Facts'],
                'strict_dosage_form_matching': True,
                'unverified_images_fallback': 'Clinical MediSwift Placeholder (Medical Cross + Category)',
            },
            'exported_at': timezone.now().isoformat(),
        }

        # 3. README.txt
        readme_text = f"""========================================================================
MEDISWIFT 2.0 - PRODUCT IMAGE AUDIT, DISCOVERY & COMPLIANCE DATA PACKAGE
========================================================================
Generated on: {timezone.now().strftime('%Y-%m-%d %H:%M:%S UTC')}
Catalog Size: {products.count()} pharmaceutical and healthcare products

DIRECTORY STRUCTURE
-------------------
mediswift_product_image_data.zip
├── README.txt                                (This documentation)
├── image_discovery_report.json               (Machine-readable catalog metrics)
├── audit_reports/
│   ├── all_products_image_audit.csv          (Full catalog audit with SKU, status, & license)
│   ├── verified_images.csv                   (Verified images with SHA-256 and auditor)
│   ├── pending_review_images.csv             (Images downloaded and awaiting visual verification)
│   ├── missing_images.csv                    (Products using MediSwift clinical placeholder)
│   ├── rejected_images.csv                   (Images rejected during compliance audit)
│   ├── discovered_candidates.csv             (Web discovery candidates with confidence scores)
│   ├── rights_unknown_candidates.csv         (Candidates requiring license/permission clearance)
│   ├── product_mismatch_candidates.csv       (Candidates flagged for dosage or strength divergence)
│   └── duplicate_images.csv                  (Candidates flagged for identical image hashes)
└── images/
    ├── verified/                             (Approved and verified packshot photos)
    ├── pending_review/                       (Downloaded candidates pending manual sign-off)
    ├── rejected/                             (Archived rejected assets)
    └── placeholders/                         (Custom SVG/PNG placeholders for unverified products)

REGULATORY & ACCURACY COMPLIANCE
--------------------------------
1. No AI-generated pharmaceutical packaging is permitted.
2. No random internet or Google Images scraping.
3. Every candidate is matched strictly against product name, brand, dosage strength, and form.
4. If rights are unconfirmed, candidate is marked RIGHTS_UNKNOWN: "Usage permission has not been confirmed."
5. If strength or pack size differs from catalog, candidate is marked PRODUCT_MISMATCH.
6. Only authorized clinical placeholders are displayed for products lacking verified images.
========================================================================
"""

        # 4. Create ZIP File
        with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_DEFLATED) as zipf:
            zipf.writestr('README.txt', readme_text)
            zipf.writestr('image_discovery_report.json', json.dumps(report_json, indent=2))

            # Write CSVs
            zipf.writestr('audit_reports/all_products_image_audit.csv', out1.getvalue())
            zipf.writestr('audit_reports/verified_images.csv', out2.getvalue())
            zipf.writestr('audit_reports/pending_review_images.csv', out3.getvalue())
            zipf.writestr('audit_reports/rejected_images.csv', out4.getvalue())
            zipf.writestr('audit_reports/missing_images.csv', out5.getvalue())
            zipf.writestr('audit_reports/discovered_candidates.csv', out6.getvalue())
            zipf.writestr('audit_reports/rights_unknown_candidates.csv', out7.getvalue())
            zipf.writestr('audit_reports/product_mismatch_candidates.csv', out8.getvalue())
            zipf.writestr('audit_reports/duplicate_images.csv', out9.getvalue())

            # Add images from media folders
            img_folders = ['verified', 'pending_review', 'rejected', 'placeholders']
            for folder in img_folders:
                folder_path = media_root / 'product_images' / folder
                if folder_path.exists():
                    for f in folder_path.glob('*'):
                        if f.is_file():
                            zipf.write(f, arcname=f"images/{folder}/{f.name}")

        self.stdout.write(self.style.SUCCESS(f"\nSuccessfully generated export data package:"))
        self.stdout.write(self.style.SUCCESS(f" -> Path: {zip_path}"))
        self.stdout.write(f" -> Total ZIP Size: {zip_path.stat().st_size / 1024:.1f} KB")
        self.stdout.write(f" -> 9 CSV reports & discovery metrics bundled.\n")
