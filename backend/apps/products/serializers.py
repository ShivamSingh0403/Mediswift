from rest_framework import serializers
from apps.products.models import Category, Brand, Product, ProductImage

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ('id', 'image', 'alt_text', 'is_primary')

class CategorySerializer(serializers.ModelSerializer):
    subcategories_count = serializers.IntegerField(source='subcategories.count', read_only=True)

    class Meta:
        model = Category
        fields = ('id', 'name', 'slug', 'description', 'image', 'parent', 'subcategories_count', 'is_active')

class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ('id', 'name', 'slug', 'logo')

class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    brand_name = serializers.CharField(source='brand.name', read_only=True, default='')
    primary_image = serializers.SerializerMethodField()
    discounted_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    in_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = (
            'id', 'name', 'slug', 'generic_name', 'category', 'category_name',
            'brand', 'brand_name', 'dosage_form', 'pack_size', 'price',
            'discount_percent', 'discounted_price', 'stock_quantity', 'in_stock',
            'prescription_required', 'primary_image'
        )

    def get_primary_image(self, obj):
        first_img = obj.images.filter(is_primary=True).first() or obj.images.first()
        if first_img and first_img.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(first_img.image.url)
            return first_img.image.url
        return None

class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    brand = BrandSerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    discounted_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    in_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = (
            'id', 'name', 'slug', 'generic_name', 'composition', 'category',
            'brand', 'description', 'usage_instructions', 'side_effects',
            'dosage_form', 'pack_size', 'manufacturer', 'price', 'discount_percent',
            'discounted_price', 'stock_quantity', 'in_stock', 'sku',
            'prescription_required', 'is_active', 'images', 'created_at'
        )
