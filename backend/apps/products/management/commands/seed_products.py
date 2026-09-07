"""
Django management command to seed MediSwift production-grade healthcare catalog.
Seeds 20 rich healthcare categories, authentic brands, and 260+ unique, clinically realistic products.
Idempotent and safe to run multiple times without duplicating data.
"""
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from apps.products.models import Category, Brand, Product, ProductImage
from apps.products.image_mapper import get_category_image, get_product_images
from apps.products.catalog_data import ALL_CATEGORIES, ALL_PRODUCTS

class Command(BaseCommand):
    help = 'Seeds production-grade healthcare catalog with 20 categories, brands, and 260+ products'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force-update',
            action='store_true',
            help='Force overwrite existing product fields with catalog defaults',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING('Starting MediSwift Product Catalog Seeder...'))

        # 1. Seed Categories
        category_map = {}
        cat_created_count = 0
        cat_updated_count = 0

        for cat_data in ALL_CATEGORIES:
            slug = cat_data['slug']
            banner_img = get_category_image(slug)

            category, created = Category.objects.update_or_create(
                name=cat_data['name'],
                defaults={
                    'slug': slug,
                    'description': cat_data['description'],
                    'image_url': banner_img,
                    'is_active': True,
                }
            )
            category_map[slug] = category
            if created:
                cat_created_count += 1
            else:
                cat_updated_count += 1

        self.stdout.write(self.style.SUCCESS(
            f'Categories Processed: {len(category_map)} (Created: {cat_created_count}, Updated: {cat_updated_count})'
        ))

        # 2. Seed Brands
        # Collect all unique brands from product catalog
        brand_map = {}
        unique_brand_names = sorted(list(set(p['brand_name'] for p in ALL_PRODUCTS if p.get('brand_name'))))
        brand_created_count = 0

        for brand_name in unique_brand_names:
            brand_slug = slugify(brand_name)
            brand, created = Brand.objects.update_or_create(
                name=brand_name,
                defaults={'slug': brand_slug}
            )
            brand_map[brand_name] = brand
            if created:
                brand_created_count += 1

        self.stdout.write(self.style.SUCCESS(
            f'Brands Processed: {len(brand_map)} (Created: {brand_created_count})'
        ))

        # 3. Seed Products
        prod_created_count = 0
        prod_updated_count = 0

        for idx, prod_data in enumerate(ALL_PRODUCTS):
            cat_slug = prod_data['category_slug']
            category = category_map.get(cat_slug)
            if not category:
                self.stderr.write(f"Category slug '{cat_slug}' not found for product '{prod_data['name']}'")
                continue

            brand = brand_map.get(prod_data.get('brand_name'))

            # Semantic Image Mapping
            primary_img, gallery_imgs = get_product_images(
                category_slug=cat_slug,
                product_slug=prod_data['slug'],
                index_hint=idx
            )

            # Price calculations in INR
            mrp_price = Decimal(str(prod_data['price']))
            discount_pct = Decimal(str(prod_data['discount_percent']))
            selling_price = (mrp_price * (Decimal('1') - (discount_pct / Decimal('100')))).quantize(Decimal('0.01'))

            dosage_form = getattr(Product.DosageForm, prod_data.get('dosage_form', 'TABLET'), Product.DosageForm.TABLET)

            # Prepare update defaults
            product_defaults = {
                'name': prod_data['name'],
                'slug': prod_data['slug'],
                'generic_name': prod_data.get('generic_name', ''),
                'composition': prod_data.get('composition', ''),
                'ingredients': prod_data.get('composition', ''),
                'category': category,
                'brand': brand,
                'manufacturer': prod_data.get('manufacturer', ''),
                'dosage_form': dosage_form,
                'strength': prod_data.get('strength', ''),
                'pack_size': prod_data.get('pack_size', ''),
                'price': mrp_price,
                'original_price_inr': mrp_price,
                'discount_percent': discount_pct,
                'discount_percentage': discount_pct,
                'price_inr': selling_price,
                'stock_quantity': prod_data.get('stock_quantity', 100),
                'rating': Decimal(str(prod_data.get('rating', '4.5'))),
                'review_count': prod_data.get('review_count', 50),
                'prescription_required': prod_data.get('prescription_required', False),
                'requires_prescription': prod_data.get('prescription_required', False),
                'featured': prod_data.get('featured', False),
                'trending': prod_data.get('trending', False),
                'bestseller': prod_data.get('bestseller', False),
                'image_url': primary_img,
                'additional_images': gallery_imgs,
                'short_description': prod_data.get('short_description', ''),
                'detailed_description': prod_data.get('detailed_description', ''),
                'description': prod_data.get('detailed_description', ''),
                'directions': prod_data.get('directions', ''),
                'usage_instructions': prod_data.get('directions', ''),
                'warnings': prod_data.get('warnings', ''),
                'side_effects': prod_data.get('warnings', ''),
                'storage_information': prod_data.get('storage_information', 'Store below 25°C in a cool dry place.'),
                'tags': prod_data.get('tags', []),
                'is_active': True,
            }

            # Find by slug or sku to safely handle any prior demo records
            existing_prod = Product.objects.filter(slug=prod_data['slug']).first() or Product.objects.filter(sku=prod_data['sku']).first()
            if existing_prod:
                for field_name, field_val in product_defaults.items():
                    setattr(existing_prod, field_name, field_val)
                existing_prod.sku = prod_data['sku']
                existing_prod.slug = prod_data['slug']
                existing_prod.save()
                product = existing_prod
                created = False
            else:
                product = Product.objects.create(
                    sku=prod_data['sku'],
                    **product_defaults
                )
                created = True

            # Ensure related ProductImage records exist for backward-compatible gallery views
            ProductImage.objects.filter(product=product).delete()
            ProductImage.objects.create(
                product=product,
                image_url=primary_img,
                alt_text=f"{product.name} Primary Image",
                is_primary=True
            )
            for g_idx, g_url in enumerate(gallery_imgs):
                ProductImage.objects.create(
                    product=product,
                    image_url=g_url,
                    alt_text=f"{product.name} Gallery View {g_idx + 1}",
                    is_primary=False
                )

            if created:
                prod_created_count += 1
            else:
                prod_updated_count += 1

        total_in_db = Product.objects.count()
        rx_count = Product.objects.filter(prescription_required=True).count()
        otc_count = Product.objects.filter(prescription_required=False).count()
        featured_count = Product.objects.filter(featured=True).count()

        self.stdout.write(self.style.SUCCESS(
            f'\n======================================================\n'
            f'MEDISWIFT CATALOG SEEDING COMPLETED SUCCESSFULLY!\n'
            f'======================================================\n'
            f'Total Categories in Database : {Category.objects.count()}\n'
            f'Total Brands in Database     : {Brand.objects.count()}\n'
            f'Products Seeded (New)        : {prod_created_count}\n'
            f'Products Updated (Existing)  : {prod_updated_count}\n'
            f'Total Products in Database   : {total_in_db}\n'
            f'  - Rx Required Products     : {rx_count}\n'
            f'  - OTC Products             : {otc_count}\n'
            f'  - Featured Products        : {featured_count}\n'
            f'======================================================'
        ))
