import secrets

from django.utils import timezone


def generate_reference(prefix: str, model, field: str = "reference") -> str:
    """Generate e.g. CLR-2026-483920, unique within `model`."""
    year = timezone.now().year
    while True:
        candidate = f"{prefix}-{year}-{secrets.randbelow(900000) + 100000}"
        if not model.objects.filter(**{field: candidate}).exists():
            return candidate
