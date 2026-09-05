from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.appointments.views import DoctorAvailabilityViewSet, AppointmentViewSet

router = DefaultRouter()
router.register('availabilities', DoctorAvailabilityViewSet, basename='availability')
router.register('', AppointmentViewSet, basename='appointment')

urlpatterns = [
    path('', include(router.urls)),
]
