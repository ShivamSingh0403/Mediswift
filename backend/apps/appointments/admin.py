from django.contrib import admin
from apps.appointments.models import DoctorAvailability, Appointment

@admin.register(DoctorAvailability)
class DoctorAvailabilityAdmin(admin.ModelAdmin):
    list_display = ('doctor', 'day_of_week', 'start_time', 'end_time', 'slot_duration_minutes', 'is_active')
    list_filter = ('day_of_week', 'is_active')

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'doctor', 'patient', 'scheduled_at', 'consultation_type', 'status', 'fee_amount')
    list_filter = ('status', 'consultation_type', 'scheduled_at')
    search_fields = ('doctor__user__first_name', 'doctor__user__last_name', 'patient__email')
