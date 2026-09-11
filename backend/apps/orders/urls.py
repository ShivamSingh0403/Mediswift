from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.orders.views import (
    OrderViewSet,
    CheckoutView,
    ValidateCouponView,
    AvailableCouponsView
)

router = DefaultRouter()
router.register('', OrderViewSet, basename='order')

urlpatterns = [
    path('checkout/', CheckoutView.as_view(), name='order-checkout'),
    path('validate-coupon/', ValidateCouponView.as_view(), name='order-validate-coupon'),
    path('available-coupons/', AvailableCouponsView.as_view(), name='order-available-coupons'),
    path('', include(router.urls)),
]
