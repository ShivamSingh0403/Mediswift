from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.users.views import AddressViewSet

router = DefaultRouter()
router.register('addresses', AddressViewSet, basename='user-address')

urlpatterns = [
    path('', include(router.urls)),
]
