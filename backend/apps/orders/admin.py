from django.contrib import admin
from apps.orders.models import Order, OrderItem, Coupon

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product', 'product_name', 'unit_price', 'quantity', 'total_price')

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'user', 'status', 'total_amount', 'coupon_code', 'courier_name', 'tracking_number', 'created_at')
    list_filter = ('status', 'courier_name', 'created_at')
    search_fields = ('order_number', 'user__email', 'tracking_number', 'coupon_code')
    inlines = [OrderItemInline]
    readonly_fields = ('order_number', 'created_at', 'updated_at')

@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ('code', 'discount_type', 'discount_value', 'min_order_amount', 'times_used', 'usage_limit', 'is_active', 'valid_to')
    list_filter = ('discount_type', 'is_active', 'created_at')
    search_fields = ('code', 'description')
