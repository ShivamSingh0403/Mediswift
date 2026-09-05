from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.orders.views import OrderViewSet, CheckoutView

router = DefaultRouter()
router.register('', OrderViewSet, basename='order')

urlpatterns = [
    path('checkout/', CheckoutView.as_view(), name='order-checkout'),
    path('', include(router.urls)),
]
