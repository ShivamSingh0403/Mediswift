from rest_framework import serializers
from apps.appointments.models import DoctorAvailability, DoctorBlockedDate, Appointment
from apps.doctors.serializers import DoctorListSerializer
from apps.users.serializers import UserSerializer

class DoctorAvailabilitySerializer(serializers.ModelSerializer):
    weekday_display = serializers.CharField(source='get_day_of_week_display', read_only=True)

    class Meta:
        model = DoctorAvailability
        fields = (
            'id', 'doctor', 'day_of_week', 'weekday_display',
            'start_time', 'end_time', 'slot_duration_minutes',
            'break_start_time', 'break_end_time', 'is_active'
        )

class DoctorBlockedDateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorBlockedDate
        fields = ('id', 'doctor', 'date', 'reason', 'all_day', 'start_time', 'end_time')

class AppointmentSerializer(serializers.ModelSerializer):
    doctor = DoctorListSerializer(read_only=True)
    patient = UserSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    consultation_type_display = serializers.CharField(source='get_consultation_type_display', read_only=True)
    meeting_url = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = (
            'id', 'booking_reference', 'doctor', 'patient', 'scheduled_at',
            'appointment_date', 'start_time', 'end_time',
            'consultation_type', 'consultation_type_display',
            'status', 'status_display', 'fee_amount', 'symptoms',
            'meeting_provider', 'meeting_room_id', 'meeting_url', 'meeting_status',
            'doctor_notes', 'cancellation_reason', 'cancelled_at', 'created_at', 'updated_at'
        )
        read_only_fields = (
            'id', 'booking_reference', 'doctor', 'patient', 'fee_amount',
            'meeting_provider', 'meeting_room_id', 'meeting_url', 'meeting_status',
            'doctor_notes', 'cancellation_reason', 'cancelled_at', 'created_at', 'updated_at'
        )

    def get_meeting_url(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        # Only expose private meeting URL to authorized participants
        user = request.user
        if user == obj.patient or (hasattr(user, 'doctor_profile') and obj.doctor == user.doctor_profile) or user.is_staff:
            return obj.meeting_url
        return None

class AppointmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ('doctor', 'scheduled_at', 'consultation_type', 'symptoms')

class AppointmentRescheduleSerializer(serializers.Serializer):
    new_scheduled_at = serializers.DateTimeField(required=True)
    reason = serializers.CharField(required=False, allow_blank=True)

class AppointmentCancelSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True, default="Cancelled by user")
