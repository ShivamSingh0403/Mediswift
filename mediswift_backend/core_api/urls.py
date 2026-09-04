from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterViewSet,
    UserViewSet,
    MedicineViewSet,
    DoctorViewSet,
    OrderViewSet,
    AppointmentViewSet,
    PrescriptionViewSet,
    DoctorAvailableSlotsView,
    CreateStripeCheckoutSessionView,
    StripeWebhookView,
)

router = DefaultRouter()
router.register(r'auth/register', RegisterViewSet, basename='register')
router.register(r'register', RegisterViewSet, basename='register_direct')
router.register(r'users', UserViewSet, basename='user')
router.register(r'medicines', MedicineViewSet, basename='medicine')
router.register(r'doctors', DoctorViewSet, basename='doctor')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'appointments', AppointmentViewSet, basename='appointment')
router.register(r'prescriptions', PrescriptionViewSet, basename='prescription')

urlpatterns = [
    # Telehealth dynamic available slots
    path('doctors/available-slots/', DoctorAvailableSlotsView.as_view(), name='doctor_available_slots'),

    # Stripe payment integration
    path('checkout/create-session/', CreateStripeCheckoutSessionView.as_view(), name='stripe_create_session'),
    path('webhook/stripe/', StripeWebhookView.as_view(), name='stripe_webhook'),

    # DRF router endpoints
    path('', include(router.urls)),
]
