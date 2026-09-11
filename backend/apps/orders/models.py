import uuid
import random
import string
from decimal import Decimal
from django.db import models
from django.utils import timezone
from apps.common.models import TimeStampedModel
from apps.users.models import User, Address
from apps.products.models import Product
from apps.prescriptions.models import Prescription

def generate_order_number():
    timestamp = timezone.now().strftime('%Y%m%d')
    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"MS-{timestamp}-{random_str}"

class Coupon(TimeStampedModel):
    class DiscountType(models.TextChoices):
        PERCENTAGE = 'PERCENTAGE', 'Percentage Discount'
        FIXED = 'FIXED', 'Fixed Amount Discount'

    code = models.CharField(max_length=50, unique=True, db_index=True)
    description = models.CharField(max_length=255, blank=True)
    discount_type = models.CharField(max_length=20, choices=DiscountType.choices, default=DiscountType.PERCENTAGE)
    discount_value = models.DecimalField(max_digits=10, decimal_places=2, help_text="Percentage (e.g. 20.00 for 20%) or Fixed INR amount (e.g. 50.00)")
    min_order_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    max_discount_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Maximum discount cap for percentage coupons")
    valid_from = models.DateTimeField(default=timezone.now)
    valid_to = models.DateTimeField(null=True, blank=True)
    usage_limit = models.PositiveIntegerField(null=True, blank=True, help_text="Total number of times this coupon can be redeemed")
    times_used = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.code} ({self.get_discount_type_display()} - {self.discount_value})"

    def is_valid_for(self, subtotal):
        now = timezone.now()
        if not self.is_active:
            return False, "This coupon is no longer active."
        if self.valid_from and now < self.valid_from:
            return False, "This coupon has not started yet."
        if self.valid_to and now > self.valid_to:
            return False, "This coupon has expired."
        if self.usage_limit and self.times_used >= self.usage_limit:
            return False, "This coupon has reached its maximum redemption limit."
        if subtotal < self.min_order_amount:
            return False, f"Minimum order value of ₹{self.min_order_amount} required for this coupon."
        return True, "Coupon is valid."

    def calculate_discount(self, subtotal):
        valid, _ = self.is_valid_for(subtotal)
        if not valid:
            return Decimal('0.00')

        if self.discount_type == self.DiscountType.PERCENTAGE:
            discount = (subtotal * self.discount_value / Decimal('100')).quantize(Decimal('0.01'))
            if self.max_discount_amount and discount > self.max_discount_amount:
                discount = self.max_discount_amount
            return discount
        else:
            return min(self.discount_value, subtotal).quantize(Decimal('0.01'))

class Order(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending Payment'
        PLACED = 'PLACED', 'Order Placed'
        CONFIRMED = 'CONFIRMED', 'Order Confirmed'
        PROCESSING = 'PROCESSING', 'Processing & Packing'
        PACKED = 'PACKED', 'Packed'
        SHIPPED = 'SHIPPED', 'Dispatched & Shipped'
        OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY', 'Out for Delivery'
        DELIVERED = 'DELIVERED', 'Delivered'
        CANCELLED = 'CANCELLED', 'Cancelled'

    order_number = models.CharField(max_length=50, unique=True, default=generate_order_number, db_index=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    shipping_address = models.ForeignKey(Address, on_delete=models.PROTECT, related_name='orders')
    shipping_address_snapshot = models.JSONField(default=dict, blank=True, help_text="Frozen snapshot of address at time of order")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.CONFIRMED, db_index=True)
    
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    platform_fee = models.DecimalField(max_digits=10, decimal_places=2, default=5.00)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)

    coupon = models.ForeignKey(Coupon, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    coupon_code = models.CharField(max_length=50, blank=True)

    prescription = models.ForeignKey(Prescription, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    courier_name = models.CharField(max_length=120, default="MediSwift Express Healthcare Fleet")
    courier_tracking_url = models.URLField(blank=True)
    tracking_number = models.CharField(max_length=100, blank=True)
    estimated_delivery = models.DateField(null=True, blank=True)
    delivery_notes = models.TextField(blank=True)
    delivery_timeline = models.JSONField(default=list, blank=True, help_text="Chronological delivery checkpoint events")

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['order_number']),
        ]

    def __str__(self):
        return f"Order {self.order_number} ({self.get_status_display()})"

    def add_timeline_event(self, status, description, location="Hub"):
        if self.delivery_timeline is None:
            self.delivery_timeline = []
        event = {
            "status": status,
            "description": description,
            "location": location,
            "timestamp": timezone.now().isoformat()
        }
        self.delivery_timeline.append(event)

class OrderItem(TimeStampedModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    product_name = models.CharField(max_length=255)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.quantity} x {self.product_name} in {self.order.order_number}"
