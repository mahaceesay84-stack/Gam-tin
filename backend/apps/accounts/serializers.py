from django.contrib.auth import password_validation
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from apps.academics.models import Programme

from .models import Role, Student, User, VerificationStatus


class StudentSerializer(serializers.ModelSerializer):
    programme_name = serializers.CharField(source="programme.name", read_only=True)
    faculty_name = serializers.CharField(source="programme.faculty.name", read_only=True)

    class Meta:
        model = Student
        fields = [
            "id",
            "student_number",
            "programme",
            "programme_name",
            "faculty_name",
            "level",
            "expected_graduation_year",
            "verification_status",
            "verified_at",
        ]


class UserSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)

    class Meta:
        model = User
        fields = ["id", "email", "full_name", "phone", "role", "student"]


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    full_name = serializers.CharField(max_length=150)
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True)
    student_number = serializers.CharField(max_length=30)
    programme = serializers.PrimaryKeyRelatedField(queryset=Programme.objects.filter(is_active=True))
    level = serializers.IntegerField(min_value=1, max_value=8, default=4)

    def validate_email(self, value):
        value = value.lower()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate_student_number(self, value):
        value = value.strip().upper()
        if Student.objects.filter(student_number=value).exists():
            raise serializers.ValidationError("This student number is already registered.")
        return value

    def validate(self, attrs):
        password_validation.validate_password(attrs["password"])
        return attrs

    def create(self, validated):
        user = User.objects.create_user(
            email=validated["email"],
            password=validated["password"],
            full_name=validated["full_name"],
            phone=validated.get("phone", ""),
            role=Role.STUDENT,
        )
        # Prototype: student records are auto-verified. A real deployment would
        # match against the university registry before marking VERIFIED.
        Student.objects.create(
            user=user,
            student_number=validated["student_number"],
            programme=validated["programme"],
            level=validated["level"],
            verification_status=VerificationStatus.VERIFIED,
            verified_at=timezone.now(),
        )
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


def tokens_for(user: User) -> dict:
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}
