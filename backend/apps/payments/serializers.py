import re

from rest_framework import serializers

from .models import Payment, PaymentMethod


class PaymentSerializer(serializers.ModelSerializer):
    application_reference = serializers.CharField(source="application.reference", read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id",
            "reference",
            "application",
            "application_reference",
            "amount",
            "currency",
            "method",
            "payer_phone",
            "status",
            "failure_reason",
            "paid_at",
            "created_at",
        ]


class PayRequestSerializer(serializers.Serializer):
    method = serializers.ChoiceField(choices=PaymentMethod.choices)
    phone = serializers.CharField(max_length=30)

    def validate_phone(self, value):
        value = re.sub(r"[\s-]", "", value)
        if not re.fullmatch(r"(\+?220)?\d{9}", value):
            raise serializers.ValidationError("Enter a valid Gambian mobile number (9 digits).")
        return value
