from django.contrib import admin

from .models import AuditLog, SystemSetting

admin.site.register(SystemSetting)


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("created_at", "actor", "action", "entity_type", "entity_id")
    readonly_fields = [f.name for f in AuditLog._meta.fields]
