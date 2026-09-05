from django.urls import path
from apps.payments.views import InitiatePaymentView, ConfirmPaymentMockView

urlpatterns = [
    path('initiate/', InitiatePaymentView.as_view(), name='payment-initiate'),
    path('<uuid:payment_id>/confirm/', ConfirmPaymentMockView.as_view(), name='payment-confirm'),
]
