import uuid
from datetime import timedelta
from django.db import models
from django.utils import timezone
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
    break_start_time = models.TimeField(null=True, blank=True)
    break_end_time = models.TimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = 'Doctor Availabilities'
        unique_together = ('doctor', 'day_of_week', 'start_time')
        ordering = ['day_of_week', 'start_time']

    def __str__(self):
        return f"{self.doctor} - {self.get_day_of_week_display()} ({self.start_time}-{self.end_time})"

class DoctorBlockedDate(TimeStampedModel):
    doctor = models.ForeignKey(DoctorProfile, on_delete=models.CASCADE, related_name='blocked_dates')
    date = models.DateField(db_index=True)
    reason = models.CharField(max_length=255, default="Doctor Unavailable / Leave")
    all_day = models.BooleanField(default=True)
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)

    class Meta:
        verbose_name_plural = 'Doctor Blocked Dates'
        unique_together = ('doctor', 'date')
        ordering = ['date']

    def __str__(self):
        return f"{self.doctor} blocked on {self.date} ({self.reason})"

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
        NO_SHOW = 'NO_SHOW', 'No Show'

    class MeetingProvider(models.TextChoices):
        WEBRTC = 'WEBRTC_SECURE', 'MediSwift Secure WebRTC'
        JITSI = 'JITSI', 'Jitsi Meet'
        ZOOM = 'ZOOM', 'Zoom Healthcare'

    class MeetingStatus(models.TextChoices):
        SCHEDULED = 'SCHEDULED', 'Scheduled'
        ACTIVE = 'ACTIVE', 'Active / In Progress'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    booking_reference = models.CharField(max_length=32, unique=True, db_index=True, blank=True)
    doctor = models.ForeignKey(DoctorProfile, on_delete=models.PROTECT, related_name='appointments')
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='appointments')
    scheduled_at = models.DateTimeField(db_index=True)
    appointment_date = models.DateField(null=True, blank=True, db_index=True)
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    consultation_type = models.CharField(max_length=20, choices=ConsultationType.choices, default=ConsultationType.VIDEO)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.CONFIRMED, db_index=True)
    fee_amount = models.DecimalField(max_digits=10, decimal_places=2)
    symptoms = models.TextField(blank=True)
    doctor_notes = models.TextField(blank=True)

    # Telehealth video abstraction layer
    meeting_provider = models.CharField(
        max_length=30,
        choices=MeetingProvider.choices,
        default=MeetingProvider.WEBRTC
    )
    meeting_room_id = models.CharField(max_length=120, blank=True)
    meeting_url = models.URLField(max_length=500, blank=True, help_text="Secure WebRTC / Telehealth room link")
    meeting_status = models.CharField(
        max_length=20,
        choices=MeetingStatus.choices,
        default=MeetingStatus.SCHEDULED
    )

    # Cancellation & Rescheduling audit
    cancellation_reason = models.TextField(blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancelled_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cancelled_appointments'
    )
    rescheduled_from = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='rescheduled_to'
    )

    class Meta:
        ordering = ['-scheduled_at']
        indexes = [
            models.Index(fields=['doctor', 'scheduled_at']),
            models.Index(fields=['patient', 'scheduled_at']),
            models.Index(fields=['doctor', 'status', 'scheduled_at']),
        ]

    def save(self, *args, **kwargs):
        if not self.booking_reference:
            ref_uuid = uuid.uuid4().hex[:8].upper()
            year = self.scheduled_at.year if self.scheduled_at else timezone.now().year
            self.booking_reference = f"MS-APT-{year}-{ref_uuid}"

        if self.scheduled_at:
            local_dt = timezone.localtime(self.scheduled_at) if timezone.is_aware(self.scheduled_at) else self.scheduled_at
            if not self.appointment_date:
                self.appointment_date = local_dt.date()
            if not self.start_time:
                self.start_time = local_dt.time()
            if not self.end_time:
                end_dt = local_dt + timedelta(minutes=30)
                self.end_time = end_dt.time()

        if not self.meeting_room_id:
            self.meeting_room_id = f"room-{uuid.uuid4().hex[:12]}"

        if not self.meeting_url:
            self.meeting_url = f"https://meet.mediswift.in/room/{self.meeting_room_id}"

        super().save(*args, **kwargs)

    def __str__(self):
        return f"Appt [{self.booking_reference}]: {self.patient.email} with Dr. {self.doctor} at {self.scheduled_at}"
