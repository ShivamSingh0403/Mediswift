from decimal import Decimal
from django.db import models
from django.utils.text import slugify
from apps.common.models import TimeStampedModel

class Category(TimeStampedModel):
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=150, unique=True, db_index=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='categories/', null=True, blank=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subcategories')
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class Brand(TimeStampedModel):
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=150, unique=True, db_index=True)
    logo = models.ImageField(upload_to='brands/', null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class Product(TimeStampedModel):
    class DosageForm(models.TextChoices):
        TABLET = 'TABLET', 'Tablet'
        CAPSULE = 'CAPSULE', 'Capsule'
        SYRUP = 'SYRUP', 'Syrup'
        INJECTION = 'INJECTION', 'Injection'
        OINTMENT = 'OINTMENT', 'Ointment'
        DROPS = 'DROPS', 'Drops'
        POWDER = 'POWDER', 'Powder'
        DEVICE = 'DEVICE', 'Healthcare Device'
        OTHER = 'OTHER', 'Other'

    name = models.CharField(max_length=255, db_index=True)
    slug = models.SlugField(max_length=280, unique=True, db_index=True)
    generic_name = models.CharField(max_length=255, blank=True, db_index=True)
    composition = models.CharField(max_length=255, blank=True, help_text="Active pharmaceutical ingredients")
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='products')
    brand = models.ForeignKey(Brand, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    description = models.TextField()
    usage_instructions = models.TextField(blank=True)
    side_effects = models.TextField(blank=True)
    dosage_form = models.CharField(max_length=20, choices=DosageForm.choices, default=DosageForm.TABLET)
    pack_size = models.CharField(max_length=100, blank=True, help_text="e.g., 10 Tablets in a strip or 100ml Bottle")
    manufacturer = models.CharField(max_length=150, blank=True)

    price = models.DecimalField(max_digits=10, decimal_places=2, help_text="MRP in INR")
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    stock_quantity = models.PositiveIntegerField(default=0)
    sku = models.CharField(max_length=100, unique=True, db_index=True)
    prescription_required = models.BooleanField(default=False, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['name', 'generic_name']),
            models.Index(fields=['is_active', 'prescription_required']),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    @property
    def discounted_price(self):
        if self.discount_percent > 0:
            factor = Decimal('1') - (self.discount_percent / Decimal('100'))
            return (self.price * factor).quantize(Decimal('0.01'))
        return self.price

    @property
    def in_stock(self):
        return self.stock_quantity > 0

    def __str__(self):
        return self.name

class ProductImage(TimeStampedModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='products/')
    alt_text = models.CharField(max_length=150, blank=True)
    is_primary = models.BooleanField(default=False)

    class Meta:
        ordering = ['-is_primary', '-created_at']

    def __str__(self):
        return f"Image for {self.product.name}"
