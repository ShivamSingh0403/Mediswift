import uuid
from decimal import Decimal
from django.db import models
from django.utils.text import slugify
from apps.common.models import TimeStampedModel

class Category(TimeStampedModel):
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=150, unique=True, db_index=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='categories/', null=True, blank=True)
    image_url = models.URLField(max_length=500, blank=True, help_text="Curated category visual / banner URL")
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
    logo_url = models.URLField(max_length=500, blank=True, help_text="Brand logo URL")

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
        SUSPENSION = 'SUSPENSION', 'Suspension'
        INJECTION = 'INJECTION', 'Injection'
        OINTMENT = 'OINTMENT', 'Ointment'
        CREAM = 'CREAM', 'Cream'
        GEL = 'GEL', 'Gel'
        DROPS = 'DROPS', 'Drops'
        POWDER = 'POWDER', 'Powder'
        SPRAY = 'SPRAY', 'Spray'
        INHALER = 'INHALER', 'Inhaler'
        STRIP = 'STRIP', 'Test Strip'
        DEVICE = 'DEVICE', 'Healthcare Device'
        LIQUID = 'LIQUID', 'Liquid'
        LOTION = 'LOTION', 'Lotion'
        OTHER = 'OTHER', 'Other'

    # Core Identifiers & Names
    name = models.CharField(max_length=255, db_index=True)
    slug = models.SlugField(max_length=280, unique=True, db_index=True)
    generic_name = models.CharField(max_length=255, blank=True, db_index=True)
    sku = models.CharField(max_length=100, unique=True, db_index=True)

    # Descriptions
    short_description = models.CharField(max_length=500, blank=True)
    detailed_description = models.TextField(blank=True)
    description = models.TextField(blank=True)  # Backward compatibility alias

    # Relationships & Manufacturer
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='products')
    brand = models.ForeignKey(Brand, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    manufacturer = models.CharField(max_length=150, blank=True)

    # Physical / Form Attributes
    dosage_form = models.CharField(max_length=20, choices=DosageForm.choices, default=DosageForm.TABLET)
    strength = models.CharField(max_length=100, blank=True, help_text="e.g. 650mg, 100ml, 1% w/w")
    pack_size = models.CharField(max_length=100, blank=True, help_text="e.g., 10 Tablets in a strip or 100ml Bottle")

    # Pricing (INR) & Inventory
    price = models.DecimalField(max_digits=10, decimal_places=2, help_text="MRP in INR")
    price_inr = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Effective selling price in INR")
    original_price_inr = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Original MRP in INR")
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'))
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'))
    stock_quantity = models.PositiveIntegerField(default=0)

    # Ratings & Discovery
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=Decimal('4.50'), db_index=True)
    review_count = models.PositiveIntegerField(default=0)
    featured = models.BooleanField(default=False, db_index=True)
    trending = models.BooleanField(default=False, db_index=True)
    bestseller = models.BooleanField(default=False, db_index=True)

    # Medical & Safety Attributes
    prescription_required = models.BooleanField(default=False, db_index=True)
    requires_prescription = models.BooleanField(default=False, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)

    class ImageStatus(models.TextChoices):
        VERIFIED = 'VERIFIED', 'Verified Authentic Photograph'
        NEEDS_VERIFIED_IMAGE = 'NEEDS_VERIFIED_IMAGE', 'Awaiting Verified Packshot'
        FALLBACK_GENERATED = 'FALLBACK_GENERATED', 'Clinical Specification Fallback'

    # Media & Visuals
    image_url = models.URLField(max_length=500, blank=True, help_text="Primary product image URL")
    additional_images = models.JSONField(default=list, blank=True, help_text="List of gallery image URLs")
    image_status = models.CharField(
        max_length=50,
        choices=ImageStatus.choices,
        default=ImageStatus.NEEDS_VERIFIED_IMAGE,
        blank=True,
        db_index=True
    )
    image_source = models.CharField(max_length=255, blank=True, help_text="Origin e.g. Manufacturer Official / Authorized Distributor")
    image_alt_text = models.CharField(max_length=255, blank=True, help_text="Descriptive pharmaceutical packaging alt text")
    image_license = models.CharField(max_length=255, blank=True, help_text="e.g. Proprietary / Authorized Distributor / Editorial")
    is_demo_data = models.BooleanField(default=False, db_index=True)

    # Clinical & Usage Information
    composition = models.CharField(max_length=255, blank=True, help_text="Active pharmaceutical ingredients")
    ingredients = models.TextField(blank=True, help_text="Detailed ingredients and active salts")
    usage_instructions = models.TextField(blank=True)
    directions = models.TextField(blank=True, help_text="Directions for safe use")
    side_effects = models.TextField(blank=True)
    warnings = models.TextField(blank=True, help_text="Safety precautions & contraindications")
    storage_information = models.TextField(blank=True, help_text="Storage conditions, e.g. store below 25°C")
    tags = models.JSONField(default=list, blank=True, help_text="Keywords & health tags")

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['name', 'generic_name']),
            models.Index(fields=['is_active', 'prescription_required']),
            models.Index(fields=['is_active', 'requires_prescription']),
            models.Index(fields=['featured', 'trending', 'bestseller']),
            models.Index(fields=['rating', 'price']),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)

        # Sync MRP fields
        if not self.price and self.original_price_inr:
            self.price = self.original_price_inr
        elif not self.original_price_inr and self.price:
            self.original_price_inr = self.price

        # Sync discount percent fields
        if self.discount_percentage and not self.discount_percent:
            self.discount_percent = self.discount_percentage
        elif self.discount_percent and not self.discount_percentage:
            self.discount_percentage = self.discount_percent

        # Calculate / sync effective selling price (price_inr)
        if self.price:
            effective_discount = self.discount_percentage or self.discount_percent or Decimal('0.00')
            if effective_discount > Decimal('0.00'):
                factor = Decimal('1') - (effective_discount / Decimal('100'))
                computed_selling = (self.price * factor).quantize(Decimal('0.01'))
                if not self.price_inr:
                    self.price_inr = computed_selling
            else:
                if not self.price_inr:
                    self.price_inr = self.price

        # Sync boolean prescription flags
        if self.requires_prescription or self.prescription_required:
            flag = self.requires_prescription or self.prescription_required
            self.requires_prescription = flag
            self.prescription_required = flag

        # Sync textual fields bi-directionally
        if self.detailed_description and not self.description:
            self.description = self.detailed_description
        elif self.description and not self.detailed_description:
            self.detailed_description = self.description

        if not self.short_description and self.description:
            self.short_description = (self.description[:197] + '...') if len(self.description) > 200 else self.description

        if self.ingredients and not self.composition:
            self.composition = (self.ingredients[:250]) if len(self.ingredients) > 250 else self.ingredients
        elif self.composition and not self.ingredients:
            self.ingredients = self.composition

        if self.directions and not self.usage_instructions:
            self.usage_instructions = self.directions
        elif self.usage_instructions and not self.directions:
            self.directions = self.usage_instructions

        if self.warnings and not self.side_effects:
            self.side_effects = self.warnings
        elif self.side_effects and not self.warnings:
            self.warnings = self.side_effects

        super().save(*args, **kwargs)

    @property
    def discounted_price(self):
        if self.price_inr is not None:
            return self.price_inr
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
    image = models.ImageField(upload_to='products/', null=True, blank=True)
    image_url = models.URLField(max_length=500, blank=True)
    alt_text = models.CharField(max_length=255, blank=True)
    is_primary = models.BooleanField(default=False)
    source = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=50, default='NEEDS_VERIFIED_IMAGE', blank=True)
    license = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ['-is_primary', '-created_at']

    def __str__(self):
        return f"Image for {self.product.name}"
