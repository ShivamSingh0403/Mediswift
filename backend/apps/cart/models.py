from decimal import Decimal
from django.db import models
from apps.common.models import TimeStampedModel
from apps.users.models import User
from apps.products.models import Product

class Cart(TimeStampedModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cart', null=True, blank=True)
    session_key = models.CharField(max_length=64, blank=True, db_index=True)

    def __str__(self):
        if self.user:
            return f"Cart of {self.user.email}"
        return f"Guest Cart ({self.session_key})"

    @property
    def total_items(self):
        return sum(item.quantity for item in self.items.all())

    @property
    def subtotal(self):
        return sum(item.total_price for item in self.items.all())

    @property
    def requires_prescription(self):
        return self.items.filter(product__prescription_required=True).exists()

class CartItem(TimeStampedModel):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        unique_together = ('cart', 'product')
        ordering = ['-created_at']

    @property
    def unit_price(self):
        return self.product.discounted_price

    @property
    def total_price(self):
        return (self.unit_price * self.quantity).quantize(Decimal('0.01'))

    def __str__(self):
        return f"{self.quantity} x {self.product.name}"
