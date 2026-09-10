from datetime import datetime, timedelta, time
from django.utils import timezone
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.common.responses import api_response
from apps.doctors.models import DoctorProfile
from apps.appointments.models import DoctorAvailability, DoctorBlockedDate, Appointment
from apps.appointments.serializers import (
    DoctorAvailabilitySerializer,
    DoctorBlockedDateSerializer,
    AppointmentSerializer,
    AppointmentCreateSerializer,
    AppointmentRescheduleSerializer,
    AppointmentCancelSerializer,
)
import uuid
from apps.appointments.notifications import send_appointment_notification

def is_valid_uuid(val):
    try:
        uuid.UUID(str(val))
        return True
    except (ValueError, AttributeError, TypeError):
        return False

def get_doctor_by_identifier(identifier):
    if not identifier:
        return None
    if is_valid_uuid(identifier):
        return DoctorProfile.objects.filter(id=identifier).first()
    return DoctorProfile.objects.filter(slug=identifier).first()

class DoctorAvailabilityViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = DoctorAvailabilitySerializer
    permission_classes = (permissions.AllowAny,)

    def get_queryset(self):
        doctor_id = self.request.query_params.get('doctor_id')
        if doctor_id:
            if is_valid_uuid(doctor_id):
                return DoctorAvailability.objects.filter(doctor_id=doctor_id, is_active=True).select_related('doctor')
            return DoctorAvailability.objects.filter(doctor__slug=doctor_id, is_active=True).select_related('doctor')
        return DoctorAvailability.objects.filter(is_active=True).select_related('doctor')

class DoctorBlockedDateViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = DoctorBlockedDateSerializer
    permission_classes = (permissions.AllowAny,)

    def get_queryset(self):
        doctor_id = self.request.query_params.get('doctor_id')
        if doctor_id:
            if is_valid_uuid(doctor_id):
                return DoctorBlockedDate.objects.filter(doctor_id=doctor_id)
            return DoctorBlockedDate.objects.filter(doctor__slug=doctor_id)
        return DoctorBlockedDate.objects.all()

class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_permissions(self):
        if self.action == 'available_slots':
            return [permissions.AllowAny()]
        return super().get_permissions()

    def get_queryset(self):
        user = self.request.user
        qs = Appointment.objects.select_related(
            'doctor', 'patient', 'doctor__user', 'doctor__user__profile'
        ).prefetch_related('doctor__specialties')

        if hasattr(user, 'doctor_profile'):
            qs = qs.filter(doctor=user.doctor_profile)
        elif not user.is_staff:
            qs = qs.filter(patient=user)

        # Query filters
        status_param = self.request.query_params.get('status')
        filter_param = self.request.query_params.get('filter')
        now = timezone.now()

        if filter_param == 'upcoming':
            qs = qs.filter(
                scheduled_at__gte=now - timedelta(minutes=30),
                status__in=[Appointment.Status.PENDING, Appointment.Status.CONFIRMED, Appointment.Status.RESCHEDULED]
            ).order_by('scheduled_at')
        elif filter_param == 'completed':
            qs = qs.filter(
                Q(status=Appointment.Status.COMPLETED) |
                (Q(scheduled_at__lt=now - timedelta(minutes=30)) & ~Q(status=Appointment.Status.CANCELLED))
            ).order_by('-scheduled_at')
        elif filter_param == 'cancelled':
            qs = qs.filter(status=Appointment.Status.CANCELLED).order_by('-scheduled_at')
        elif status_param:
            qs = qs.filter(status=status_param.upper()).order_by('-scheduled_at')

        return qs

    @action(detail=False, methods=['get'], url_path='available-slots', permission_classes=[permissions.AllowAny])
    def available_slots(self, request):
        """
        Calculate dynamically available appointment slots for a given doctor and date.
        Respects:
          - Doctor weekly schedules & working hours
          - Break periods (e.g. lunch)
          - Doctor blocked dates / holidays
          - Existing booked appointments
          - Past times today (in Asia/Kolkata timezone)
        """
        doctor_identifier = request.query_params.get('doctor_id')
        date_str = request.query_params.get('date')
        consultation_type = request.query_params.get('consultation_type', 'VIDEO').upper()

        if not doctor_identifier or not date_str:
            return api_response(
                data=None,
                message="doctor_id and date (YYYY-MM-DD) are required parameters.",
                status_code=status.HTTP_400_BAD_REQUEST,
                success=False
            )

        # Lookup doctor
        doctor = get_doctor_by_identifier(doctor_identifier)
        if not doctor:
            return api_response(
                data=None,
                message="Doctor not found.",
                status_code=status.HTTP_404_NOT_FOUND,
                success=False
            )

        # Check consultation type availability
        if consultation_type == 'IN_PERSON' and not doctor.is_available_for_in_person:
            return api_response(
                data={'slots': [], 'reason': 'Doctor is not available for in-person consultation.'},
                message="In-person consultations not offered by this doctor.",
                success=True
            )
        if consultation_type == 'VIDEO' and not doctor.is_available_for_telehealth:
            return api_response(
                data={'slots': [], 'reason': 'Doctor is not available for telehealth video consultation.'},
                message="Video consultations not offered by this doctor.",
                success=True
            )

        # Parse target date
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return api_response(
                data=None,
                message="Invalid date format. Use YYYY-MM-DD.",
                status_code=status.HTTP_400_BAD_REQUEST,
                success=False
            )

        # Validate date is not in the past
        now_local = timezone.localtime(timezone.now())
        today_local = now_local.date()
        if target_date < today_local:
            return api_response(
                data={'slots': [], 'reason': 'Selected date is in the past.'},
                message="Cannot book appointments in the past.",
                success=True
            )

        # Check blocked dates / holidays
        blocked_date = DoctorBlockedDate.objects.filter(doctor=doctor, date=target_date).first()
        if blocked_date and blocked_date.all_day:
            return api_response(
                data={'slots': [], 'reason': f"Doctor unavailable: {blocked_date.reason}"},
                message=f"Doctor is unavailable on {date_str}: {blocked_date.reason}",
                success=True
            )

        # Find schedule for this weekday (Python weekday: 0=Mon, 6=Sun)
        weekday = target_date.weekday()
        availability = DoctorAvailability.objects.filter(
            doctor=doctor,
            day_of_week=weekday,
            is_active=True
        ).first()

        if not availability:
            return api_response(
                data={'slots': [], 'reason': f"Doctor does not consult on {target_date.strftime('%A')}s."},
                message=f"No consultation schedule configured for {target_date.strftime('%A')}.",
                success=True
            )

        # Fetch existing active bookings on target date
        existing_bookings = Appointment.objects.filter(
            doctor=doctor,
            status__in=[Appointment.Status.PENDING, Appointment.Status.CONFIRMED, Appointment.Status.RESCHEDULED]
        )
        if hasattr(Appointment, 'appointment_date'):
            existing_bookings = existing_bookings.filter(appointment_date=target_date)
        else:
            start_dt = timezone.make_aware(datetime.combine(target_date, time.min))
            end_dt = timezone.make_aware(datetime.combine(target_date, time.max))
            existing_bookings = existing_bookings.filter(scheduled_at__range=(start_dt, end_dt))

        booked_start_times = set()
        for b in existing_bookings:
            local_b_dt = timezone.localtime(b.scheduled_at) if timezone.is_aware(b.scheduled_at) else b.scheduled_at
            booked_start_times.add(local_b_dt.strftime('%H:%M'))

        # Generate candidate slots
        slot_duration = availability.slot_duration_minutes or 30
        current_dt = datetime.combine(target_date, availability.start_time)
        end_dt = datetime.combine(target_date, availability.end_time)

        slots = []
        while current_dt + timedelta(minutes=slot_duration) <= end_dt:
            slot_time = current_dt.time()
            slot_end_time = (current_dt + timedelta(minutes=slot_duration)).time()
            time_key = slot_time.strftime('%H:%M')
            time_display = current_dt.strftime('%I:%M %p')

            # Determine period
            hour = slot_time.hour
            if hour < 12:
                period = 'Morning'
            elif hour < 17:
                period = 'Afternoon'
            else:
                period = 'Evening'

            is_available = True
            unavailable_reason = None

            # 1. Break check
            if availability.break_start_time and availability.break_end_time:
                if availability.break_start_time <= slot_time < availability.break_end_time:
                    is_available = False
                    unavailable_reason = "Doctor Break / Lunch"

            # 2. Blocked partial day check
            if blocked_date and not blocked_date.all_day and blocked_date.start_time and blocked_date.end_time:
                if blocked_date.start_time <= slot_time < blocked_date.end_time:
                    is_available = False
                    unavailable_reason = f"Blocked: {blocked_date.reason}"

            # 3. Past time check for today
            if target_date == today_local:
                # Add 15 minute buffer from current time
                cutoff_time = (now_local + timedelta(minutes=15)).time()
                if slot_time <= cutoff_time:
                    is_available = False
                    unavailable_reason = "Past time"

            # 4. Existing booking collision check
            if time_key in booked_start_times:
                is_available = False
                unavailable_reason = "Already Booked"

            slots.append({
                'time': time_key,
                'time_display': time_display,
                'end_time': slot_end_time.strftime('%H:%M'),
                'period': period,
                'available': is_available,
                'reason': unavailable_reason,
            })

            current_dt += timedelta(minutes=slot_duration)

        return api_response(
            data={
                'doctor_id': str(doctor.id),
                'doctor_name': doctor.user.get_full_name(),
                'date': date_str,
                'weekday': target_date.strftime('%A'),
                'slot_duration_minutes': slot_duration,
                'total_slots': len(slots),
                'available_count': sum(1 for s in slots if s['available']),
                'slots': slots,
            },
            message=f"Found {sum(1 for s in slots if s['available'])} available slots for {date_str}."
        )

    def create(self, request, *args, **kwargs):
        """
        Create an appointment with database transaction safety and double-booking prevention.
        """
        serializer = AppointmentCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        doctor = serializer.validated_data['doctor']
        scheduled_at = serializer.validated_data['scheduled_at']
        consultation_type = serializer.validated_data.get('consultation_type', Appointment.ConsultationType.VIDEO)
        symptoms = serializer.validated_data.get('symptoms', '')

        # Validate future scheduled time
        if scheduled_at <= timezone.now():
            return api_response(
                data=None,
                message="Cannot schedule an appointment in the past.",
                status_code=status.HTTP_400_BAD_REQUEST,
                success=False
            )

        with transaction.atomic():
            # Concurrency check: lock active bookings for this doctor at this timestamp
            collision = Appointment.objects.select_for_update().filter(
                doctor=doctor,
                scheduled_at=scheduled_at,
                status__in=[Appointment.Status.PENDING, Appointment.Status.CONFIRMED, Appointment.Status.RESCHEDULED]
            ).exists()

            if collision:
                return api_response(
                    data=None,
                    message="This time slot was just booked by another patient. Please select another slot.",
                    status_code=status.HTTP_409_CONFLICT,
                    success=False
                )

            appointment = Appointment.objects.create(
                doctor=doctor,
                patient=request.user,
                scheduled_at=scheduled_at,
                consultation_type=consultation_type,
                fee_amount=doctor.consultation_fee,
                symptoms=symptoms,
                status=Appointment.Status.CONFIRMED
            )

        # Dispatch notification
        send_appointment_notification(appointment, 'BOOKED')

        output_data = AppointmentSerializer(appointment, context={'request': request}).data
        return api_response(
            data=output_data,
            message="Appointment successfully booked and confirmed.",
            status_code=status.HTTP_201_CREATED,
            success=True
        )

    @action(detail=True, methods=['post'])
    def reschedule(self, request, pk=None):
        """
        Reschedule an existing appointment to a new date and time atomically.
        """
        appointment = self.get_object()

        # Authorization: patient or doctor
        if appointment.patient != request.user and not (hasattr(request.user, 'doctor_profile') and appointment.doctor == request.user.doctor_profile) and not request.user.is_staff:
            return api_response(
                data=None,
                message="You do not have permission to reschedule this appointment.",
                status_code=status.HTTP_403_FORBIDDEN,
                success=False
            )

        if appointment.status in [Appointment.Status.CANCELLED, Appointment.Status.COMPLETED]:
            return api_response(
                data=None,
                message=f"Cannot reschedule an appointment that is already {appointment.get_status_display().lower()}.",
                status_code=status.HTTP_400_BAD_REQUEST,
                success=False
            )

        serializer = AppointmentRescheduleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_scheduled_at = serializer.validated_data['new_scheduled_at']
        reason = serializer.validated_data.get('reason', '')

        if new_scheduled_at <= timezone.now():
            return api_response(
                data=None,
                message="Cannot reschedule to a time in the past.",
                status_code=status.HTTP_400_BAD_REQUEST,
                success=False
            )

        with transaction.atomic():
            # Check collision for new slot
            collision = Appointment.objects.select_for_update().filter(
                doctor=appointment.doctor,
                scheduled_at=new_scheduled_at,
                status__in=[Appointment.Status.PENDING, Appointment.Status.CONFIRMED, Appointment.Status.RESCHEDULED]
            ).exclude(pk=appointment.pk).exists()

            if collision:
                return api_response(
                    data=None,
                    message="The requested new time slot is already booked. Please choose another slot.",
                    status_code=status.HTTP_409_CONFLICT,
                    success=False
                )

            old_time_str = appointment.scheduled_at.strftime("%b %d, %Y at %I:%M %p")
            appointment.scheduled_at = new_scheduled_at
            appointment.appointment_date = None  # Will auto-sync in save()
            appointment.start_time = None
            appointment.end_time = None
            appointment.status = Appointment.Status.RESCHEDULED
            if reason:
                appointment.doctor_notes = f"{appointment.doctor_notes}\n[Rescheduled from {old_time_str}: {reason}]".strip()
            appointment.save()

        send_appointment_notification(appointment, 'RESCHEDULED', extra_message=f"Previous time: {old_time_str}")

        return api_response(
            data=AppointmentSerializer(appointment, context={'request': request}).data,
            message="Appointment successfully rescheduled."
        )

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Cancel an appointment with audit reason according to configured cancellation policy.
        """
        appointment = self.get_object()

        # Authorization: patient or doctor
        if appointment.patient != request.user and not (hasattr(request.user, 'doctor_profile') and appointment.doctor == request.user.doctor_profile) and not request.user.is_staff:
            return api_response(
                data=None,
                message="You do not have permission to cancel this appointment.",
                status_code=status.HTTP_403_FORBIDDEN,
                success=False
            )

        if appointment.status == Appointment.Status.CANCELLED:
            return api_response(
                data=None,
                message="This appointment is already cancelled.",
                status_code=status.HTTP_400_BAD_REQUEST,
                success=False
            )

        if appointment.status == Appointment.Status.COMPLETED:
            return api_response(
                data=None,
                message="Completed appointments cannot be cancelled.",
                status_code=status.HTTP_400_BAD_REQUEST,
                success=False
            )

        serializer = AppointmentCancelSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reason = serializer.validated_data.get('reason', 'Cancelled by user')

        appointment.status = Appointment.Status.CANCELLED
        appointment.cancellation_reason = reason
        appointment.cancelled_at = timezone.now()
        appointment.cancelled_by = request.user
        appointment.meeting_status = Appointment.MeetingStatus.CANCELLED
        appointment.save()

        send_appointment_notification(appointment, 'CANCELLED', extra_message=f"Reason: {reason}")

        return api_response(
            data=AppointmentSerializer(appointment, context={'request': request}).data,
            message="Appointment cancelled successfully."
        )
