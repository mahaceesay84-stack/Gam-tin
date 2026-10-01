from django.conf import settings
from django.db import models

from apps.core.storage import get_document_storage


class ClearanceRequirement(models.Model):
    """A clearance category (Library, Finance, Department...)."""

    code = models.CharField(max_length=30, unique=True)
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    faculty = models.ForeignKey(
        "academics.Faculty",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="requirements",
        help_text="Leave empty for requirements that apply to every faculty.",
    )
    is_mandatory = models.BooleanField(default=True)
    requires_document = models.BooleanField(default=False)
    document_hint = models.CharField(max_length=200, blank=True)
    sort_order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["sort_order", "name"]

    def __str__(self) -> str:
        return self.name


class ApplicationStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    SUBMITTED = "submitted", "Submitted"
    CORRECTION_REQUESTED = "correction_requested", "Correction requested"
    APPROVED = "approved", "Approved"
    REJECTED = "rejected", "Rejected"


class ClearanceApplication(models.Model):
    reference = models.CharField(max_length=30, unique=True, null=True, blank=True)
    student = models.ForeignKey("accounts.Student", on_delete=models.CASCADE, related_name="applications")
    term = models.ForeignKey("academics.AcademicTerm", on_delete=models.PROTECT, related_name="applications")
    status = models.CharField(
        max_length=30, choices=ApplicationStatus.choices, default=ApplicationStatus.DRAFT, db_index=True
    )
    student_notes = models.TextField(blank=True)
    fee_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    fee_currency = models.CharField(max_length=3, default="GMD")
    submitted_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="reviewed_applications"
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    decision_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.reference or f"draft-{self.pk}"

    @property
    def is_editable(self) -> bool:
        return self.status in (ApplicationStatus.DRAFT, ApplicationStatus.CORRECTION_REQUESTED)

    @property
    def paid_payment(self):
        return self.payments.filter(status="paid").order_by("-paid_at").first()


class ItemStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    CLEARED = "cleared", "Cleared"
    REJECTED = "rejected", "Rejected"


class ClearanceApplicationItem(models.Model):
    application = models.ForeignKey(ClearanceApplication, on_delete=models.CASCADE, related_name="items")
    requirement = models.ForeignKey(ClearanceRequirement, on_delete=models.PROTECT, related_name="items")
    status = models.CharField(max_length=20, choices=ItemStatus.choices, default=ItemStatus.PENDING)
    remarks = models.CharField(max_length=255, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["application", "requirement"], name="uniq_item_per_requirement")
        ]
        ordering = ["requirement__sort_order", "id"]

    def __str__(self) -> str:
        return f"{self.application} / {self.requirement.code}"


class Document(models.Model):
    application = models.ForeignKey(ClearanceApplication, on_delete=models.CASCADE, related_name="documents")
    item = models.ForeignKey(ClearanceApplicationItem, on_delete=models.CASCADE, related_name="documents")
    file = models.FileField(upload_to="clearance/%Y/%m/", storage=get_document_storage)
    original_name = models.CharField(max_length=255)
    content_type = models.CharField(max_length=100, blank=True)
    size = models.PositiveIntegerField(default=0)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name="+"
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["uploaded_at"]

    def __str__(self) -> str:
        return self.original_name
