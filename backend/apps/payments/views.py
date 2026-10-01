from django.http import Http404
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.clearance.models import ClearanceApplication
from apps.core.permissions import IsStudent

from . import services
from .models import Payment, PaymentMethod
from .serializers import PayRequestSerializer, PaymentSerializer


class MethodsView(APIView):
    permission_classes = [IsStudent]

    def get(self, request):
        return Response([{"id": v, "label": label} for v, label in PaymentMethod.choices])


class MyPaymentsView(APIView):
    permission_classes = [IsStudent]

    def get(self, request):
        qs = Payment.objects.filter(application__student=request.user.student).select_related("application")
        return Response(PaymentSerializer(qs, many=True).data)


class PayView(APIView):
    permission_classes = [IsStudent]

    def post(self, request, pk):
        app = ClearanceApplication.objects.filter(pk=pk, student=request.user.student).first()
        if app is None:
            raise Http404
        data = PayRequestSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        payment = services.pay_application(app, data.validated_data["method"], data.validated_data["phone"], request)
        return Response(PaymentSerializer(payment).data, status=201 if payment.status == "paid" else 402)
