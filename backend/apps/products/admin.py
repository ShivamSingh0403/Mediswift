from django.contrib import admin
from apps.products.models import Category, Brand, Product, ProductImage

class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'parent', 'is_active')
    prepopulated_fields = {'slug': ('name',)}
    list_filter = ('is_active',)
    search_fields = ('name',)

@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'brand', 'price', 'discount_percent', 'stock_quantity', 'prescription_required', 'is_active')
    list_filter = ('is_active', 'prescription_required', 'category', 'dosage_form')
    search_fields = ('name', 'generic_name', 'composition', 'sku')
    prepopulated_fields = {'slug': ('name',)}
    inlines = [ProductImageInline]
