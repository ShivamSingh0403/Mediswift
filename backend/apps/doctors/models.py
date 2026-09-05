from django.db import models
from django.utils.text import slugify
from apps.common.models import TimeStampedModel
from apps.users.models import User

class Specialty(TimeStampedModel):
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=150, unique=True, db_index=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True, help_text="Lucide icon name")

    class Meta:
        verbose_name_plural = 'Specialties'
        ordering = ['name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class DoctorProfile(TimeStampedModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='doctor_profile')
    specialties = models.ManyToManyField(Specialty, related_name='doctors')
    license_number = models.CharField(max_length=100, unique=True)
    qualifications = models.CharField(max_length=255, help_text="e.g., MBBS, MD (General Medicine)")
    experience_years = models.PositiveIntegerField(default=1)
    consultation_fee = models.DecimalField(max_digits=10, decimal_places=2, help_text="Fee in INR")
    languages = models.CharField(max_length=255, default="English, Hindi")
    hospital_affiliation = models.CharField(max_length=255, blank=True)
    clinic_address = models.TextField(blank=True)
    bio = models.TextField()
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=5.00)
    review_count = models.PositiveIntegerField(default=0)
    is_available_for_telehealth = models.BooleanField(default=True, db_index=True)
    is_verified = models.BooleanField(default=True, db_index=True)

    class Meta:
        ordering = ['-rating', '-experience_years']

    def __str__(self):
        return f"Dr. {self.user.get_full_name() or self.user.email}"
