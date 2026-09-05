from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.doctors.views import SpecialtyViewSet, DoctorViewSet

router = DefaultRouter()
router.register('specialties', SpecialtyViewSet, basename='specialty')
router.register('', DoctorViewSet, basename='doctor')

urlpatterns = [
    path('', include(router.urls)),
]
