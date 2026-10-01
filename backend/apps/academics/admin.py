from django.contrib import admin

from .models import AcademicTerm, Faculty, Programme

admin.site.register(Faculty)
admin.site.register(Programme)
admin.site.register(AcademicTerm)
