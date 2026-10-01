from rest_framework.permissions import BasePermission

from apps.accounts.models import Role


class _RolePermission(BasePermission):
    roles: tuple[str, ...] = ()

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role in self.roles)


class IsStudent(_RolePermission):
    roles = (Role.STUDENT,)


class IsStaff(_RolePermission):
    """Admin or Super Admin."""

    roles = (Role.ADMIN, Role.SUPER_ADMIN)


class IsSuperAdmin(_RolePermission):
    roles = (Role.SUPER_ADMIN,)
