from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.audit import record
from apps.notifications.services import notify

from .models import Role
from .serializers import LoginSerializer, RegisterSerializer, UserSerializer, tokens_for


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        record(request, user, "auth.registered", user)
        notify(
            user,
            "Welcome to UTG Digital Student Services",
            "Your student record has been verified. You can now start your clearance.",
            "verification",
        )
        return Response(
            {"user": UserSerializer(user).data, **tokens_for(user)}, status=status.HTTP_201_CREATED
        )


class _BaseLoginView(APIView):
    permission_classes = [AllowAny]
    allowed_roles: tuple[str, ...] = ()

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            request,
            username=serializer.validated_data["email"].lower(),
            password=serializer.validated_data["password"],
        )
        if user is None or user.role not in self.allowed_roles:
            record(request, None, "auth.login_failed", email=serializer.validated_data["email"])
            return Response({"detail": "Invalid email or password."}, status=status.HTTP_401_UNAUTHORIZED)
        record(request, user, "auth.login", user)
        return Response({"user": UserSerializer(user).data, **tokens_for(user)})


class StudentLoginView(_BaseLoginView):
    allowed_roles = (Role.STUDENT,)


class AdminLoginView(_BaseLoginView):
    allowed_roles = (Role.ADMIN, Role.SUPER_ADMIN)


class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)
