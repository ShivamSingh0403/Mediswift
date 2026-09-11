from django.contrib import admin
from apps.payments.models import Payment

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('internal_transaction_id', 'order', 'provider', 'amount', 'currency', 'status', 'provider_transaction_id', 'created_at')
    list_filter = ('provider', 'status', 'created_at')
    search_fields = ('order__order_number', 'internal_transaction_id', 'provider_transaction_id', 'gateway_order_id')
