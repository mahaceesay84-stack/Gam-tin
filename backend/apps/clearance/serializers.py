import os

from django.conf import settings
from rest_framework import serializers

from apps.core.models import SystemSetting

from .models import ClearanceApplication, ClearanceApplicationItem, ClearanceRequirement, Document

DEFAULT_PORTAL_URL = "https://www.utg.edu.gm"


class RequirementSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClearanceRequirement
        fields = ["id", "code", "name", "description", "is_mandatory", "requires_document", "document_hint"]


class DocumentSerializer(serializers.ModelSerializer):
    requirement = serializers.IntegerField(source="item.requirement_id", read_only=True)

    class Meta:
        model = Document
        fields = ["id", "item", "requirement", "original_name", "content_type", "size", "uploaded_at"]


class ItemSerializer(serializers.ModelSerializer):
    requirement = RequirementSerializer(read_only=True)
    documents = DocumentSerializer(many=True, read_only=True)

    class Meta:
        model = ClearanceApplicationItem
        fields = ["id", "requirement", "status", "remarks", "documents"]


class PaymentBriefSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    reference = serializers.CharField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    currency = serializers.CharField()
    method = serializers.CharField()
    status = serializers.CharField()
    paid_at = serializers.DateTimeField()


class ApplicationSerializer(serializers.ModelSerializer):
    items = ItemSerializer(many=True, read_only=True)
    term_name = serializers.CharField(source="term.name", read_only=True)
    student = serializers.SerializerMethodField()
    payment_status = serializers.SerializerMethodField()
    payment = serializers.SerializerMethodField()
    handoff = serializers.SerializerMethodField()
    is_editable = serializers.BooleanField(read_only=True)
    reviewed_by_name = serializers.CharField(source="reviewed_by.full_name", default=None, read_only=True)

    class Meta:
        model = ClearanceApplication
        fields = [
            "id",
            "reference",
            "status",
            "is_editable",
            "term",
            "term_name",
            "student",
            "student_notes",
            "fee_amount",
            "fee_currency",
            "payment_status",
            "payment",
            "submitted_at",
            "reviewed_at",
            "reviewed_by_name",
            "decision_reason",
            "handoff",
            "items",
            "created_at",
        ]

    def get_student(self, obj):
        s = obj.student
        return {
            "id": s.id,
            "student_number": s.student_number,
            "full_name": s.user.full_name,
            "email": s.user.email,
            "phone": s.user.phone,
            "programme": s.programme.name,
            "faculty": s.programme.faculty.name,
            "level": s.level,
            "verification_status": s.verification_status,
        }

    def _latest_payment(self, obj):
        payments = list(obj.payments.all())
        paid = [p for p in payments if p.status == "paid"]
        if paid:
            return paid[0]
        return payments[0] if payments else None

    def get_payment_status(self, obj):
        payment = self._latest_payment(obj)
        return payment.status if payment else "unpaid"

    def get_payment(self, obj):
        payment = self._latest_payment(obj)
        return PaymentBriefSerializer(payment).data if payment else None

    def get_handoff(self, obj):
        if obj.status != "approved":
            return None
        return {
            "portal_url": SystemSetting.get("official_portal_url", DEFAULT_PORTAL_URL),
            "instructions": (
                "Your clearance has been approved. Please proceed to the official UTG portal "
                "to complete your final clearance and graduation process. Quote your clearance "
                f"reference {obj.reference} when asked. This platform is a prototype and is not "
                "an official UTG service."
            ),
        }


class ApplicationCreateSerializer(serializers.Serializer):
    requirements = serializers.ListField(child=serializers.IntegerField(), required=False)
    student_notes = serializers.CharField(required=False, allow_blank=True)


class ApplicationUpdateSerializer(serializers.Serializer):
    requirements = serializers.ListField(child=serializers.IntegerField(), required=False)
    student_notes = serializers.CharField(required=False, allow_blank=True)


class DocumentUploadSerializer(serializers.Serializer):
    requirement = serializers.IntegerField()
    file = serializers.FileField()

    def validate_file(self, f):
        ext = os.path.splitext(f.name)[1].lstrip(".").lower()
        if ext not in settings.DOCUMENT_ALLOWED_EXTENSIONS:
            raise serializers.ValidationError(
                f"Unsupported file type. Allowed: {', '.join(settings.DOCUMENT_ALLOWED_EXTENSIONS)}."
            )
        if f.size > settings.DOCUMENT_MAX_UPLOAD_BYTES:
            raise serializers.ValidationError("File too large (max 5 MB).")
        return f


class DecisionSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True)
