from django.urls import path

from . import views

urlpatterns = [
    path("", views.ApiIndexView.as_view()),
    path("health/", views.HealthView.as_view()),
    path("fee/", views.FeeView.as_view()),
    path("admin/settings/", views.SettingsListView.as_view()),
    path("admin/settings/<str:key>/", views.SettingDetailView.as_view()),
    path("admin/audit-logs/", views.AuditLogListView.as_view()),
]
