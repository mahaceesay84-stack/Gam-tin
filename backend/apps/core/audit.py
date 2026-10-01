from .models import AuditLog


def _client_ip(request) -> str | None:
    if request is None:
        return None
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def record(request, actor, action: str, entity=None, **metadata) -> AuditLog:
    return AuditLog.objects.create(
        actor=actor if actor and getattr(actor, "is_authenticated", False) else None,
        action=action,
        entity_type=entity.__class__.__name__ if entity is not None else "",
        entity_id=str(entity.pk) if entity is not None else "",
        metadata=metadata,
        ip_address=_client_ip(request),
    )
