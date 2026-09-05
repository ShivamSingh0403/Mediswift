from rest_framework import serializers
from apps.cart.models import Cart, CartItem
from apps.products.serializers import ProductListSerializer
from apps.products.models import Product

class CartItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    product_id = serializers.UUIDField(write_only=True)
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ('id', 'product', 'product_id', 'quantity', 'unit_price', 'total_price')

    def create(self, validated_data):
        cart = self.context['cart']
        product_id = validated_data.pop('product_id')
        product = Product.objects.get(id=product_id)
        quantity = validated_data.get('quantity', 1)

        item, created = CartItem.objects.get_or_create(cart=cart, product=product, defaults={'quantity': quantity})
        if not created:
            item.quantity += quantity
            item.save()
        return item

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.IntegerField(read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    requires_prescription = serializers.BooleanField(read_only=True)

    class Meta:
        model = Cart
        fields = ('id', 'items', 'total_items', 'subtotal', 'requires_prescription', 'updated_at')
