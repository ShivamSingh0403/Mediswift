from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

try:
    from rest_framework_simplejwt.views import (
        TokenObtainPairView,
        TokenRefreshView,
        TokenVerifyView,
    )
    token_obtain = TokenObtainPairView.as_view()
    token_refresh = TokenRefreshView.as_view()
    token_verify = TokenVerifyView.as_view()
except ImportError:
    def fallback_token_view(request):
        return JsonResponse({"detail": "SimpleJWT not installed in this environment."}, status=501)
    token_obtain = fallback_token_view
    token_refresh = fallback_token_view
    token_verify = fallback_token_view

urlpatterns = [
    path('admin/', admin.site.urls),

    # Authentication & JWT Endpoints
    path('api/token/', token_obtain, name='token_obtain_pair'),
    path('api/token/refresh/', token_refresh, name='token_refresh'),
    path('api/token/verify/', token_verify, name='token_verify'),

    # Core API Endpoints
    path('api/', include('core_api.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
