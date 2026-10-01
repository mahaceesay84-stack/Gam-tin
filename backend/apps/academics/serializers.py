from rest_framework import serializers

from .models import AcademicTerm, Faculty, Programme


class FacultySerializer(serializers.ModelSerializer):
    class Meta:
        model = Faculty
        fields = ["id", "code", "name"]


class ProgrammeSerializer(serializers.ModelSerializer):
    faculty_name = serializers.CharField(source="faculty.name", read_only=True)

    class Meta:
        model = Programme
        fields = ["id", "code", "name", "faculty", "faculty_name", "duration_years"]


class AcademicTermSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicTerm
        fields = ["id", "name", "start_date", "end_date", "is_current"]
