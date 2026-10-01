from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(ListAPIView):
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).select_related("application")

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        response.data["unread"] = self.get_queryset().filter(is_read=False).count()
        return response


class MarkReadView(APIView):
    def post(self, request, pk):
        updated = Notification.objects.filter(user=request.user, pk=pk).update(is_read=True)
        if not updated:
            return Response({"detail": "Not found."}, status=404)
        return Response({"detail": "ok"})


class MarkAllReadView(APIView):
    def post(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"detail": "ok"})
