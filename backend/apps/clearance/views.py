from django.db.models import Count, Q
from django.http import FileResponse, Http404
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.audit import record
from apps.core.permissions import IsStaff, IsStudent

from . import services
from .models import ClearanceApplication, ClearanceApplicationItem, Document
from .serializers import (
    ApplicationCreateSerializer,
    ApplicationSerializer,
    ApplicationUpdateSerializer,
    DecisionSerializer,
    DocumentSerializer,
    DocumentUploadSerializer,
    RequirementSerializer,
)


def _app_queryset():
    return ClearanceApplication.objects.select_related(
        "student__user", "student__programme__faculty", "term", "reviewed_by"
    ).prefetch_related("items__requirement", "items__documents", "payments")


class RequirementListView(ListAPIView):
    permission_classes = [IsStudent]
    serializer_class = RequirementSerializer
    pagination_class = None

    def get_queryset(self):
        return services.applicable_requirements(self.request.user.student)


class MyApplicationsView(APIView):
    permission_classes = [IsStudent]

    def get(self, request):
        qs = _app_queryset().filter(student=request.user.student)
        return Response(ApplicationSerializer(qs, many=True).data)

    def post(self, request):
        data = ApplicationCreateSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        app = services.create_application(
            request.user.student,
            data.validated_data.get("requirements"),
            data.validated_data.get("student_notes", ""),
            request,
        )
        return Response(ApplicationSerializer(_app_queryset().get(pk=app.pk)).data, status=201)


class _OwnedAppMixin:
    permission_classes = [IsStudent]

    def get_app(self, request, pk):
        try:
            return _app_queryset().get(pk=pk, student=request.user.student)
        except ClearanceApplication.DoesNotExist:
            raise Http404 from None

    def respond(self, app, status=200):
        return Response(ApplicationSerializer(_app_queryset().get(pk=app.pk)).data, status=status)


class MyApplicationDetailView(_OwnedAppMixin, APIView):
    def get(self, request, pk):
        return self.respond(self.get_app(request, pk))

    def patch(self, request, pk):
        app = self.get_app(request, pk)
        data = ApplicationUpdateSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        services.update_application(
            app, data.validated_data.get("requirements"), data.validated_data.get("student_notes"), request
        )
        return self.respond(app)


class SubmitView(_OwnedAppMixin, APIView):
    def post(self, request, pk):
        app = services.submit_application(self.get_app(request, pk), request)
        return self.respond(app)


class DocumentUploadView(_OwnedAppMixin, APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        app = self.get_app(request, pk)
        if not app.is_editable:
            return Response({"detail": "This application can no longer be edited."}, status=400)
        data = DocumentUploadSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        try:
            item = app.items.get(requirement_id=data.validated_data["requirement"])
        except ClearanceApplicationItem.DoesNotExist:
            return Response({"detail": "That category is not part of this application."}, status=400)
        f = data.validated_data["file"]
        doc = Document.objects.create(
            application=app,
            item=item,
            file=f,
            original_name=f.name[:255],
            content_type=getattr(f, "content_type", "") or "",
            size=f.size,
            uploaded_by=request.user,
        )
        record(request, request.user, "document.uploaded", doc, application=app.reference)
        return Response(DocumentSerializer(doc).data, status=201)


class DocumentDeleteView(_OwnedAppMixin, APIView):
    def delete(self, request, pk, doc_id):
        app = self.get_app(request, pk)
        if not app.is_editable:
            return Response({"detail": "This application can no longer be edited."}, status=400)
        doc = app.documents.filter(pk=doc_id).first()
        if doc is None:
            raise Http404
        doc.file.delete(save=False)
        doc.delete()
        return Response(status=204)


class DocumentDownloadView(APIView):
    """Authenticated download: owner student or staff only."""

    def get(self, request, pk):
        doc = Document.objects.select_related("application__student").filter(pk=pk).first()
        if doc is None:
            raise Http404
        user = request.user
        if not (user.is_admin_role or doc.application.student.user_id == user.id):
            raise Http404
        return FileResponse(doc.file.open("rb"), as_attachment=False, filename=doc.original_name)


# ---- Admin ---------------------------------------------------------------


class AdminApplicationListView(ListAPIView):
    permission_classes = [IsStaff]
    serializer_class = ApplicationSerializer

    def get_queryset(self):
        qs = _app_queryset().exclude(status="draft")
        p = self.request.query_params
        if p.get("status"):
            qs = qs.filter(status=p["status"])
        if p.get("faculty"):
            qs = qs.filter(student__programme__faculty_id=p["faculty"])
        if p.get("payment_status"):
            if p["payment_status"] == "unpaid":
                qs = qs.exclude(payments__status="paid")
            else:
                qs = qs.filter(payments__status=p["payment_status"])
        if p.get("search"):
            s = p["search"]
            qs = qs.filter(
                Q(reference__icontains=s)
                | Q(student__student_number__icontains=s)
                | Q(student__user__full_name__icontains=s)
                | Q(student__user__email__icontains=s)
            )
        return qs.distinct()


class AdminApplicationDetailView(RetrieveAPIView):
    permission_classes = [IsStaff]
    serializer_class = ApplicationSerializer

    def get_queryset(self):
        return _app_queryset().exclude(status="draft")


class _DecisionView(APIView):
    permission_classes = [IsStaff]
    decision = ""

    def post(self, request, pk):
        app = _app_queryset().exclude(status="draft").filter(pk=pk).first()
        if app is None:
            raise Http404
        data = DecisionSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        services.decide(app, request.user, self.decision, data.validated_data.get("reason", ""), request)
        return Response(ApplicationSerializer(_app_queryset().get(pk=pk)).data)


class ApproveView(_DecisionView):
    decision = "approve"


class RejectView(_DecisionView):
    decision = "reject"


class CorrectionView(_DecisionView):
    decision = "correction"


class AdminStatsView(APIView):
    permission_classes = [IsStaff]

    def get(self, request):
        counts = dict(
            ClearanceApplication.objects.exclude(status="draft")
            .values_list("status")
            .annotate(n=Count("id"))
        )
        return Response({"total": sum(counts.values()), "by_status": counts})
