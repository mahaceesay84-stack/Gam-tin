from decimal import Decimal, InvalidOperation

from django.conf import settings
from django.db import models

FEE_KEY = "digital_service_fee"
CURRENCY_KEY = "currency"
DEFAULT_FEE = Decimal("50.00")
DEFAULT_CURRENCY = "GMD"


class SystemSetting(models.Model):
    """Key/value runtime configuration editable by Super Admins."""

    key = models.CharField(max_length=100, unique=True)
    value = models.CharField(max_length=500)
    description = models.CharField(max_length=255, blank=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["key"]

    def __str__(self) -> str:
        return f"{self.key}={self.value}"

    @classmethod
    def get(cls, key: str, default: str | None = None) -> str | None:
        row = cls.objects.filter(key=key).first()
        return row.value if row else default

    @classmethod
    def digital_service_fee(cls) -> Decimal:
        raw = cls.get(FEE_KEY, str(DEFAULT_FEE))
        try:
            return Decimal(raw).quantize(Decimal("0.01"))
        except (InvalidOperation, TypeError):
            return DEFAULT_FEE

    @classmethod
    def currency(cls) -> str:
        return cls.get(CURRENCY_KEY, DEFAULT_CURRENCY) or DEFAULT_CURRENCY


class AuditLog(models.Model):
    """Append-only record of significant actions."""

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="audit_logs",
    )
    action = models.CharField(max_length=100, db_index=True)
    entity_type = models.CharField(max_length=100, blank=True)
    entity_id = models.CharField(max_length=100, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.action} {self.entity_type}:{self.entity_id}"
