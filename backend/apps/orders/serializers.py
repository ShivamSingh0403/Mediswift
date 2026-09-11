from rest_framework import serializers
from apps.orders.models import Order, OrderItem, Coupon
from apps.users.serializers import AddressSerializer
from apps.payments.models import Payment

class CouponSerializer(serializers.ModelSerializer):
    discount_type_display = serializers.CharField(source='get_discount_type_display', read_only=True)

    class Meta:
        model = Coupon
        fields = (
            'id', 'code', 'description', 'discount_type', 'discount_type_display',
            'discount_value', 'min_order_amount', 'max_discount_amount',
            'valid_from', 'valid_to', 'is_active'
        )

class ValidateCouponSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=50)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=0.00)

class OrderPaymentSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    provider_display = serializers.CharField(source='get_provider_display', read_only=True)

    class Meta:
        model = Payment
        fields = (
            'id', 'provider', 'provider_display', 'internal_transaction_id',
            'provider_transaction_id', 'amount', 'currency', 'status', 'status_display',
            'payment_method_details', 'created_at'
        )

class OrderItemSerializer(serializers.ModelSerializer):
    product_slug = serializers.CharField(source='product.slug', read_only=True)
    product_image = serializers.SerializerMethodField()
    prescription_required = serializers.BooleanField(source='product.prescription_required', read_only=True)

    class Meta:
        model = OrderItem
        fields = (
            'id', 'product', 'product_name', 'product_slug', 'product_image',
            'prescription_required', 'unit_price', 'quantity', 'total_price'
        )

    def get_product_image(self, obj):
        if not obj.product:
            return None
        if getattr(obj.product, 'image_url', None):
            return obj.product.image_url
        if hasattr(obj.product, 'images'):
            first_img = obj.product.images.filter(is_primary=True).first() or obj.product.images.first()
            if first_img:
                if getattr(first_img, 'image_url', None):
                    return first_img.image_url
                if getattr(first_img, 'image', None):
                    request = self.context.get('request')
                    if request:
                        return request.build_absolute_uri(first_img.image.url)
                    return first_img.image.url
        return None

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    shipping_address = AddressSerializer(read_only=True)
    coupon = CouponSerializer(read_only=True)
    payments = OrderPaymentSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Order
        fields = (
            'id', 'order_number', 'status', 'status_display', 'subtotal',
            'discount_amount', 'delivery_fee', 'platform_fee', 'total_amount',
            'shipping_address', 'shipping_address_snapshot', 'coupon', 'coupon_code',
            'prescription', 'courier_name', 'courier_tracking_url', 'tracking_number',
            'estimated_delivery', 'delivery_notes', 'delivery_timeline', 'items',
            'payments', 'created_at', 'updated_at'
        )

class CheckoutSerializer(serializers.Serializer):
    shipping_address_id = serializers.UUIDField()
    prescription_id = serializers.UUIDField(required=False, allow_null=True)
    coupon_code = serializers.CharField(required=False, allow_blank=True, default='')
    delivery_notes = serializers.CharField(required=False, allow_blank=True, default='')
    payment_method = serializers.CharField(required=False, default='RAZORPAY')
