from django.db import models


class Faculty(models.Model):
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=150)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "faculties"

    def __str__(self) -> str:
        return self.name


class Programme(models.Model):
    faculty = models.ForeignKey(Faculty, on_delete=models.PROTECT, related_name="programmes")
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=200)
    duration_years = models.PositiveSmallIntegerField(default=4)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class AcademicTerm(models.Model):
    name = models.CharField(max_length=100, unique=True, help_text="e.g. 2025/2026 Semester 2")
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)

    class Meta:
        ordering = ["-start_date"]

    def __str__(self) -> str:
        return self.name

    @classmethod
    def current(cls):
        return cls.objects.filter(is_current=True).first() or cls.objects.first()
