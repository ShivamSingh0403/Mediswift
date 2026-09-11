from rest_framework import serializers
from apps.payments.models import Payment

class PaymentSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    provider_display = serializers.CharField(source='get_provider_display', read_only=True)
    gateway_display = serializers.CharField(source='get_provider_display', read_only=True)

    class Meta:
        model = Payment
        fields = (
            'id', 'order', 'provider', 'provider_display', 'gateway', 'gateway_display',
            'internal_transaction_id', 'provider_transaction_id', 'transaction_id',
            'gateway_order_id', 'amount', 'currency', 'status', 'status_display',
            'payment_method_details', 'refund_id', 'error_message', 'created_at'
        )
        read_only_fields = ('id', 'internal_transaction_id', 'status', 'status_display', 'created_at')

class InitiatePaymentSerializer(serializers.Serializer):
    order_id = serializers.UUIDField()
    gateway = serializers.ChoiceField(choices=Payment.Provider.choices, default=Payment.Provider.RAZORPAY, required=False)
    provider = serializers.ChoiceField(choices=Payment.Provider.choices, default=Payment.Provider.RAZORPAY, required=False)

class VerifyPaymentSerializer(serializers.Serializer):
    order_id = serializers.UUIDField()
    payment_id = serializers.UUIDField(required=False)
    provider = serializers.ChoiceField(choices=Payment.Provider.choices, default=Payment.Provider.RAZORPAY)
    provider_transaction_id = serializers.CharField(max_length=150, required=False, allow_blank=True)
    gateway_order_id = serializers.CharField(max_length=150, required=False, allow_blank=True)
    payment_signature = serializers.CharField(max_length=255, required=False, allow_blank=True)
    payment_method_details = serializers.DictField(required=False, default=dict)
    simulate_status = serializers.ChoiceField(choices=['PAID', 'FAILED'], default='PAID', required=False)
