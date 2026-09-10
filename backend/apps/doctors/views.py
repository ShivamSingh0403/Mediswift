from django.db.models import Q
from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
import django_filters
from django.shortcuts import get_object_or_404
from apps.doctors.models import Specialty, DoctorProfile
from apps.doctors.serializers import SpecialtySerializer, DoctorListSerializer, DoctorDetailSerializer

class SpecialtyViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Specialty.objects.all()
    serializer_class = SpecialtySerializer
    permission_classes = (permissions.AllowAny,)
    lookup_field = 'slug'

class DoctorFilter(django_filters.FilterSet):
    specialty = django_filters.CharFilter(method='filter_specialty')
    telehealth_only = django_filters.BooleanFilter(field_name="is_available_for_telehealth")
    in_person_only = django_filters.BooleanFilter(field_name="is_available_for_in_person")
    min_rating = django_filters.NumberFilter(field_name="rating", lookup_expr='gte')
    min_fee = django_filters.NumberFilter(field_name="consultation_fee", lookup_expr='gte')
    max_fee = django_filters.NumberFilter(field_name="consultation_fee", lookup_expr='lte')
    min_experience = django_filters.NumberFilter(field_name="experience_years", lookup_expr='gte')
    max_experience = django_filters.NumberFilter(field_name="experience_years", lookup_expr='lte')
    language = django_filters.CharFilter(field_name="languages", lookup_expr='icontains')
    city = django_filters.CharFilter(field_name="city", lookup_expr='icontains')

    class Meta:
        model = DoctorProfile
        fields = [
            'specialty', 'telehealth_only', 'in_person_only',
            'min_rating', 'min_fee', 'max_fee',
            'min_experience', 'max_experience',
            'language', 'city'
        ]

    def filter_specialty(self, queryset, name, value):
        if not value:
            return queryset
        return queryset.filter(Q(specialties__slug__iexact=value) | Q(specialties__name__icontains=value)).distinct()

class DoctorViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DoctorProfile.objects.filter(is_verified=True).select_related('user', 'user__profile').prefetch_related('specialties')
    permission_classes = (permissions.AllowAny,)
    filter_backends = (DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter)
    filterset_class = DoctorFilter
    search_fields = (
        'user__first_name', 'user__last_name', 'qualifications',
        'hospital_affiliation', 'languages', 'city', 'bio',
        'specialties__name'
    )
    ordering_fields = ('rating', 'experience_years', 'consultation_fee')
    ordering = ('-rating', '-experience_years')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return DoctorDetailSerializer
        return DoctorListSerializer

    def get_object(self):
        import uuid
        queryset = self.filter_queryset(self.get_queryset())
        lookup_value = self.kwargs.get(self.lookup_field) or self.kwargs.get('pk')
        is_uuid = False
        try:
            uuid.UUID(str(lookup_value))
            is_uuid = True
        except (ValueError, TypeError, AttributeError):
            is_uuid = False

        if is_uuid:
            return get_object_or_404(queryset, pk=lookup_value)
        return get_object_or_404(queryset, slug=lookup_value)
