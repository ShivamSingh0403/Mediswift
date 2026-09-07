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
