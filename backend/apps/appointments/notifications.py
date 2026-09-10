import logging
from apps.notifications.models import Notification

logger = logging.getLogger(__name__)

def send_appointment_notification(appointment, event_type, extra_message=""):
    """
    Creates in-app notifications for appointment lifecycle events.
    Extensible for SMS/Email webhook triggers.
    """
    try:
        doctor_name = appointment.doctor.user.get_full_name() or str(appointment.doctor)
        patient_user = appointment.patient
        doctor_user = appointment.doctor.user

        date_str = appointment.scheduled_at.strftime("%b %d, %Y at %I:%M %p")
        ref = appointment.booking_reference
        action_url = f"/account/appointments"

        if event_type == 'BOOKED':
            Notification.objects.create(
                user=patient_user,
                notification_type=Notification.NotificationType.APPOINTMENT,
                title="Appointment Scheduled",
                message=f"Your {appointment.get_consultation_type_display()} with Dr. {doctor_name} is scheduled for {date_str}. Ref: {ref}.",
                action_url=action_url,
            )
            Notification.objects.create(
                user=doctor_user,
                notification_type=Notification.NotificationType.APPOINTMENT,
                title="New Patient Booking",
                message=f"New booking from {patient_user.get_full_name() or patient_user.email} for {date_str}. Ref: {ref}.",
                action_url=action_url,
            )

        elif event_type == 'RESCHEDULED':
            Notification.objects.create(
                user=patient_user,
                notification_type=Notification.NotificationType.APPOINTMENT,
                title="Appointment Rescheduled",
                message=f"Your consultation with Dr. {doctor_name} has been rescheduled to {date_str}. Ref: {ref}. {extra_message}".strip(),
                action_url=action_url,
            )
            Notification.objects.create(
                user=doctor_user,
                notification_type=Notification.NotificationType.APPOINTMENT,
                title="Appointment Rescheduled by Patient",
                message=f"Patient {patient_user.get_full_name()} rescheduled their consult to {date_str}. Ref: {ref}.",
                action_url=action_url,
            )

        elif event_type == 'CANCELLED':
            Notification.objects.create(
                user=patient_user,
                notification_type=Notification.NotificationType.APPOINTMENT,
                title="Appointment Cancelled",
                message=f"Your appointment with Dr. {doctor_name} for {date_str} (Ref: {ref}) has been cancelled. {extra_message}".strip(),
                action_url=action_url,
            )
            Notification.objects.create(
                user=doctor_user,
                notification_type=Notification.NotificationType.APPOINTMENT,
                title="Appointment Cancelled",
                message=f"Appointment {ref} with {patient_user.get_full_name()} for {date_str} was cancelled. {extra_message}".strip(),
                action_url=action_url,
            )

        elif event_type == 'CONFIRMED':
            Notification.objects.create(
                user=patient_user,
                notification_type=Notification.NotificationType.APPOINTMENT,
                title="Appointment Confirmed",
                message=f"Dr. {doctor_name} has confirmed your appointment for {date_str}. Ref: {ref}.",
                action_url=action_url,
            )
    except Exception as e:
        logger.error(f"Failed to create appointment notification: {e}")
