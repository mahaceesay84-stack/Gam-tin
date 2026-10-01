from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny

from .models import AcademicTerm, Faculty, Programme
from .serializers import AcademicTermSerializer, FacultySerializer, ProgrammeSerializer


class _PublicList(ListAPIView):
    permission_classes = [AllowAny]
    pagination_class = None


class FacultyListView(_PublicList):
    queryset = Faculty.objects.all()
    serializer_class = FacultySerializer


class ProgrammeListView(_PublicList):
    serializer_class = ProgrammeSerializer

    def get_queryset(self):
        qs = Programme.objects.filter(is_active=True).select_related("faculty")
        faculty = self.request.query_params.get("faculty")
        return qs.filter(faculty_id=faculty) if faculty else qs


class TermListView(_PublicList):
    queryset = AcademicTerm.objects.all()
    serializer_class = AcademicTermSerializer
