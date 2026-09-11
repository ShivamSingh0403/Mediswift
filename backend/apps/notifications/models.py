from django.db import models
from apps.common.models import TimeStampedModel
from apps.users.models import User

class Notification(TimeStampedModel):
    class NotificationType(models.TextChoices):
        ORDER = 'ORDER', 'Order Update'
        PAYMENT = 'PAYMENT', 'Payment Alert'
        APPOINTMENT = 'APPOINTMENT', 'Appointment Alert'
        PRESCRIPTION = 'PRESCRIPTION', 'Prescription Status'
        PROMOTION = 'PROMOTION', 'Promotions & Offers'
        SYSTEM = 'SYSTEM', 'System Announcement'

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NotificationType.choices, default=NotificationType.SYSTEM, db_index=True)
    is_read = models.BooleanField(default=False, db_index=True)
    action_url = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
        ]

    def __str__(self):
        return f"Notification for {self.user.email}: {self.title}"
