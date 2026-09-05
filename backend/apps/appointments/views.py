from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from apps.common.responses import api_response
from apps.appointments.models import DoctorAvailability, Appointment
from apps.appointments.serializers import (
    DoctorAvailabilitySerializer,
    AppointmentSerializer,
    AppointmentCreateSerializer,
)

class DoctorAvailabilityViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = DoctorAvailabilitySerializer
    permission_classes = (permissions.AllowAny,)

    def get_queryset(self):
        doctor_id = self.request.query_params.get('doctor_id')
        if doctor_id:
            return DoctorAvailability.objects.filter(doctor_id=doctor_id, is_active=True)
        return DoctorAvailability.objects.filter(is_active=True)

class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'doctor_profile'):
            return Appointment.objects.filter(doctor=user.doctor_profile).select_related('doctor', 'patient', 'doctor__user', 'doctor__user__profile')
        return Appointment.objects.filter(patient=user).select_related('doctor', 'patient', 'doctor__user', 'doctor__user__profile')

    def create(self, request, *args, **kwargs):
        serializer = AppointmentCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        appointment = serializer.save()
        output_data = AppointmentSerializer(appointment, context={'request': request}).data
        return api_response(
            data=output_data,
            message="Appointment booked successfully.",
            status_code=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        appointment = self.get_object()
        appointment.status = Appointment.Status.CANCELLED
        appointment.save()
        return api_response(
            data=AppointmentSerializer(appointment, context={'request': request}).data,
            message="Appointment cancelled."
        )
