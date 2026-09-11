import uuid
from django.db import models
from apps.common.models import TimeStampedModel
from apps.orders.models import Order

class Payment(TimeStampedModel):
    class Provider(models.TextChoices):
        RAZORPAY = 'RAZORPAY', 'Razorpay'
        PAYTM = 'PAYTM', 'Paytm'
        PHONEPE = 'PHONEPE', 'PhonePe'
        STRIPE = 'STRIPE', 'Stripe'
        UPI = 'UPI', 'UPI Direct'
        COD = 'COD', 'Cash on Delivery'
        CARD_MOCK = 'CARD_MOCK', 'Debit / Credit Card'

    Gateway = Provider

    class Status(models.TextChoices):
        CREATED = 'CREATED', 'Created'
        PENDING = 'PENDING', 'Pending'
        AUTHORIZED = 'AUTHORIZED', 'Authorized'
        PAID = 'PAID', 'Paid'
        SUCCESS = 'SUCCESS', 'Successful'
        FAILED = 'FAILED', 'Failed'
        REFUNDED = 'REFUNDED', 'Refunded'
        PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED', 'Partially Refunded'

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='payments')
    provider = models.CharField(max_length=30, choices=Provider.choices, default=Provider.RAZORPAY)
    internal_transaction_id = models.CharField(max_length=150, unique=True, blank=True, db_index=True)
    provider_transaction_id = models.CharField(max_length=150, blank=True, db_index=True)
    gateway_order_id = models.CharField(max_length=150, blank=True)
    payment_signature = models.CharField(max_length=255, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2, help_text="Amount in INR")
    currency = models.CharField(max_length=5, default='INR')
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.PENDING, db_index=True)
    payment_method_details = models.JSONField(default=dict, blank=True, help_text="Non-sensitive payment instrument details")
    refund_id = models.CharField(max_length=150, blank=True)
    error_message = models.TextField(blank=True)

    class Meta:
        ordering = ['-created_at']

    @property
    def gateway(self):
        return self.provider

    @property
    def transaction_id(self):
        return self.provider_transaction_id or self.internal_transaction_id

    def save(self, *args, **kwargs):
        if not self.internal_transaction_id:
            random_hex = uuid.uuid4().hex[:10].upper()
            self.internal_transaction_id = f"MS-TXN-{random_hex}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Payment {self.internal_transaction_id} for {self.order.order_number} ({self.get_status_display()})"
