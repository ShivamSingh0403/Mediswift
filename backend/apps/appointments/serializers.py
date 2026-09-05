from rest_framework import serializers
from apps.appointments.models import DoctorAvailability, Appointment
from apps.doctors.serializers import DoctorListSerializer
from apps.users.serializers import UserSerializer

class DoctorAvailabilitySerializer(serializers.ModelSerializer):
    weekday_display = serializers.CharField(source='get_day_of_week_display', read_only=True)

    class Meta:
        model = DoctorAvailability
        fields = ('id', 'doctor', 'day_of_week', 'weekday_display', 'start_time', 'end_time', 'slot_duration_minutes', 'is_active')

class AppointmentSerializer(serializers.ModelSerializer):
    doctor = DoctorListSerializer(read_only=True)
    patient = UserSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    consultation_type_display = serializers.CharField(source='get_consultation_type_display', read_only=True)

    class Meta:
        model = Appointment
        fields = (
            'id', 'doctor', 'patient', 'scheduled_at', 'consultation_type',
            'consultation_type_display', 'status', 'status_display',
            'fee_amount', 'symptoms', 'meeting_link', 'doctor_notes', 'created_at'
        )
        read_only_fields = ('id', 'doctor', 'patient', 'fee_amount', 'meeting_link', 'doctor_notes', 'created_at')

class AppointmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ('doctor', 'scheduled_at', 'consultation_type', 'symptoms')

    def create(self, validated_data):
        doctor = validated_data['doctor']
        validated_data['patient'] = self.context['request'].user
        validated_data['fee_amount'] = doctor.consultation_fee
        validated_data['meeting_link'] = f"https://meet.mediswift.in/telehealth/{self.context['request'].user.id}"
        return super().create(validated_data)
