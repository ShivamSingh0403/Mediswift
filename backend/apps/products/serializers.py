from pathlib import Path
from django.conf import settings
from rest_framework import serializers
from apps.products.models import Category, Brand, Product, ProductImage


def resolve_product_image_url(obj, request=None):
    """
    Authoritative 4-tier image resolution:
    1. VERIFIED REAL PRODUCT IMAGE
    2. USER UPLOADED / PENDING AUTHORIZED IMAGE
    3. DEMO IMAGE (on disk or relation)
    4. GENERIC HEALTHCARE FALLBACK
    """
    # 1. Check for VERIFIED image in relations
    ver_img = obj.images.filter(image_status='VERIFIED').first()
    if ver_img:
        f = ver_img.image_file or ver_img.image
        if f and f.name:
            return request.build_absolute_uri(f.url) if request else f.url
        if ver_img.image_url:
            if ver_img.image_url.startswith('/media/'):
                return request.build_absolute_uri(ver_img.image_url) if request else ver_img.image_url
            return ver_img.image_url

    # 2. Check for USER_UPLOADED / PENDING_REVIEW / DOWNLOADED image in relations
    pending_img = obj.images.filter(image_status__in=['USER_UPLOADED', 'PENDING_REVIEW', 'DOWNLOADED']).first()
    if pending_img:
        f = pending_img.image_file or pending_img.image
        if f and f.name:
            return request.build_absolute_uri(f.url) if request else f.url
        if pending_img.image_url:
            if pending_img.image_url.startswith('/media/'):
                return request.build_absolute_uri(pending_img.image_url) if request else pending_img.image_url
            return pending_img.image_url

    # 3. Check for LICENSED image in relations
    lic_img = obj.images.filter(image_status='LICENSED').first()
    if lic_img:
        f = lic_img.image_file or lic_img.image
        if f and f.name:
            return request.build_absolute_uri(f.url) if request else f.url
        if lic_img.image_url:
            return request.build_absolute_uri(lic_img.image_url) if request and lic_img.image_url.startswith('/media/') else lic_img.image_url

    # 4. Check on-disk local media/products/<SKU>.webp or media/product_images/ai_demo/<SKU>.webp
    if obj.sku:
        sku = obj.sku.strip()
        prod_path = Path(settings.MEDIA_ROOT) / 'products' / f"{sku}.webp"
        if prod_path.exists():
            rel_url = f"/media/products/{sku}.webp"
            return request.build_absolute_uri(rel_url) if request else rel_url

        demo_path = Path(settings.MEDIA_ROOT) / 'product_images' / 'ai_demo' / f"{sku}.webp"
        if demo_path.exists():
            rel_url = f"/media/product_images/ai_demo/{sku}.webp"
            return request.build_absolute_uri(rel_url) if request else rel_url

    # 5. Check AI_DEMO_ONLY or DEMO image in relations
    demo_img = obj.images.filter(image_status__in=['AI_DEMO_ONLY', 'DEMO']).first()
    if demo_img:
        f = demo_img.image_file or demo_img.image
        if f and f.name:
            return request.build_absolute_uri(f.url) if request else f.url
        if demo_img.image_url:
            if demo_img.image_url.startswith('/media/'):
                return request.build_absolute_uri(demo_img.image_url) if request else demo_img.image_url
            return demo_img.image_url

    # 6. Fallback to product.image_url if populated
    if obj.image_url:
        if obj.image_url.startswith('/media/'):
            return request.build_absolute_uri(obj.image_url) if request else obj.image_url
        return obj.image_url

    # 7. Any primary image
    pimg = obj.images.filter(is_primary=True).first() or obj.images.first()
    if pimg:
        f = pimg.image_file or pimg.image
        if f and f.name:
            return request.build_absolute_uri(f.url) if request else f.url
        if pimg.image_url:
            if pimg.image_url.startswith('/media/'):
                return request.build_absolute_uri(pimg.image_url) if request else pimg.image_url
            return pimg.image_url

    # 8. Fallback to generic visual if exists
    fallback_path = Path(settings.MEDIA_ROOT) / 'products' / 'fallback-generic.webp'
    if fallback_path.exists():
        rel_url = '/media/products/fallback-generic.webp'
        return request.build_absolute_uri(rel_url) if request else rel_url

    return None


def resolve_canonical_image_status(obj):
    """
    Returns one of: DEMO, USER_UPLOADED, LICENSED, VERIFIED, MISSING
    """
    raw = (obj.image_status or '').upper()
    if raw == 'VERIFIED' and obj.is_real_product_photo:
        return 'VERIFIED'
    if raw in ('USER_UPLOADED', 'PENDING_REVIEW', 'DOWNLOADED'):
        return 'USER_UPLOADED'
    if raw == 'LICENSED':
        return 'LICENSED'
    if raw in ('AI_DEMO_ONLY', 'DEMO'):
        return 'DEMO'
    if raw == 'BROKEN':
        return 'BROKEN'
    if raw == 'DUPLICATE':
        return 'DUPLICATE'
    if resolve_product_image_url(obj):
        return 'DEMO'
    return 'MISSING'


class ProductImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = (
            'id', 'sku', 'image', 'image_url', 'url', 'alt_text', 'is_primary',
            'image_status', 'status', 'source_type', 'source', 'source_name', 'source_url',
            'is_real_product_photo', 'requires_real_photo_replacement',
            'license', 'license_note', 'image_hash', 'mime_type', 'width', 'height',
            'verified_by', 'verified_at', 'created_at', 'updated_at'
        )

    def get_url(self, obj):
        target = obj.image_file or obj.image
        if target and target.name:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(target.url)
            return target.url
        if obj.image_url:
            if obj.image_url.startswith('/media/'):
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.image_url)
            return obj.image_url
        return None


class CategorySerializer(serializers.ModelSerializer):
    subcategories_count = serializers.IntegerField(source='subcategories.count', read_only=True)
    products_count = serializers.IntegerField(source='products.count', read_only=True)

    class Meta:
        model = Category
        fields = (
            'id', 'name', 'slug', 'description', 'image', 'image_url',
            'parent', 'subcategories_count', 'products_count', 'is_active'
        )


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ('id', 'name', 'slug', 'logo', 'logo_url')


class RelatedProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    brand_name = serializers.CharField(source='brand.name', read_only=True, default='')
    image = serializers.SerializerMethodField()
    primary_image = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    image_status = serializers.SerializerMethodField()
    image_alt = serializers.CharField(source='image_alt_text', read_only=True)
    is_real_product_photo = serializers.BooleanField(read_only=True)
    discounted_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    in_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = (
            'id', 'name', 'slug', 'generic_name', 'sku', 'category_name', 'brand_name',
            'dosage_form', 'strength', 'pack_size', 'price', 'discount_percent',
            'discounted_price', 'stock_quantity', 'in_stock', 'rating', 'review_count',
            'prescription_required', 'requires_prescription',
            'image', 'image_url', 'image_status', 'image_alt', 'is_real_product_photo', 'primary_image'
        )

    def get_image(self, obj):
        return resolve_product_image_url(obj, self.context.get('request'))

    def get_primary_image(self, obj):
        return resolve_product_image_url(obj, self.context.get('request'))

    def get_image_url(self, obj):
        return resolve_product_image_url(obj, self.context.get('request'))

    def get_image_status(self, obj):
        return resolve_canonical_image_status(obj)


class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    brand_name = serializers.CharField(source='brand.name', read_only=True, default='')
    image = serializers.SerializerMethodField()
    primary_image = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    image_status = serializers.SerializerMethodField()
    image_alt = serializers.CharField(source='image_alt_text', read_only=True)
    is_real_product_photo = serializers.BooleanField(read_only=True)
    discounted_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    price_inr = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    original_price_inr = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    discount_percentage = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    in_stock = serializers.BooleanField(read_only=True)
    requires_prescription = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = (
            'id', 'name', 'slug', 'generic_name', 'sku', 'category', 'category_name', 'category_slug',
            'brand', 'brand_name', 'dosage_form', 'strength', 'pack_size',
            'price', 'price_inr', 'original_price_inr', 'discount_percent', 'discount_percentage',
            'discounted_price', 'stock_quantity', 'in_stock', 'rating', 'review_count',
            'prescription_required', 'requires_prescription', 'featured', 'trending', 'bestseller',
            'image', 'primary_image', 'image_url', 'image_status', 'image_alt', 'image_alt_text',
            'is_real_product_photo', 'image_source', 'source_url', 'image_license',
            'verified_by', 'verified_at', 'is_demo_data',
            'short_description', 'tags'
        )

    def get_image(self, obj):
        return resolve_product_image_url(obj, self.context.get('request'))

    def get_primary_image(self, obj):
        return resolve_product_image_url(obj, self.context.get('request'))

    def get_image_url(self, obj):
        return resolve_product_image_url(obj, self.context.get('request'))

    def get_image_status(self, obj):
        return resolve_canonical_image_status(obj)


class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    brand = BrandSerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    discounted_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    price_inr = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    original_price_inr = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    discount_percentage = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    in_stock = serializers.BooleanField(read_only=True)
    requires_prescription = serializers.BooleanField(read_only=True)
    image = serializers.SerializerMethodField()
    primary_image = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    image_status = serializers.SerializerMethodField()
    image_alt = serializers.CharField(source='image_alt_text', read_only=True)
    is_real_product_photo = serializers.BooleanField(read_only=True)
    gallery_images = serializers.SerializerMethodField()
    related_products = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            'id', 'name', 'slug', 'generic_name', 'sku', 'category', 'category_slug', 'category_name', 'brand',
            'manufacturer', 'dosage_form', 'strength', 'pack_size',
            'price', 'price_inr', 'original_price_inr', 'discount_percent', 'discount_percentage',
            'discounted_price', 'stock_quantity', 'in_stock', 'rating', 'review_count',
            'prescription_required', 'requires_prescription', 'featured', 'trending', 'bestseller',
            'image', 'image_url', 'image_status', 'image_alt', 'image_alt_text', 'is_real_product_photo',
            'image_source', 'source_url', 'image_license',
            'verified_by', 'verified_at', 'is_demo_data', 'additional_images', 'primary_image', 'gallery_images', 'images',
            'short_description', 'detailed_description', 'description',
            'composition', 'ingredients', 'usage_instructions', 'directions',
            'side_effects', 'warnings', 'storage_information', 'tags',
            'related_products', 'is_active', 'created_at', 'updated_at'
        )

    def get_image(self, obj):
        return resolve_product_image_url(obj, self.context.get('request'))

    def get_primary_image(self, obj):
        return resolve_product_image_url(obj, self.context.get('request'))

    def get_image_url(self, obj):
        return resolve_product_image_url(obj, self.context.get('request'))

    def get_image_status(self, obj):
        return resolve_canonical_image_status(obj)

    def get_gallery_images(self, obj):
        urls = []
        primary = resolve_product_image_url(obj, self.context.get('request'))
        if primary:
            urls.append(primary)
        if obj.additional_images:
            for u in obj.additional_images:
                if u and u not in urls:
                    urls.append(u)
        for img in obj.images.all():
            f = img.image_file or img.image
            u = None
            if f and f.name:
                request = self.context.get('request')
                u = request.build_absolute_uri(f.url) if request else f.url
            elif img.image_url:
                if img.image_url.startswith('/media/'):
                    request = self.context.get('request')
                    u = request.build_absolute_uri(img.image_url) if request else img.image_url
                else:
                    u = img.image_url
            if u and u not in urls:
                urls.append(u)
        return urls

    def get_related_products(self, obj):
        related = Product.objects.filter(
            is_active=True,
            category=obj.category
        ).exclude(id=obj.id).order_by('-rating', '-review_count')[:6]

        return RelatedProductSerializer(related, many=True, context=self.context).data


class ProductImageCandidateSerializer(serializers.ModelSerializer):
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    catalog_product_name = serializers.CharField(source='product.name', read_only=True)
    catalog_brand_name = serializers.CharField(source='product.brand.name', read_only=True, default='')

    class Meta:
        from apps.products.models import ProductImageCandidate
        model = ProductImageCandidate
        fields = (
            'id', 'product', 'product_sku', 'catalog_product_name', 'catalog_brand_name',
            'sku', 'product_name', 'brand', 'candidate_image_url', 'source_page_url',
            'source_domain', 'source_type', 'image_title', 'detected_alt_text',
            'rights_note', 'license_url', 'matching_confidence', 'status',
            'review_reason', 'downloaded_image', 'discovered_at', 'created_at'
        )
