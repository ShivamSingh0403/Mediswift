import uuid
import random
import string
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

class Order(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending Payment'
        CONFIRMED = 'CONFIRMED', 'Order Confirmed'
        PROCESSING = 'PROCESSING', 'Processing & Packing'
        DISPATCHED = 'DISPATCHED', 'Dispatched'
        OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY', 'Out for Delivery'
        DELIVERED = 'DELIVERED', 'Delivered'
        CANCELLED = 'CANCELLED', 'Cancelled'

    order_number = models.CharField(max_length=50, unique=True, default=generate_order_number, db_index=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    shipping_address = models.ForeignKey(Address, on_delete=models.PROTECT, related_name='orders')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.CONFIRMED, db_index=True)
    
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)

    prescription = models.ForeignKey(Prescription, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    tracking_number = models.CharField(max_length=100, blank=True)
    estimated_delivery = models.DateField(null=True, blank=True)
    delivery_notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['order_number']),
        ]

    def __str__(self):
        return f"Order {self.order_number} ({self.get_status_display()})"

class OrderItem(TimeStampedModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    product_name = models.CharField(max_length=255)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.quantity} x {self.product_name} in {self.order.order_number}"
