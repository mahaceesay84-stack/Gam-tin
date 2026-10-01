from django.urls import path

from . import views

urlpatterns = [
    path("faculties/", views.FacultyListView.as_view()),
    path("programmes/", views.ProgrammeListView.as_view()),
    path("terms/", views.TermListView.as_view()),
]
