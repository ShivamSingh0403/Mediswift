from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from apps.common.responses import api_response
from apps.notifications.models import Notification
from apps.notifications.serializers import NotificationSerializer

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return api_response(message="Notification marked as read.")

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return api_response(message="All notifications marked as read.")
