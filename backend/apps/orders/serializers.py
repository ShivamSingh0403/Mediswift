from rest_framework import serializers
from apps.orders.models import Order, OrderItem
from apps.users.serializers import AddressSerializer
from apps.products.serializers import ProductListSerializer

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ('id', 'product', 'product_name', 'unit_price', 'quantity', 'total_price')

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    shipping_address = AddressSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Order
        fields = (
            'id', 'order_number', 'status', 'status_display', 'subtotal',
            'discount_amount', 'delivery_fee', 'total_amount', 'shipping_address',
            'prescription', 'tracking_number', 'estimated_delivery', 'delivery_notes',
            'items', 'created_at'
        )

class CheckoutSerializer(serializers.Serializer):
    shipping_address_id = serializers.UUIDField()
    prescription_id = serializers.UUIDField(required=False, allow_null=True)
    delivery_notes = serializers.CharField(required=False, allow_blank=True, default='')
