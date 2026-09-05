import uuid
from rest_framework import permissions, status
from rest_framework.views import APIView
from apps.common.responses import api_response
from apps.orders.models import Order
from apps.payments.models import Payment
from apps.payments.serializers import PaymentSerializer, InitiatePaymentSerializer

class InitiatePaymentView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        serializer = InitiatePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order_id = serializer.validated_data['order_id']
        gateway = serializer.validated_data['gateway']

        try:
            order = Order.objects.get(id=order_id, user=request.user)
        except Order.DoesNotExist:
            return api_response(message="Order not found.", status_code=status.HTTP_404_NOT_FOUND, success=False)

        # Create or fetch pending payment attempt
        payment, _ = Payment.objects.get_or_create(
            order=order,
            status=Payment.Status.PENDING,
            defaults={
                'gateway': gateway,
                'amount': order.total_amount,
                'gateway_order_id': f"order_{uuid.uuid4().hex[:14]}",
                'transaction_id': f"txn_{uuid.uuid4().hex[:16]}",
            }
        )

        return api_response(
            data=PaymentSerializer(payment).data,
            message="Payment session initialized.",
            status_code=status.HTTP_201_CREATED
        )

class ConfirmPaymentMockView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, payment_id):
        try:
            payment = Payment.objects.get(id=payment_id, order__user=request.user)
        except Payment.DoesNotExist:
            return api_response(message="Payment session not found.", status_code=status.HTTP_404_NOT_FOUND, success=False)

        payment.status = Payment.Status.SUCCESS
        payment.payment_signature = f"sig_{uuid.uuid4().hex}"
        payment.save()

        # Update order status
        payment.order.status = Order.Status.CONFIRMED
        payment.order.save(update_fields=['status'])

        return api_response(
            data=PaymentSerializer(payment).data,
            message="Payment confirmed successfully."
        )
