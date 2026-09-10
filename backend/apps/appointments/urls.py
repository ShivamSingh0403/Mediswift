from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.appointments.views import DoctorAvailabilityViewSet, DoctorBlockedDateViewSet, AppointmentViewSet

router = DefaultRouter()
router.register('availabilities', DoctorAvailabilityViewSet, basename='availability')
router.register('blocked-dates', DoctorBlockedDateViewSet, basename='blocked-date')
router.register('', AppointmentViewSet, basename='appointment')

urlpatterns = [
    path('', include(router.urls)),
]
