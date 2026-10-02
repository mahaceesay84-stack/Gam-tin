import logging

from django.conf import settings
from django.core.mail import send_mail

from .models import Notification

logger = logging.getLogger(__name__)

PROTOTYPE_NOTE = "Prototype — Not an official UTG service."


def notify(user, title: str, message: str, kind: str = "info", application=None) -> Notification:
    return Notification.objects.create(
        user=user, title=title, message=message, kind=kind, application=application
    )


def notify_staff(title: str, message: str, kind: str = "info", application=None) -> None:
    from apps.accounts.models import Role, User

    for user in User.objects.filter(role__in=[Role.ADMIN, Role.SUPER_ADMIN], is_active=True):
        notify(user, title, message, kind, application)


def send_student_email(user, subject: str, body: str) -> bool:
    """Send a plain-text email; never raises (failures are logged)."""
    if not user.email:
        return False
    text = f"Dear {user.full_name},\n\n{body}\n\n{PROTOTYPE_NOTE}\n"
    try:
        send_mail(subject, text, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False)
        return True
    except Exception:
        logger.exception("Failed to send email %r to user %s", subject, user.pk)
        return False
