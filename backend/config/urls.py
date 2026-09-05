"""
MediSwift URL Configuration
All APIs are versioned under /api/v1/
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
from apps.users.views import DecoratedTokenObtainPairView, RegisterView, CurrentUserView

api_v1_patterns = [
    # Auth & Users
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/login/', DecoratedTokenObtainPairView.as_view(), name='auth_login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='auth_token_refresh'),
    path('users/me/', CurrentUserView.as_view(), name='users_me'),
    path('users/', include('apps.users.urls')),

    # Modular apps
    path('products/', include('apps.products.urls')),
    path('prescriptions/', include('apps.prescriptions.urls')),
    path('doctors/', include('apps.doctors.urls')),
    path('appointments/', include('apps.appointments.urls')),
    path('cart/', include('apps.cart.urls')),
    path('orders/', include('apps.orders.urls')),
    path('payments/', include('apps.payments.urls')),
    path('notifications/', include('apps.notifications.urls')),
    path('analytics/', include('apps.analytics.urls')),
]

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include(api_v1_patterns)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
