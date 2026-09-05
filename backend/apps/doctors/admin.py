from django.contrib import admin
from apps.doctors.models import Specialty, DoctorProfile

@admin.register(Specialty)
class SpecialtyAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'icon')
    prepopulated_fields = {'slug': ('name',)}

@admin.register(DoctorProfile)
class DoctorProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'license_number', 'experience_years', 'consultation_fee', 'rating', 'is_available_for_telehealth', 'is_verified')
    list_filter = ('is_verified', 'is_available_for_telehealth', 'specialties')
    search_fields = ('user__first_name', 'user__last_name', 'user__email', 'license_number', 'hospital_affiliation')
    filter_horizontal = ('specialties',)
