from django.contrib import admin
from apps.payments.models import Payment

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'gateway', 'amount', 'currency', 'status', 'transaction_id', 'created_at')
    list_filter = ('gateway', 'status', 'created_at')
    search_fields = ('order__order_number', 'transaction_id', 'gateway_order_id')
