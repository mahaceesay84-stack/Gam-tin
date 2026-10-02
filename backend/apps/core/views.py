from rest_framework import serializers
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .audit import record
from .models import AuditLog, SystemSetting
from .permissions import IsSuperAdmin


class ApiIndexView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            "name": "UTG Digital Student Services API",
            "status": "ok",
            "prototype": True,
            "note": "Prototype \u2014 Not an official UTG service.",
            "endpoints": {
                "health": "/api/health/",
                "fee": "/api/fee/",
                "auth": "/api/auth/",
                "academics": "/api/academics/",
                "clearance": "/api/clearance/",
                "payments": "/api/payments/",
                "notifications": "/api/notifications/",
                "admin_settings": "/api/admin/settings/",
                "admin_audit_logs": "/api/admin/audit-logs/",
            },
        })


class HealthView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"status": "ok"})


class FeeView(APIView):
    """Public: the current digital service fee (loaded from SystemSetting)."""

    permission_classes = [AllowAny]

    def get(self, request):
        return Response(
            {
                "amount": str(SystemSetting.digital_service_fee()),
                "currency": SystemSetting.currency(),
            }
        )


class SystemSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSetting
        fields = ["key", "value", "description", "updated_at"]
        read_only_fields = ["key", "description", "updated_at"]


class SettingsListView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        return Response(SystemSettingSerializer(SystemSetting.objects.all(), many=True).data)


class SettingDetailView(APIView):
    permission_classes = [IsSuperAdmin]

    def put(self, request, key):
        setting = SystemSetting.objects.filter(key=key).first()
        if setting is None:
            return Response({"detail": "Setting not found."}, status=404)
        serializer = SystemSettingSerializer(setting, data=request.data)
        serializer.is_valid(raise_exception=True)
        if key == "digital_service_fee":
            try:
                if float(serializer.validated_data["value"]) < 0:
                    raise ValueError
            except ValueError:
                return Response({"detail": "Fee must be a non-negative number."}, status=400)
        old = setting.value
        serializer.save(updated_by=request.user)
        record(request, request.user, "setting.updated", setting, old=old, new=setting.value)
        return Response(serializer.data)


class AuditLogSerializer(serializers.ModelSerializer):
    actor_email = serializers.EmailField(source="actor.email", default=None, read_only=True)

    class Meta:
        model = AuditLog
        fields = ["id", "actor_email", "action", "entity_type", "entity_id", "metadata", "created_at"]


class AuditLogListView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        logs = AuditLog.objects.select_related("actor")[:200]
        return Response(AuditLogSerializer(logs, many=True).data)
