from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
import django_filters
from apps.doctors.models import Specialty, DoctorProfile
from apps.doctors.serializers import SpecialtySerializer, DoctorListSerializer, DoctorDetailSerializer

class SpecialtyViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Specialty.objects.all()
    serializer_class = SpecialtySerializer
    permission_classes = (permissions.AllowAny,)
    lookup_field = 'slug'

class DoctorFilter(django_filters.FilterSet):
    specialty = django_filters.CharFilter(field_name="specialties__slug")
    telehealth_only = django_filters.BooleanFilter(field_name="is_available_for_telehealth")
    min_rating = django_filters.NumberFilter(field_name="rating", lookup_expr='gte')
    max_fee = django_filters.NumberFilter(field_name="consultation_fee", lookup_expr='lte')

    class Meta:
        model = DoctorProfile
        fields = ['specialty', 'telehealth_only', 'min_rating', 'max_fee']

class DoctorViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DoctorProfile.objects.filter(is_verified=True).select_related('user', 'user__profile').prefetch_related('specialties')
    permission_classes = (permissions.AllowAny,)
    filter_backends = (DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter)
    filterset_class = DoctorFilter
    search_fields = ('user__first_name', 'user__last_name', 'qualifications', 'hospital_affiliation', 'languages')
    ordering_fields = ('rating', 'experience_years', 'consultation_fee')
    ordering = ('-rating', '-experience_years')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return DoctorDetailSerializer
        return DoctorListSerializer
