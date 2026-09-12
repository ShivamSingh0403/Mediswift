from rest_framework import serializers
from apps.products.models import Category, Brand, Product, ProductImage

class ProductImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ('id', 'image', 'image_url', 'url', 'alt_text', 'is_primary', 'source', 'status', 'license')

    def get_url(self, obj):
        if obj.image_url:
            return obj.image_url
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
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
    primary_image = serializers.SerializerMethodField()
    discounted_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    in_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = (
            'id', 'name', 'slug', 'generic_name', 'category_name', 'brand_name',
            'dosage_form', 'strength', 'pack_size', 'price', 'discount_percent',
            'discounted_price', 'stock_quantity', 'in_stock', 'rating', 'review_count',
            'prescription_required', 'requires_prescription', 'primary_image'
        )

    def get_primary_image(self, obj):
        if obj.image_url:
            return obj.image_url
        first_img = obj.images.filter(is_primary=True).first() or obj.images.first()
        if first_img:
            if first_img.image_url:
                return first_img.image_url
            if first_img.image:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(first_img.image.url)
                return first_img.image.url
        return None

class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    brand_name = serializers.CharField(source='brand.name', read_only=True, default='')
    primary_image = serializers.SerializerMethodField()
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
            'primary_image', 'image_url', 'image_status', 'image_source', 'image_alt_text', 'image_license', 'is_demo_data',
            'short_description', 'tags'
        )

    def get_primary_image(self, obj):
        if obj.image_url:
            return obj.image_url
        first_img = obj.images.filter(is_primary=True).first() or obj.images.first()
        if first_img:
            if first_img.image_url:
                return first_img.image_url
            if first_img.image:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(first_img.image.url)
                return first_img.image.url
        return None

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
    primary_image = serializers.SerializerMethodField()
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
            'image_url', 'image_status', 'image_source', 'image_alt_text', 'image_license', 'is_demo_data', 'additional_images', 'primary_image', 'gallery_images', 'images',
            'short_description', 'detailed_description', 'description',
            'composition', 'ingredients', 'usage_instructions', 'directions',
            'side_effects', 'warnings', 'storage_information', 'tags',
            'related_products', 'is_active', 'created_at', 'updated_at'
        )

    def get_primary_image(self, obj):
        if obj.image_url:
            return obj.image_url
        first_img = obj.images.filter(is_primary=True).first() or obj.images.first()
        if first_img:
            return first_img.image_url or (first_img.image.url if first_img.image else None)
        return None

    def get_gallery_images(self, obj):
        urls = []
        if obj.image_url:
            urls.append(obj.image_url)
        if obj.additional_images:
            for u in obj.additional_images:
                if u not in urls:
                    urls.append(u)
        for img in obj.images.all():
            u = img.image_url or (img.image.url if img.image else None)
            if u and u not in urls:
                urls.append(u)
        return urls

    def get_related_products(self, obj):
        # Intelligent recommendation based on same category, high rating, and brand
        related = Product.objects.filter(
            is_active=True,
            category=obj.category
        ).exclude(id=obj.id).order_by('-rating', '-review_count')[:6]

        return RelatedProductSerializer(related, many=True, context=self.context).data
