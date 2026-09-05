from django.db import models
from apps.common.models import TimeStampedModel
from apps.orders.models import Order

class Payment(TimeStampedModel):
    class Gateway(models.TextChoices):
        RAZORPAY = 'RAZORPAY', 'Razorpay'
        STRIPE = 'STRIPE', 'Stripe'
        UPI = 'UPI', 'UPI Direct'
        COD = 'COD', 'Cash on Delivery'

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        SUCCESS = 'SUCCESS', 'Successful'
        FAILED = 'FAILED', 'Failed'
        REFUNDED = 'REFUNDED', 'Refunded'

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='payments')
    gateway = models.CharField(max_length=20, choices=Gateway.choices, default=Gateway.RAZORPAY)
    transaction_id = models.CharField(max_length=150, blank=True, db_index=True)
    gateway_order_id = models.CharField(max_length=150, blank=True)
    payment_signature = models.CharField(max_length=255, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=5, default='INR')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)
    refund_id = models.CharField(max_length=150, blank=True)
    error_message = models.TextField(blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Payment {self.id} for {self.order.order_number} ({self.get_status_display()})"
