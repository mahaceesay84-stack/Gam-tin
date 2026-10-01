from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.academics.models import AcademicTerm
from apps.core.audit import record
from apps.core.models import SystemSetting
from apps.core.references import generate_reference
from apps.notifications.services import notify, notify_staff

from .models import (
    ApplicationStatus,
    ClearanceApplication,
    ClearanceApplicationItem,
    ClearanceRequirement,
    ItemStatus,
)


def applicable_requirements(student):
    from django.db.models import Q

    return ClearanceRequirement.objects.filter(
        Q(faculty__isnull=True) | Q(faculty=student.programme.faculty), is_active=True
    )


def _sync_items(application, requirement_ids):
    allowed = {r.id: r for r in applicable_requirements(application.student)}
    unknown = set(requirement_ids) - set(allowed)
    if unknown:
        raise ValidationError({"requirements": "One or more categories are not available to you."})
    wanted = set(requirement_ids) | {r.id for r in allowed.values() if r.is_mandatory}
    application.items.exclude(requirement_id__in=wanted).delete()
    existing = set(application.items.values_list("requirement_id", flat=True))
    for rid in wanted - existing:
        ClearanceApplicationItem.objects.create(application=application, requirement=allowed[rid])


@transaction.atomic
def create_application(student, requirement_ids=None, notes="", request=None):
    term = AcademicTerm.current()
    if term is None:
        raise ValidationError({"detail": "No academic term is configured."})
    if student.verification_status != "verified":
        raise ValidationError({"detail": "Your student record must be verified first."})
    if ClearanceApplication.objects.filter(student=student, term=term).exclude(status="rejected").exists():
        raise ValidationError({"detail": "You already have a clearance application for this term."})
    app = ClearanceApplication.objects.create(student=student, term=term, student_notes=notes)
    if requirement_ids is None:
        requirement_ids = [r.id for r in applicable_requirements(student)]
    _sync_items(app, requirement_ids)
    record(request, student.user, "clearance.created", app)
    return app


@transaction.atomic
def update_application(app, requirement_ids=None, notes=None, request=None):
    if not app.is_editable:
        raise ValidationError({"detail": "This application can no longer be edited."})
    if requirement_ids is not None:
        _sync_items(app, requirement_ids)
    if notes is not None:
        app.student_notes = notes
        app.save(update_fields=["student_notes", "updated_at"])
    return app


@transaction.atomic
def submit_application(app, request=None):
    if not app.is_editable:
        raise ValidationError({"detail": "This application has already been submitted."})
    items = list(app.items.select_related("requirement").prefetch_related("documents"))
    if not items:
        raise ValidationError({"detail": "Select at least one clearance category."})
    missing = [i.requirement.name for i in items if i.requirement.requires_document and not i.documents.all()]
    if missing:
        raise ValidationError({"detail": f"Missing required documents for: {', '.join(missing)}."})
    resubmission = app.status == ApplicationStatus.CORRECTION_REQUESTED
    if not app.reference:
        app.reference = generate_reference("CLR", ClearanceApplication)
    if app.fee_amount is None:
        app.fee_amount = SystemSetting.digital_service_fee()
        app.fee_currency = SystemSetting.currency()
    app.status = ApplicationStatus.SUBMITTED
    app.submitted_at = timezone.now()
    app.decision_reason = ""
    app.save()
    for item in items:
        item.status = ItemStatus.PENDING
        item.save(update_fields=["status"])
    record(request, app.student.user, "clearance.resubmitted" if resubmission else "clearance.submitted", app)
    notify(
        app.student.user,
        "Clearance submitted",
        f"Your clearance {app.reference} was received. Pay the digital service fee to continue.",
        "clearance",
        app,
    )
    notify_staff(
        "Clearance resubmitted" if resubmission else "New clearance submitted",
        f"{app.student.user.full_name} ({app.student.student_number}) submitted {app.reference}.",
        "clearance",
        app,
    )
    return app


@transaction.atomic
def decide(app, admin_user, decision: str, reason: str = "", request=None):
    if app.status != ApplicationStatus.SUBMITTED:
        raise ValidationError({"detail": "Only submitted applications can be reviewed."})
    if decision in ("reject", "correction") and not reason.strip():
        raise ValidationError({"reason": "A reason is required."})
    if decision == "approve" and not app.payments.filter(status="paid").exists():
        raise ValidationError({"detail": "The digital service fee has not been paid."})

    new_status, item_status, title, message = {
        "approve": (
            ApplicationStatus.APPROVED,
            ItemStatus.CLEARED,
            "Clearance approved",
            f"Your clearance {app.reference} was approved. Proceed to the official UTG portal.",
        ),
        "reject": (
            ApplicationStatus.REJECTED,
            ItemStatus.REJECTED,
            "Clearance rejected",
            f"Your clearance {app.reference} was rejected: {reason}",
        ),
        "correction": (
            ApplicationStatus.CORRECTION_REQUESTED,
            ItemStatus.PENDING,
            "Correction requested",
            f"Please correct your clearance {app.reference}: {reason}",
        ),
    }[decision]

    app.status = new_status
    app.reviewed_by = admin_user
    app.reviewed_at = timezone.now()
    app.decision_reason = reason.strip()
    app.save()
    app.items.update(status=item_status)
    record(request, admin_user, f"clearance.{decision}", app, reason=reason)
    notify(app.student.user, title, message, "decision", app)
    return app
