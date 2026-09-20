from django.contrib import admin
from django.utils.html import format_html
from apps.products.models import Category, Brand, Product, ProductImage

class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ('image_url', 'image', 'alt_text', 'is_primary')

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'parent', 'product_count', 'is_active', 'created_at')
    prepopulated_fields = {'slug': ('name',)}
    list_filter = ('is_active',)
    search_fields = ('name', 'description')
    ordering = ('name',)

    def product_count(self, obj):
        return obj.products.count()
    product_count.short_description = 'Products'

@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'product_count', 'created_at')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)
    ordering = ('name',)

    def product_count(self, obj):
        return obj.products.count()
    product_count.short_description = 'Products'

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        'name', 'category', 'brand', 'dosage_form', 'strength',
        'price_display', 'discount_percent', 'stock_status',
        'rating_display', 'rx_badge', 'featured', 'trending', 'bestseller', 'is_active'
    )
    list_filter = (
        'is_active', 'prescription_required', 'featured', 'trending', 'bestseller',
        'category', 'brand', 'dosage_form'
    )
    search_fields = (
        'name', 'generic_name', 'composition', 'sku',
        'brand__name', 'category__name', 'manufacturer'
    )
    prepopulated_fields = {'slug': ('name',)}
    inlines = [ProductImageInline]
    ordering = ('-created_at',)
    list_per_page = 25
    fieldsets = (
        ('Basic Identification', {
            'fields': ('name', 'slug', 'sku', 'generic_name', 'category', 'brand', 'manufacturer')
        }),
        ('Form & Strength', {
            'fields': ('dosage_form', 'strength', 'pack_size')
        }),
        ('Pricing & Stock (INR)', {
            'fields': ('price', 'original_price_inr', 'price_inr', 'discount_percent', 'discount_percentage', 'stock_quantity')
        }),
        ('Safety & Regulatory', {
            'fields': ('prescription_required', 'requires_prescription', 'is_active')
        }),
        ('Promotions & Discovery', {
            'fields': ('featured', 'trending', 'bestseller', 'rating', 'review_count', 'tags')
        }),
        ('Media & Imagery', {
            'fields': ('image_url', 'additional_images')
        }),
        ('Clinical & Descriptions', {
            'classes': ('collapse',),
            'fields': (
                'short_description', 'detailed_description', 'description',
                'ingredients', 'composition', 'directions', 'usage_instructions',
                'warnings', 'side_effects', 'storage_information'
            )
        }),
    )

    def price_display(self, obj):
        return f"₹{obj.price}"
    price_display.short_description = 'MRP (INR)'

    def rating_display(self, obj):
        return f"★ {obj.rating} ({obj.review_count})"
    rating_display.short_description = 'Rating'

    def stock_status(self, obj):
        if obj.stock_quantity > 0:
            return format_html('<span style="color: green; font-weight: bold;">In Stock ({})</span>', obj.stock_quantity)
        return format_html('<span style="color: red; font-weight: bold;">Out of Stock</span>')
    stock_status.short_description = 'Stock'

    def rx_badge(self, obj):
        if obj.prescription_required:
            return format_html('<span style="background-color: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 4px; font-weight: bold;">Rx</span>')
        return format_html('<span style="background-color: #ecfdf5; color: #065f46; padding: 2px 6px; border-radius: 4px; font-weight: bold;">OTC</span>')
    rx_badge.short_description = 'Prescription'


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = (
        'sku', 'product_name', 'preview_thumbnail', 'image_status_badge',
        'source_type', 'is_real_photo_badge', 'is_primary', 'created_at'
    )
    list_filter = ('image_status', 'is_real_product_photo', 'source_type', 'is_primary')
    search_fields = ('sku', 'product__name', 'source_name', 'alt_text')
    readonly_fields = ('preview_thumbnail', 'image_hash', 'created_at', 'updated_at')
    ordering = ('-created_at',)
    list_per_page = 30
    actions = ['action_mark_verified', 'action_mark_rejected', 'action_set_primary']

    def product_name(self, obj):
        return obj.product.name if obj.product else '-'
    product_name.short_description = 'Product'

    def preview_thumbnail(self, obj):
        url = None
        f = obj.image_file or obj.image
        if f and f.name:
            url = f.url
        elif obj.image_url:
            url = obj.image_url
        if url:
            return format_html('<img src="{}" style="max-height: 48px; max-width: 48px; object-fit: contain; border-radius: 4px; border: 1px solid #e2e8f0;" />', url)
        return format_html('<span style="color: #94a3b8; font-size: 11px;">No image</span>')
    preview_thumbnail.short_description = 'Preview'

    def image_status_badge(self, obj):
        status = obj.image_status
        if status == 'VERIFIED':
            return format_html('<span style="background-color: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 12px; font-weight: bold; font-size: 11px;">VERIFIED REAL IMAGE</span>')
        elif status == 'AI_DEMO_ONLY':
            return format_html('<span style="background-color: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 12px; font-weight: bold; font-size: 11px;">AI DEMO ONLY</span>')
        elif status in ('PENDING_REVIEW', 'DOWNLOADED'):
            return format_html('<span style="background-color: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 12px; font-weight: bold; font-size: 11px;">PENDING REVIEW</span>')
        elif status == 'REJECTED':
            return format_html('<span style="background-color: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 12px; font-weight: bold; font-size: 11px;">REJECTED</span>')
        return format_html('<span style="background-color: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 12px; font-size: 11px;">{}</span>', status)
    image_status_badge.short_description = 'Status'

    def is_real_photo_badge(self, obj):
        if obj.is_real_product_photo:
            return format_html('<span style="color: #059669; font-weight: bold;">Yes</span>')
        return format_html('<span style="color: #64748b;">No (Demo/Draft)</span>')
    is_real_photo_badge.short_description = 'Real Photo'

    def action_mark_verified(self, request, queryset):
        for img in queryset:
            img.mark_verified(verified_by=request.user.get_full_name() or request.user.username or "Admin")
        self.message_user(request, f"{queryset.count()} image(s) verified.")
    action_mark_verified.short_description = "Mark selected as Verified Real Image"

    def action_mark_rejected(self, request, queryset):
        for img in queryset:
            img.mark_rejected(rejected_by=request.user.get_full_name() or request.user.username or "Admin")
        self.message_user(request, f"{queryset.count()} image(s) rejected.")
    action_mark_rejected.short_description = "Mark selected as Rejected"

    def action_set_primary(self, request, queryset):
        for img in queryset:
            ProductImage.objects.filter(product=img.product).update(is_primary=False)
            img.is_primary = True
            img.save()
            target_f = img.image_file or img.image
            if target_f and target_f.name:
                img.product.image_url = target_f.url
            elif img.image_url:
                img.product.image_url = img.image_url
            img.product.image_status = img.image_status
            img.product.save(update_fields=['image_url', 'image_status'])
        self.message_user(request, f"Primary image updated.")
    action_set_primary.short_description = "Set as primary image"

