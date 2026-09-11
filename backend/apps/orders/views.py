import uuid
import random
import string
from decimal import Decimal
from datetime import timedelta

from django.db import transaction
from django.utils import timezone
from django.shortcuts import get_object_or_404

from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.decorators import action

from apps.common.responses import api_response
from apps.orders.models import Order, OrderItem, Coupon
from apps.orders.serializers import (
    OrderSerializer,
    CheckoutSerializer,
    CouponSerializer,
    ValidateCouponSerializer,
)
from apps.cart.models import Cart, CartItem
from apps.users.models import Address
from apps.prescriptions.models import Prescription
from apps.payments.models import Payment
from apps.notifications.models import Notification

def is_valid_uuid(val):
    try:
        uuid.UUID(str(val))
        return True
    except (ValueError, AttributeError, TypeError):
        return False

class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = (permissions.IsAuthenticated,)
    lookup_field = 'id'

    def get_queryset(self):
        user = self.request.user
        base_qs = Order.objects.select_related(
            'shipping_address', 'user', 'coupon', 'prescription'
        ).prefetch_related('items__product', 'payments')

        if user.role in ('ADMIN', 'DELIVERY_MANAGER'):
            return base_qs.all()
        return base_qs.filter(user=user)

    def get_object(self):
        lookup = self.kwargs.get(self.lookup_field)
        queryset = self.filter_queryset(self.get_queryset())
        if is_valid_uuid(lookup):
            obj = get_object_or_404(queryset, id=lookup)
        else:
            obj = get_object_or_404(queryset, order_number=lookup)
        self.check_object_permissions(self.request, obj)
        return obj

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return api_response(data=serializer.data, message="Orders retrieved successfully.")

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return api_response(data=serializer.data, message="Order details retrieved successfully.")

    @action(detail=True, methods=['post'], url_path='reorder')
    def reorder(self, request, id=None):
        order = self.get_object()
        cart, _ = Cart.objects.get_or_create(user=request.user)

        added_items = []
        unavailable_items = []

        for item in order.items.select_related('product'):
            product = item.product
            if not product or not product.is_active or product.stock_quantity <= 0:
                unavailable_items.append(item.product_name)
                continue

            qty_to_add = min(item.quantity, product.stock_quantity)
            cart_item, created = CartItem.objects.get_or_create(
                cart=cart,
                product=product,
                defaults={'quantity': qty_to_add}
            )
            if not created:
                cart_item.quantity = min(cart_item.quantity + qty_to_add, product.stock_quantity)
                cart_item.save(update_fields=['quantity'])

            added_items.append({
                "product_id": str(product.id),
                "name": product.name,
                "quantity": qty_to_add
            })

        message = f"Added {len(added_items)} item(s) from order {order.order_number} to your cart."
        if unavailable_items:
            message += f" Note: {', '.join(unavailable_items)} are currently out of stock."

        return api_response(
            data={"added_items": added_items, "unavailable_items": unavailable_items, "cart_total_items": cart.total_items},
            message=message
        )

class ValidateCouponView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        serializer = ValidateCouponSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        code = serializer.validated_data['code'].strip()
        subtotal = serializer.validated_data.get('subtotal')

        if not subtotal or subtotal <= 0:
            try:
                cart = Cart.objects.get(user=request.user)
                subtotal = cart.subtotal
            except Cart.DoesNotExist:
                subtotal = Decimal('0.00')

        try:
            coupon = Coupon.objects.get(code__iexact=code, is_active=True)
        except Coupon.DoesNotExist:
            return api_response(
                message="Invalid coupon code. Please check and try again.",
                status_code=status.HTTP_400_BAD_REQUEST,
                success=False
            )

        is_valid, msg = coupon.is_valid_for(subtotal)
        if not is_valid:
            return api_response(message=msg, status_code=status.HTTP_400_BAD_REQUEST, success=False)

        discount = coupon.calculate_discount(subtotal)
        return api_response(
            data={
                "coupon": CouponSerializer(coupon).data,
                "discount_amount": str(discount),
                "subtotal": str(subtotal),
                "final_amount": str(max(Decimal('0.00'), subtotal - discount))
            },
            message=f"Coupon applied! You saved ₹{discount}."
        )

class AvailableCouponsView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        now = timezone.now()
        coupons = Coupon.objects.filter(is_active=True).filter(
            models_valid_to=None
        ) if False else Coupon.objects.filter(is_active=True)

        valid_coupons = []
        for c in coupons:
            if c.valid_to and now > c.valid_to:
                continue
            if c.valid_from and now < c.valid_from:
                continue
            if c.usage_limit and c.times_used >= c.usage_limit:
                continue
            valid_coupons.append(c)

        serializer = CouponSerializer(valid_coupons, many=True)
        return api_response(data=serializer.data, message="Available coupons retrieved.")

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

        cart_items = list(cart.items.all())
        if not cart_items:
            return api_response(message="Shopping cart is empty.", status_code=status.HTTP_400_BAD_REQUEST, success=False)

        # 1. Inventory pre-check
        for item in cart_items:
            if not item.product or not item.product.is_active:
                return api_response(
                    message=f"'{item.product_name}' is currently unavailable for order.",
                    status_code=status.HTTP_400_BAD_REQUEST,
                    success=False
                )
            if item.product.stock_quantity < item.quantity:
                return api_response(
                    message=f"Insufficient inventory for '{item.product_name}'. Only {item.product.stock_quantity} units available.",
                    status_code=status.HTTP_400_BAD_REQUEST,
                    success=False
                )

        # 2. Shipping Address verification & snapshot
        try:
            address = Address.objects.get(id=data['shipping_address_id'], user=request.user)
        except Address.DoesNotExist:
            return api_response(message="Invalid delivery address selected.", status_code=status.HTTP_400_BAD_REQUEST, success=False)

        address_snapshot = {
            "full_name": address.full_name,
            "phone": address.phone,
            "address_line1": address.address_line1,
            "address_line2": address.address_line2,
            "landmark": address.landmark,
            "city": address.city,
            "state": address.state,
            "postal_code": address.postal_code,
            "address_type": address.address_type,
        }

        # 3. Prescription requirement verification
        prescription = None
        prescription_id = data.get('prescription_id')
        if prescription_id:
            try:
                prescription = Prescription.objects.get(id=prescription_id, patient=request.user)
                if prescription.status == Prescription.Status.REJECTED:
                    return api_response(
                        message="The attached prescription has been rejected by our pharmacist. Please provide a valid prescription.",
                        status_code=status.HTTP_400_BAD_REQUEST,
                        success=False
                    )
            except Prescription.DoesNotExist:
                return api_response(message="Prescription record not found.", status_code=status.HTTP_400_BAD_REQUEST, success=False)
        elif cart.requires_prescription:
            return api_response(
                message="Prescription verification is mandatory for one or more regulated medicines in your cart. Please upload or select a valid prescription to proceed.",
                status_code=status.HTTP_400_BAD_REQUEST,
                success=False
            )

        # 4. Financial calculations (Subtotal, Coupon Discount, Delivery Fee, Platform Fee, Total)
        subtotal = cart.subtotal
        coupon = None
        coupon_code_input = data.get('coupon_code', '').strip()
        discount_amount = Decimal('0.00')

        if coupon_code_input:
            try:
                coupon = Coupon.objects.get(code__iexact=coupon_code_input, is_active=True)
                is_valid, msg = coupon.is_valid_for(subtotal)
                if not is_valid:
                    return api_response(message=msg, status_code=status.HTTP_400_BAD_REQUEST, success=False)
                discount_amount = coupon.calculate_discount(subtotal)
                coupon.times_used += 1
                coupon.save(update_fields=['times_used'])
            except Coupon.DoesNotExist:
                return api_response(message="Coupon code is not recognized.", status_code=status.HTTP_400_BAD_REQUEST, success=False)

        # Standard Indian delivery policy: Free delivery above ₹500, else ₹49
        delivery_fee = Decimal('0.00') if subtotal >= Decimal('500.00') else Decimal('49.00')
        platform_fee = Decimal('5.00')
        total_amount = max(Decimal('0.00'), subtotal - discount_amount + delivery_fee + platform_fee)

        tracking_number = "MS-TRK-" + ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        now_time = timezone.now()
        now_iso = now_time.isoformat()

        # 5. Build initial 8-stage delivery timeline checkpoints
        delivery_timeline = [
            {
                "status": "PLACED",
                "title": "Order Placed",
                "description": "Your order has been logged into the MediSwift centralized fulfillment network.",
                "timestamp": now_iso,
                "completed": True
            },
            {
                "status": "CONFIRMED",
                "title": "Order Confirmed",
                "description": "Prescription validated and dispensary allocation initiated.",
                "timestamp": now_iso,
                "completed": True
            },
            {
                "status": "PROCESSING",
                "title": "Dispensing & Packing",
                "description": "Medicines being picked from temperature-controlled storage and batch verified.",
                "timestamp": None,
                "completed": False
            },
            {
                "status": "PACKED",
                "title": "Packed in Tamper-Proof Seal",
                "description": "Packed with cold-chain safeguards and verified by registered pharmacist.",
                "timestamp": None,
                "completed": False
            },
            {
                "status": "SHIPPED",
                "title": "Dispatched to Courier",
                "description": "Transferred to MediSwift Express Logistics dispatch hub.",
                "timestamp": None,
                "completed": False
            },
            {
                "status": "OUT_FOR_DELIVERY",
                "title": "Out for Delivery",
                "description": "Assigned to delivery executive for final doorstep delivery.",
                "timestamp": None,
                "completed": False
            },
            {
                "status": "DELIVERED",
                "title": "Delivered",
                "description": "Package delivered to verified recipient.",
                "timestamp": None,
                "completed": False
            }
        ]

        payment_method = data.get('payment_method', Payment.Provider.RAZORPAY)

        # 6. Create Order record
        order = Order.objects.create(
            user=request.user,
            shipping_address=address,
            shipping_address_snapshot=address_snapshot,
            subtotal=subtotal,
            discount_amount=discount_amount,
            delivery_fee=delivery_fee,
            platform_fee=platform_fee,
            total_amount=total_amount,
            coupon=coupon,
            coupon_code=coupon.code if coupon else '',
            prescription=prescription,
            courier_name="MediSwift Express Healthcare Fleet",
            courier_tracking_url="https://track.mediswift.in/track/" + tracking_number,
            tracking_number=tracking_number,
            estimated_delivery=now_time.date() + timedelta(days=2),
            delivery_notes=data.get('delivery_notes', ''),
            delivery_timeline=delivery_timeline,
            status=Order.Status.CONFIRMED if payment_method == Payment.Provider.COD else Order.Status.PENDING,
        )

        # 7. Create Order items and decrement inventory atomically
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
            item.product.stock_quantity -= item.quantity
            item.product.save(update_fields=['stock_quantity'])

        OrderItem.objects.bulk_create(order_items)

        # 8. Create Payment record
        payment_status = Payment.Status.CREATED if payment_method == Payment.Provider.COD else Payment.Status.PENDING
        payment = Payment.objects.create(
            order=order,
            provider=payment_method,
            amount=total_amount,
            currency="INR",
            status=payment_status,
            gateway_order_id=f"order_{uuid.uuid4().hex[:14]}",
            payment_method_details={
                "method": payment_method,
                "channel": "WEB_CHECKOUT"
            }
        )

        # 9. Create user in-app notification
        Notification.objects.create(
            user=request.user,
            notification_type=Notification.NotificationType.ORDER,
            title=f"Order {order.order_number} Received",
            message=f"Your order for ₹{total_amount} has been received and logged successfully.",
            action_url=f"/orders/{order.id}"
        )

        # 10. Clear cart items
        cart.items.all().delete()

        return api_response(
            data={
                "order": OrderSerializer(order, context={'request': request}).data,
                "payment": {
                    "id": str(payment.id),
                    "internal_transaction_id": payment.internal_transaction_id,
                    "provider": payment.provider,
                    "amount": str(payment.amount),
                    "status": payment.status,
                    "gateway_order_id": payment.gateway_order_id,
                }
            },
            message="Order placed successfully.",
            status_code=status.HTTP_201_CREATED
        )
