import os
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from apps.common.models import TimeStampedModel
from apps.users.models import User
from apps.products.models import Product

def prescription_upload_path(instance, filename):
    # Store with secure prefix under private directory
    ext = filename.split('.')[-1]
    return f"prescriptions/{instance.patient.id}/{instance.id}.{ext}"

def validate_prescription_file(file):
    max_size_mb = 10
    if file.size > max_size_mb * 1024 * 1024:
        raise ValidationError(f"File size must not exceed {max_size_mb} MB.")
    
    ext = os.path.splitext(file.name)[1].lower()
    allowed_extensions = ['.pdf', '.jpg', '.jpeg', '.png']
    if ext not in allowed_extensions:
        raise ValidationError(f"Unsupported file format. Allowed types: {', '.join(allowed_extensions)}")

class Prescription(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending Review'
        VERIFIED = 'VERIFIED', 'Verified'
        REJECTED = 'REJECTED', 'Rejected'

    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='prescriptions')
    document = models.FileField(upload_to=prescription_upload_path, validators=[validate_prescription_file])
    original_filename = models.CharField(max_length=255, blank=True)
    doctor_name = models.CharField(max_length=150, blank=True, help_text="Prescribing Doctor Name")
    patient_notes = models.TextField(blank=True, help_text="Notes added by patient")
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)
    pharmacist_notes = models.TextField(blank=True)
    verified_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='verified_prescriptions'
    )
    verified_at = models.DateTimeField(null=True, blank=True)

    # Associated medicines/products
    approved_products = models.ManyToManyField(Product, blank=True, related_name='associated_prescriptions')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Prescription #{self.id} - {self.patient.email} ({self.get_status_display()})"
