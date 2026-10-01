from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    application_reference = serializers.CharField(source="application.reference", default=None, read_only=True)

    class Meta:
        model = Notification
        fields = ["id", "kind", "title", "message", "application", "application_reference", "is_read", "created_at"]
