from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
import random
import string
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from apps.common.responses import api_response
from apps.orders.models import Order, OrderItem
from apps.orders.serializers import OrderSerializer, CheckoutSerializer
from apps.cart.models import Cart
from apps.users.models import Address
from apps.prescriptions.models import Prescription

class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = (permissions.IsAuthenticated,)
    lookup_field = 'id'

    def get_queryset(self):
        user = self.request.user
        if user.role in ('ADMIN', 'DELIVERY_MANAGER'):
            return Order.objects.all().select_related('shipping_address', 'user').prefetch_related('items')
        return Order.objects.filter(user=user).select_related('shipping_address').prefetch_related('items')

class CheckoutView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    @transaction.atomic
    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            cart = Cart.objects.prefetch_related('items__product').get(user=request.user)
        except Cart.DoesNotExist:
            return api_response(message="Shopping cart is empty.", status_code=status.HTTP_400_BAD_REQUEST, success=False)

        cart_items = cart.items.all()
        if not cart_items.exists():
            return api_response(message="Shopping cart is empty.", status_code=status.HTTP_400_BAD_REQUEST, success=False)

        try:
            address = Address.objects.get(id=data['shipping_address_id'], user=request.user)
        except Address.DoesNotExist:
            return api_response(message="Invalid delivery address selected.", status_code=status.HTTP_400_BAD_REQUEST, success=False)

        prescription = None
        prescription_id = data.get('prescription_id')
        if prescription_id:
            try:
                prescription = Prescription.objects.get(id=prescription_id, patient=request.user)
            except Prescription.DoesNotExist:
                return api_response(message="Prescription record not found.", status_code=status.HTTP_400_BAD_REQUEST, success=False)
        elif cart.requires_prescription:
            return api_response(
                message="Prescription upload is required for one or more medicines in your cart.",
                status_code=status.HTTP_400_BAD_REQUEST,
                success=False
            )

        subtotal = cart.subtotal
        delivery_fee = Decimal('0.00') if subtotal >= Decimal('500.00') else Decimal('49.00')
        total_amount = subtotal + delivery_fee
        tracking_number = "TRK" + ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))

        order = Order.objects.create(
            user=request.user,
            shipping_address=address,
            subtotal=subtotal,
            delivery_fee=delivery_fee,
            total_amount=total_amount,
            prescription=prescription,
            tracking_number=tracking_number,
            estimated_delivery=timezone.now().date() + timedelta(days=2),
            delivery_notes=data.get('delivery_notes', ''),
            status=Order.Status.CONFIRMED,
        )

        order_items = []
        for item in cart_items:
            order_items.append(
                OrderItem(
                    order=order,
                    product=item.product,
                    product_name=item.product.name,
                    unit_price=item.unit_price,
                    quantity=item.quantity,
                    total_price=item.total_price,
                )
            )
            # Update inventory
            if item.product.stock_quantity >= item.quantity:
                item.product.stock_quantity -= item.quantity
                item.product.save(update_fields=['stock_quantity'])

        OrderItem.objects.bulk_create(order_items)

        # Clear cart
        cart.items.all().delete()

        return api_response(
            data=OrderSerializer(order).data,
            message="Order placed successfully.",
            status_code=status.HTTP_201_CREATED
        )
