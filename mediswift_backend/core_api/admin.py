from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Medicine, Doctor, Order, OrderItem, Appointment

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['email', 'username', 'role', 'phone_number', 'is_staff']
    list_filter = ['role', 'is_staff', 'is_active']
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('role', 'phone_number', 'address')}),
    )

@admin.register(Medicine)
class MedicineAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'price', 'stock', 'requires_prescription', 'created_at']
    list_filter = ['category', 'requires_prescription']
    search_fields = ['name', 'description', 'manufacturer']
    list_editable = ['price', 'stock']

@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ['name', 'specialty', 'experience', 'fee', 'rating']
    list_filter = ['specialty']
    search_fields = ['name', 'bio']

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['medicine', 'quantity', 'unit_price']

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'total_price', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['id', 'user__email', 'contact_phone']
    inlines = [OrderItemInline]

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'doctor', 'patient_name', 'patient_email', 'appointment_date', 'time_slot', 'status']
    list_filter = ['status', 'appointment_date', 'doctor']
    search_fields = ['patient_name', 'patient_email', 'doctor__name']
