import os
import uuid
import shutil
import hashlib
from pathlib import Path
from decimal import Decimal
from django.db import models
from django.utils import timezone
from django.conf import settings
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
        MISSING = 'MISSING', 'Missing Image'
        DOWNLOADED = 'DOWNLOADED', 'Downloaded'
        PENDING_REVIEW = 'PENDING_REVIEW', 'Pending Review'
        VERIFIED = 'VERIFIED', 'Verified Authentic Photograph'
        REJECTED = 'REJECTED', 'Rejected Image'
        BROKEN = 'BROKEN', 'Broken Image URL / Asset'
        DUPLICATE = 'DUPLICATE', 'Duplicate Image Mapping'

    # Media & Visuals
    image_url = models.URLField(max_length=500, blank=True, help_text="Primary product image URL")
    additional_images = models.JSONField(default=list, blank=True, help_text="List of gallery image URLs")
    image_status = models.CharField(
        max_length=50,
        choices=ImageStatus.choices,
        default=ImageStatus.MISSING,
        blank=True,
        db_index=True
    )
    image_source = models.CharField(max_length=255, blank=True, help_text="Origin e.g. Manufacturer Official / Authorized Distributor")
    image_alt_text = models.CharField(max_length=255, blank=True, help_text="Descriptive pharmaceutical packaging alt text")
    image_license = models.CharField(max_length=255, blank=True, help_text="e.g. Proprietary / Authorized Distributor / Editorial")
    source_url = models.URLField(max_length=500, blank=True, help_text="Official source link e.g. brand portal or catalog")
    verified_by = models.CharField(max_length=150, blank=True, help_text="Verifier name or employee ID")
    verified_at = models.DateTimeField(null=True, blank=True, help_text="Date & time when image was verified")
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
    sku = models.CharField(max_length=100, blank=True, db_index=True)
    image_file = models.ImageField(upload_to='product_images/pending_review/', null=True, blank=True)
    image = models.ImageField(upload_to='product_images/pending_review/', null=True, blank=True)
    image_url = models.URLField(max_length=500, blank=True)
    source_url = models.URLField(max_length=500, blank=True)
    source_name = models.CharField(max_length=255, blank=True)
    source = models.CharField(max_length=255, blank=True)
    license_note = models.CharField(max_length=255, blank=True)
    license = models.CharField(max_length=255, blank=True)
    image_status = models.CharField(
        max_length=50,
        choices=Product.ImageStatus.choices,
        default=Product.ImageStatus.PENDING_REVIEW,
        db_index=True
    )
    status = models.CharField(
        max_length=50,
        choices=Product.ImageStatus.choices,
        default=Product.ImageStatus.PENDING_REVIEW,
        blank=True
    )
    image_hash = models.CharField(
        max_length=64,
        blank=True,
        db_index=True,
        help_text="SHA-256 hash of image file"
    )
    mime_type = models.CharField(max_length=50, blank=True)
    width = models.PositiveIntegerField(null=True, blank=True)
    height = models.PositiveIntegerField(null=True, blank=True)
    source_page_url = models.URLField(max_length=1000, blank=True)
    source_domain = models.CharField(max_length=255, blank=True)
    is_primary = models.BooleanField(default=False)
    alt_text = models.CharField(max_length=255, blank=True)
    verified_by = models.CharField(max_length=150, blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-is_primary', '-created_at']

    def save(self, *args, **kwargs):
        if not self.sku and self.product:
            self.sku = self.product.sku

        # Sync legacy aliases
        if self.source_name and not self.source:
            self.source = self.source_name
        elif self.source and not self.source_name:
            self.source_name = self.source

        if self.license_note and not self.license:
            self.license = self.license_note
        elif self.license and not self.license_note:
            self.license_note = self.license

        if self.image_status and not self.status:
            self.status = self.image_status
        elif self.status and not self.image_status:
            self.image_status = self.status

        if self.image_file and not self.image:
            self.image = self.image_file
        elif self.image and not self.image_file:
            self.image_file = self.image

        # Compute SHA-256 hash if image file is set and hash missing
        target_file = self.image_file or self.image
        if target_file and not self.image_hash:
            try:
                target_file.seek(0)
                self.image_hash = hashlib.sha256(target_file.read()).hexdigest()
                target_file.seek(0)
            except Exception:
                pass

        super().save(*args, **kwargs)

    def mark_verified(self, verified_by="Administrator"):
        """
        Moves image to verified/ directory safely without deleting original without backup.
        Updates status to VERIFIED and sets verified_at and verified_by.
        """
        target_field = self.image_file or self.image
        if target_field and target_field.name:
            src_path = Path(settings.MEDIA_ROOT) / target_field.name
            if src_path.exists():
                verified_dir = Path(settings.MEDIA_ROOT) / 'product_images' / 'verified'
                verified_dir.mkdir(parents=True, exist_ok=True)
                ext = src_path.suffix
                dest_filename = f"{self.sku or self.product.sku}{ext}"
                dest_path = verified_dir / dest_filename
                
                # Copy safely with backup
                shutil.copy2(src_path, dest_path)
                new_rel_name = f"product_images/verified/{dest_filename}"
                self.image_file.name = new_rel_name
                self.image.name = new_rel_name

        self.image_status = Product.ImageStatus.VERIFIED
        self.status = Product.ImageStatus.VERIFIED
        self.verified_by = verified_by
        self.verified_at = timezone.now()
        self.save()

        # Update product primary URL
        target_f = self.image_file or self.image
        if target_f:
            self.product.image_url = target_f.url
        elif self.image_url:
            self.product.image_url = self.image_url
            
        self.product.image_status = Product.ImageStatus.VERIFIED
        self.product.verified_by = verified_by
        self.product.verified_at = self.verified_at
        self.product.save(update_fields=['image_url', 'image_status', 'verified_by', 'verified_at'])

    def mark_rejected(self, rejected_by="Administrator", reason=""):
        """
        Moves image to rejected/ directory safely and marks as REJECTED.
        """
        target_field = self.image_file or self.image
        if target_field and target_field.name:
            src_path = Path(settings.MEDIA_ROOT) / target_field.name
            if src_path.exists():
                rejected_dir = Path(settings.MEDIA_ROOT) / 'product_images' / 'rejected'
                rejected_dir.mkdir(parents=True, exist_ok=True)
                ext = src_path.suffix
                dest_filename = f"{self.sku or self.product.sku}{ext}"
                dest_path = rejected_dir / dest_filename
                shutil.copy2(src_path, dest_path)
                new_rel_name = f"product_images/rejected/{dest_filename}"
                self.image_file.name = new_rel_name
                self.image.name = new_rel_name

        self.image_status = Product.ImageStatus.REJECTED
        self.status = Product.ImageStatus.REJECTED
        self.save()

        if self.product.images.filter(image_status=Product.ImageStatus.VERIFIED).exists():
            next_ver = self.product.images.filter(image_status=Product.ImageStatus.VERIFIED).first()
            f = next_ver.image_file or next_ver.image
            self.product.image_url = f.url if f else next_ver.image_url
            self.product.image_status = Product.ImageStatus.VERIFIED
        else:
            self.product.image_url = ''
            self.product.image_status = Product.ImageStatus.REJECTED
        self.product.save(update_fields=['image_url', 'image_status'])

    def __str__(self):
        return f"Image for {self.product.name} ({self.sku})"


class ProductImageCandidate(TimeStampedModel):
    class CandidateStatus(models.TextChoices):
        DISCOVERED = 'DISCOVERED', 'Discovered'
        PENDING_REVIEW = 'PENDING_REVIEW', 'Pending Review'
        APPROVED_FOR_DOWNLOAD = 'APPROVED_FOR_DOWNLOAD', 'Approved for Download'
        DOWNLOADED = 'DOWNLOADED', 'Downloaded'
        VERIFIED = 'VERIFIED', 'Verified'
        REJECTED = 'REJECTED', 'Rejected'
        BROKEN = 'BROKEN', 'Broken'
        DUPLICATE = 'DUPLICATE', 'Duplicate'
        RIGHTS_UNKNOWN = 'RIGHTS_UNKNOWN', 'Rights Unknown'
        PRODUCT_MISMATCH = 'PRODUCT_MISMATCH', 'Product Mismatch'
        BLOCKED_SOURCE = 'BLOCKED_SOURCE', 'Blocked Source'

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='image_candidates')
    sku = models.CharField(max_length=100, blank=True, db_index=True)
    product_name = models.CharField(max_length=255, blank=True)
    brand = models.CharField(max_length=255, blank=True)
    candidate_image_url = models.URLField(max_length=1000)
    source_page_url = models.URLField(max_length=1000, blank=True)
    source_domain = models.CharField(max_length=255, blank=True, db_index=True)
    source_type = models.CharField(max_length=100, blank=True)
    image_title = models.CharField(max_length=255, blank=True)
    detected_alt_text = models.CharField(max_length=500, blank=True)
    rights_note = models.TextField(blank=True, help_text="Rights/license advisory, e.g. Usage permission has not been confirmed.")
    license_url = models.URLField(max_length=1000, blank=True)
    matching_confidence = models.FloatField(default=0.0, help_text="Confidence score 0.0 to 1.0")
    status = models.CharField(
        max_length=50,
        choices=CandidateStatus.choices,
        default=CandidateStatus.DISCOVERED,
        db_index=True
    )
    review_reason = models.TextField(blank=True)
    downloaded_image = models.ForeignKey(
        ProductImage,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='candidate_origin'
    )
    discovered_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-matching_confidence', '-discovered_at']
        indexes = [
            models.Index(fields=['sku', 'status']),
            models.Index(fields=['status', 'matching_confidence']),
        ]

    def save(self, *args, **kwargs):
        if not self.sku and self.product:
            self.sku = self.product.sku
        if not self.product_name and self.product:
            self.product_name = self.product.name
        if not self.brand and self.product and self.product.brand:
            self.brand = self.product.brand.name
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Candidate {self.sku} ({self.status}) - {self.candidate_image_url[:40]}"
