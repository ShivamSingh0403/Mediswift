"""
Django management command to safely import a product catalog from CSV.
Implements update-or-create behavior based on SKU to guarantee idempotency.
Does not delete existing products and avoids duplicates.
"""
import csv
import os
from decimal import Decimal, InvalidOperation
from pathlib import Path
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from apps.products.models import Category, Brand, Product

class Command(BaseCommand):
    help = 'Safely imports or updates products from a CSV catalog file'

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            default='mediswift_demo_product_catalog_250.csv',
            help='Path to the CSV file to import',
        )

    def handle(self, *args, **options):
        csv_file_arg = options['file']
        csv_path = Path(csv_file_arg)
        if not csv_path.is_absolute():
            # Try workspace root and backend root
            candidate_1 = Path(__file__).resolve().parent.parent.parent.parent.parent / csv_file_arg
            candidate_2 = Path(__file__).resolve().parent.parent.parent.parent / csv_file_arg
            if candidate_1.exists():
                csv_path = candidate_1
            elif candidate_2.exists():
                csv_path = candidate_2

        self.stdout.write(self.style.MIGRATE_HEADING(f"Importing catalog from: {csv_path}"))

        if not csv_path.exists():
            self.stdout.write(self.style.ERROR(f"File not found: {csv_path}"))
            return

        rows_imported = 0
        rows_updated = 0
        rows_skipped = 0
        rows_error = 0

        # Cache categories and brands to minimize DB roundtrips
        category_cache = {}
        brand_cache = {}

        def infer_dosage_form(name: str, cat_name: str) -> str:
            n = name.lower()
            if any(w in n for w in ['lotion', 'cream', 'cleanser', 'gel']):
                return Product.DosageForm.LOTION
            if any(w in n for w in ['syrup', 'liquid', 'wash', 'mouthwash', 'shampoo', 'oil']):
                return Product.DosageForm.LIQUID
            if any(w in n for w in ['spray']):
                return Product.DosageForm.SPRAY
            if any(w in n for w in ['powder', 'bath powder', 'tea']):
                return Product.DosageForm.POWDER
            if any(w in n for w in ['capsule']):
                return Product.DosageForm.CAPSULE
            if any(w in n for w in ['strip', 'liner', 'pad', 'patch', 'bandage', 'gauze']):
                return Product.DosageForm.STRIP
            if any(w in n for w in ['device', 'thermometer', 'oximeter', 'monitor', 'machine', 'bottle', 'mat', 'comb', 'roller', 'floss', 'cleaner', 'toothbrush', 'kit']):
                return Product.DosageForm.DEVICE
            return Product.DosageForm.OTHER

        with open(csv_path, mode='r', encoding='utf-8-sig', errors='replace') as f:
            reader = csv.DictReader(f)
            headers = [h.strip() for h in (reader.fieldnames or [])]
            self.stdout.write(f"Detected CSV columns: {headers}")

            for row_idx, raw_row in enumerate(reader, start=1):
                # Clean keys and values
                row = {k.strip(): (v or '').strip() for k, v in raw_row.items() if k}

                sku = row.get('sku', '').strip()
                if not sku:
                    self.stdout.write(self.style.WARNING(f"Row {row_idx}: Missing SKU, skipping."))
                    rows_skipped += 1
                    continue

                name = row.get('name', '').strip()
                if not name:
                    self.stdout.write(self.style.WARNING(f"Row {row_idx} ({sku}): Missing Name, skipping."))
                    rows_skipped += 1
                    continue

                try:
                    brand_name = (row.get('brand') or '').strip().replace('’', "'") or 'Demo Catalog Brand'
                    if brand_name not in brand_cache:
                        brand_slug = slugify(brand_name)
                        brand, _ = Brand.objects.get_or_create(
                            name=brand_name,
                            defaults={'slug': brand_slug}
                        )
                        brand_cache[brand_name] = brand
                    brand_obj = brand_cache[brand_name]

                    category_name = (row.get('category') or '').strip().replace('’', "'") or 'Healthcare & Wellness'
                    if category_name not in category_cache:
                        cat_slug = slugify(category_name)
                        cat, _ = Category.objects.get_or_create(
                            name=category_name,
                            defaults={'slug': cat_slug, 'is_active': True}
                        )
                        category_cache[category_name] = cat
                    category_obj = category_cache[category_name]

                    description = row.get('description', '').strip()

                    # Pricing
                    try:
                        price_inr = Decimal(row.get('price_inr', '0').strip() or '0')
                    except InvalidOperation:
                        price_inr = Decimal('0.00')

                    try:
                        orig_price_inr = Decimal(row.get('original_price_inr', '0').strip() or '0')
                    except InvalidOperation:
                        orig_price_inr = price_inr

                    # MRP and Discount percent
                    effective_mrp = orig_price_inr if orig_price_inr > Decimal('0') else price_inr
                    if effective_mrp > price_inr and effective_mrp > Decimal('0'):
                        discount_pct = ((effective_mrp - price_inr) / effective_mrp * Decimal('100')).quantize(Decimal('0.01'))
                    else:
                        discount_pct = Decimal('0.00')

                    # Stock
                    try:
                        stock_qty = int(row.get('stock', '0').strip() or '0')
                    except ValueError:
                        stock_qty = 0

                    # Prescription required
                    rx_raw = row.get('prescription_required', 'False').strip().lower()
                    prescription_required = rx_raw in ('true', '1', 'yes', 't')

                    # Image URL & status sanitization
                    raw_img_url = row.get('image_url', '').strip()
                    image_url = raw_img_url if raw_img_url else ''

                    raw_img_status = row.get('image_status', '').strip().replace('|', '').strip()
                    image_status = raw_img_status or ('VERIFIED' if image_url else 'NEEDS_VERIFIED_IMAGE')

                    raw_img_source = row.get('image_source', '').strip().replace('|', '').strip()
                    image_source = raw_img_source or ''

                    # Demo data flag
                    demo_raw = row.get('is_demo_data', 'True').strip().lower()
                    is_demo_data = demo_raw in ('true', '1', 'yes', 't')

                    # Active flag
                    active_raw = row.get('active', 'True').strip().lower()
                    is_active = active_raw in ('true', '1', 'yes', 't')

                    # Slug generation (guarantee uniqueness across products)
                    desired_slug = slugify(name)
                    existing_with_slug = Product.objects.filter(slug=desired_slug).exclude(sku=sku).first()
                    if existing_with_slug:
                        desired_slug = slugify(f"{name}-{sku}")

                    dosage_form = infer_dosage_form(name, category_name)

                    product_defaults = {
                        'name': name,
                        'slug': desired_slug,
                        'category': category_obj,
                        'brand': brand_obj,
                        'description': description,
                        'detailed_description': description,
                        'short_description': description[:200] if len(description) > 200 else description,
                        'price': effective_mrp,
                        'price_inr': price_inr,
                        'original_price_inr': effective_mrp,
                        'discount_percent': discount_pct,
                        'discount_percentage': discount_pct,
                        'stock_quantity': stock_qty,
                        'prescription_required': prescription_required,
                        'requires_prescription': prescription_required,
                        'image_url': image_url,
                        'image_status': image_status,
                        'image_source': image_source,
                        'is_demo_data': is_demo_data,
                        'is_active': is_active,
                        'dosage_form': dosage_form,
                    }

                    product, created = Product.objects.update_or_create(
                        sku=sku,
                        defaults=product_defaults
                    )

                    if created:
                        rows_imported += 1
                    else:
                        rows_updated += 1

                except Exception as ex:
                    self.stdout.write(self.style.ERROR(f"Error importing row {row_idx} ({sku}): {ex}"))
                    rows_error += 1

        self.stdout.write(self.style.SUCCESS(
            f"Import complete! Created: {rows_imported}, Updated: {rows_updated}, Skipped: {rows_skipped}, Errors: {rows_error}"
        ))
