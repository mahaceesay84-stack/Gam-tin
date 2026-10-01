from django.db import models


class PaymentMethod(models.TextChoices):
    WAVE = "wave", "Wave"
    QMONEY = "qmoney", "QMoney"
    AFRIMONEY = "afrimoney", "Afrimoney"
    MOBILE_MONEY = "mobile_money", "Mobile Money"


class PaymentStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    PAID = "paid", "Paid"
    FAILED = "failed", "Failed"
    REFUNDED = "refunded", "Refunded"


class Payment(models.Model):
    reference = models.CharField(max_length=30, unique=True)
    application = models.ForeignKey(
        "clearance.ClearanceApplication", on_delete=models.CASCADE, related_name="payments"
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default="GMD")
    method = models.CharField(max_length=20, choices=PaymentMethod.choices)
    payer_phone = models.CharField(max_length=30)
    status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING, db_index=True)
    provider_reference = models.CharField(max_length=60, blank=True)
    failure_reason = models.CharField(max_length=255, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.reference
