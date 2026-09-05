from django.contrib import admin
from apps.prescriptions.models import Prescription

@admin.register(Prescription)
class PrescriptionAdmin(admin.ModelAdmin):
    list_display = ('id', 'patient', 'doctor_name', 'status', 'verified_by', 'verified_at', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('patient__email', 'doctor_name', 'original_filename')
    filter_horizontal = ('approved_products',)
    readonly_fields = ('created_at', 'updated_at')
