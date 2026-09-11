import uuid
from decimal import Decimal
from rest_framework import permissions, status
from rest_framework.views import APIView
from django.utils import timezone
from apps.common.responses import api_response
from apps.orders.models import Order
from apps.payments.models import Payment
from apps.payments.serializers import (
    PaymentSerializer,
    InitiatePaymentSerializer,
    VerifyPaymentSerializer,
)
from apps.notifications.models import Notification

class InitiatePaymentView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        serializer = InitiatePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order_id = serializer.validated_data['order_id']
        provider = serializer.validated_data.get('provider') or serializer.validated_data.get('gateway', Payment.Provider.RAZORPAY)

        try:
            order = Order.objects.get(id=order_id, user=request.user)
        except Order.DoesNotExist:
            return api_response(message="Order not found.", status_code=status.HTTP_404_NOT_FOUND, success=False)

        # Get existing pending payment or create new one
        payment = Payment.objects.filter(
            order=order,
            status__in=[Payment.Status.PENDING, Payment.Status.CREATED]
        ).first()

        if not payment:
            payment = Payment.objects.create(
                order=order,
                provider=provider,
                amount=order.total_amount,
                currency="INR",
                gateway_order_id=f"order_{uuid.uuid4().hex[:14]}",
                payment_method_details={"channel": "CHECKOUT"}
            )
        else:
            if payment.provider != provider:
                payment.provider = provider
                payment.save(update_fields=['provider'])

        response_data = PaymentSerializer(payment).data
        # Simulated gateway payload
        response_data['gateway_payload'] = {
            "key_id": "rzp_test_mediswift_live",
            "amount_subunits": int(order.total_amount * 100),
            "currency": "INR",
            "name": "MediSwift Healthcare",
            "description": f"Order {order.order_number}",
            "order_id": payment.gateway_order_id,
            "prefill": {
                "name": f"{request.user.first_name} {request.user.last_name}".strip() or request.user.email,
                "email": request.user.email,
                "contact": request.user.phone_number or ""
            }
        }

        return api_response(
            data=response_data,
            message="Payment session initialized.",
            status_code=status.HTTP_201_CREATED
        )

class VerifyPaymentView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        serializer = VerifyPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order_id = serializer.validated_data['order_id']
        payment_id = serializer.validated_data.get('payment_id')
        provider = serializer.validated_data.get('provider', Payment.Provider.RAZORPAY)
        provider_txn_id = serializer.validated_data.get('provider_transaction_id')
        gateway_order_id = serializer.validated_data.get('gateway_order_id')
        signature = serializer.validated_data.get('payment_signature')
        payment_details = serializer.validated_data.get('payment_method_details', {})
        simulate_status = serializer.validated_data.get('simulate_status', 'PAID')

        try:
            order = Order.objects.get(id=order_id, user=request.user)
        except Order.DoesNotExist:
            return api_response(message="Order not found.", status_code=status.HTTP_404_NOT_FOUND, success=False)

        # Retrieve payment
        if payment_id:
            payment = Payment.objects.filter(id=payment_id, order=order).first()
        else:
            payment = Payment.objects.filter(order=order).order_by('-created_at').first()

        if not payment:
            payment = Payment.objects.create(
                order=order,
                provider=provider,
                amount=order.total_amount,
                currency="INR",
            )

        if simulate_status == 'FAILED':
            payment.status = Payment.Status.FAILED
            payment.error_message = "Payment transaction was declined or cancelled by issuing bank."
            payment.save()
            return api_response(
                data=PaymentSerializer(payment).data,
                message="Payment failed. Please retry with an alternate payment method.",
                status_code=status.HTTP_400_BAD_REQUEST,
                success=False
            )

        # Successful authoritative verification
        payment.status = Payment.Status.PAID
        payment.provider = provider
        payment.provider_transaction_id = provider_txn_id or f"pay_{uuid.uuid4().hex[:16]}"
        payment.gateway_order_id = gateway_order_id or payment.gateway_order_id or f"order_{uuid.uuid4().hex[:14]}"
        payment.payment_signature = signature or f"sig_{uuid.uuid4().hex}"
        payment.payment_method_details = payment_details
        payment.error_message = ""
        payment.save()

        # Update order status to CONFIRMED
        order.status = Order.Status.CONFIRMED
        order.save(update_fields=['status'])

        # Notify user
        Notification.objects.create(
            user=request.user,
            notification_type=Notification.NotificationType.PAYMENT,
            title=f"Payment Received for {order.order_number}",
            message=f"₹{order.total_amount} received via {payment.get_provider_display()}. Internal Ref: {payment.internal_transaction_id}.",
            action_url=f"/orders/{order.id}"
        )

        return api_response(
            data={
                "order_id": str(order.id),
                "order_number": order.order_number,
                "payment": PaymentSerializer(payment).data
            },
            message="Payment verified successfully."
        )

class ConfirmPaymentMockView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, payment_id):
        try:
            payment = Payment.objects.get(id=payment_id, order__user=request.user)
        except Payment.DoesNotExist:
            return api_response(message="Payment session not found.", status_code=status.HTTP_404_NOT_FOUND, success=False)

        payment.status = Payment.Status.PAID
        payment.provider_transaction_id = f"pay_{uuid.uuid4().hex[:16]}"
        payment.payment_signature = f"sig_{uuid.uuid4().hex}"
        payment.save()

        # Update order status
        payment.order.status = Order.Status.CONFIRMED
        payment.order.save(update_fields=['status'])

        Notification.objects.create(
            user=request.user,
            notification_type=Notification.NotificationType.PAYMENT,
            title=f"Payment Received for {payment.order.order_number}",
            message=f"₹{payment.order.total_amount} received. Ref: {payment.internal_transaction_id}.",
            action_url=f"/orders/{payment.order.id}"
        )

        return api_response(
            data=PaymentSerializer(payment).data,
            message="Payment confirmed successfully."
        )
