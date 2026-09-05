from django.db import models
from apps.common.models import TimeStampedModel
from apps.users.models import User
from apps.doctors.models import DoctorProfile

class DoctorAvailability(TimeStampedModel):
    class Weekday(models.IntegerChoices):
        MONDAY = 0, 'Monday'
        TUESDAY = 1, 'Tuesday'
        WEDNESDAY = 2, 'Wednesday'
        THURSDAY = 3, 'Thursday'
        FRIDAY = 4, 'Friday'
        SATURDAY = 5, 'Saturday'
        SUNDAY = 6, 'Sunday'

    doctor = models.ForeignKey(DoctorProfile, on_delete=models.CASCADE, related_name='availabilities')
    day_of_week = models.IntegerField(choices=Weekday.choices)
    start_time = models.TimeField()
    end_time = models.TimeField()
    slot_duration_minutes = models.PositiveIntegerField(default=30)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = 'Doctor Availabilities'
        unique_together = ('doctor', 'day_of_week', 'start_time')
        ordering = ['day_of_week', 'start_time']

    def __str__(self):
        return f"{self.doctor} - {self.get_day_of_week_display()} ({self.start_time}-{self.end_time})"

class Appointment(TimeStampedModel):
    class ConsultationType(models.TextChoices):
        VIDEO = 'VIDEO', 'Video Consultation'
        IN_PERSON = 'IN_PERSON', 'In-Person Clinic Visit'

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending Confirmation'
        CONFIRMED = 'CONFIRMED', 'Confirmed'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'
        RESCHEDULED = 'RESCHEDULED', 'Rescheduled'

    doctor = models.ForeignKey(DoctorProfile, on_delete=models.PROTECT, related_name='appointments')
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='appointments')
    scheduled_at = models.DateTimeField(db_index=True)
    consultation_type = models.CharField(max_length=20, choices=ConsultationType.choices, default=ConsultationType.VIDEO)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.CONFIRMED, db_index=True)
    fee_amount = models.DecimalField(max_digits=10, decimal_places=2)
    symptoms = models.TextField(blank=True)
    meeting_link = models.URLField(blank=True, help_text="Secure WebRTC / Telehealth room link")
    doctor_notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-scheduled_at']
        indexes = [
            models.Index(fields=['doctor', 'scheduled_at']),
            models.Index(fields=['patient', 'scheduled_at']),
        ]

    def __str__(self):
        return f"Appt #{self.id}: {self.patient.email} with Dr. {self.doctor.user.last_name} at {self.scheduled_at}"
