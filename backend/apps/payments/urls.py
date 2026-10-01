from django.urls import path

from . import views

urlpatterns = [
    path("", views.MyPaymentsView.as_view()),
    path("methods/", views.MethodsView.as_view()),
    path("applications/<int:pk>/pay/", views.PayView.as_view()),
]
