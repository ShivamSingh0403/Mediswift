from django.contrib import admin
from apps.orders.models import Order, OrderItem

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product', 'product_name', 'unit_price', 'quantity', 'total_price')

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'user', 'status', 'total_amount', 'tracking_number', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('order_number', 'user__email', 'tracking_number')
    inlines = [OrderItemInline]
    readonly_fields = ('order_number', 'created_at', 'updated_at')
