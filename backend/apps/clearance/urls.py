from django.urls import path

from . import views

urlpatterns = [
    path("requirements/", views.RequirementListView.as_view()),
    path("applications/", views.MyApplicationsView.as_view()),
    path("applications/<int:pk>/", views.MyApplicationDetailView.as_view()),
    path("applications/<int:pk>/submit/", views.SubmitView.as_view()),
    path("applications/<int:pk>/documents/", views.DocumentUploadView.as_view()),
    path("applications/<int:pk>/documents/<int:doc_id>/", views.DocumentDeleteView.as_view()),
    path("documents/<int:pk>/download/", views.DocumentDownloadView.as_view()),
    path("admin/stats/", views.AdminStatsView.as_view()),
    path("admin/applications/", views.AdminApplicationListView.as_view()),
    path("admin/applications/<int:pk>/", views.AdminApplicationDetailView.as_view()),
    path("admin/applications/<int:pk>/approve/", views.ApproveView.as_view()),
    path("admin/applications/<int:pk>/reject/", views.RejectView.as_view()),
    path("admin/applications/<int:pk>/request-correction/", views.CorrectionView.as_view()),
]
