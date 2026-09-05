from rest_framework import serializers
from apps.payments.models import Payment

class PaymentSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    gateway_display = serializers.CharField(source='get_gateway_display', read_only=True)

    class Meta:
        model = Payment
        fields = (
            'id', 'order', 'gateway', 'gateway_display', 'transaction_id',
            'gateway_order_id', 'amount', 'currency', 'status', 'status_display',
            'refund_id', 'created_at'
        )
        read_only_fields = ('id', 'status', 'status_display', 'created_at')

class InitiatePaymentSerializer(serializers.Serializer):
    order_id = serializers.UUIDField()
    gateway = serializers.ChoiceField(choices=Payment.Gateway.choices, default=Payment.Gateway.RAZORPAY)
