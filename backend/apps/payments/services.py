from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.core.audit import record
from apps.core.references import generate_reference
from apps.notifications.services import notify, notify_staff

from .models import Payment, PaymentStatus


@transaction.atomic
def pay_application(application, method: str, phone: str, request=None) -> Payment:
    """Simulated mobile-money payment (prototype only - no real provider call).

    A payer phone number ending in "0000" simulates a failed payment so the
    failure flow can be demonstrated. Idempotent: an already-paid application
    returns its existing payment.
    """
    if application.status not in ("submitted",):
        raise ValidationError({"detail": "Payment is only available for submitted applications."})
    existing = application.payments.filter(status=PaymentStatus.PAID).first()
    if existing:
        return existing

    payment = Payment(
        reference=generate_reference("PAY", Payment),
        application=application,
        amount=application.fee_amount,
        currency=application.fee_currency,
        method=method,
        payer_phone=phone,
    )
    if phone.endswith("0000"):
        payment.status = PaymentStatus.FAILED
        payment.failure_reason = "Simulated failure: insufficient funds."
        payment.save()
        record(request, application.student.user, "payment.failed", payment)
        notify(
            application.student.user,
            "Payment failed",
            f"Payment {payment.reference} failed. Please try again.",
            "payment",
            application,
        )
        return payment

    payment.status = PaymentStatus.PAID
    payment.paid_at = timezone.now()
    payment.provider_reference = f"MOCK-{payment.reference[-6:]}"
    payment.save()
    record(request, application.student.user, "payment.paid", payment, amount=str(payment.amount))
    notify(
        application.student.user,
        "Payment received",
        f"We received {payment.currency} {payment.amount} ({payment.reference}). Your clearance is now awaiting approval.",
        "payment",
        application,
    )
    notify_staff(
        "Payment received",
        f"{application.reference} has been paid ({payment.reference}) and is ready for review.",
        "payment",
        application,
    )
    return payment
