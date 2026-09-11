from django.urls import path
from apps.payments.views import InitiatePaymentView, VerifyPaymentView, ConfirmPaymentMockView

urlpatterns = [
    path('initiate/', InitiatePaymentView.as_view(), name='payment-initiate'),
    path('verify/', VerifyPaymentView.as_view(), name='payment-verify'),
    path('<uuid:payment_id>/confirm/', ConfirmPaymentMockView.as_view(), name='payment-confirm'),
]
