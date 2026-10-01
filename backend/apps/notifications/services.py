from .models import Notification


def notify(user, title: str, message: str, kind: str = "info", application=None) -> Notification:
    return Notification.objects.create(
        user=user, title=title, message=message, kind=kind, application=application
    )


def notify_staff(title: str, message: str, kind: str = "info", application=None) -> None:
    from apps.accounts.models import Role, User

    for user in User.objects.filter(role__in=[Role.ADMIN, Role.SUPER_ADMIN], is_active=True):
        notify(user, title, message, kind, application)
