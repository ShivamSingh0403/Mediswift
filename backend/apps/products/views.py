from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
import django_filters
from apps.common.responses import api_response
from apps.products.models import Category, Brand, Product
from apps.products.serializers import (
    CategorySerializer,
    BrandSerializer,
    ProductListSerializer,
    ProductDetailSerializer,
)

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.filter(is_active=True).prefetch_related('subcategories')
    serializer_class = CategorySerializer
    permission_classes = (permissions.AllowAny,)
    lookup_field = 'slug'

class BrandViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer
    permission_classes = (permissions.AllowAny,)
    lookup_field = 'slug'

class ProductFilter(django_filters.FilterSet):
    min_price = django_filters.NumberFilter(field_name="price", lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr='lte')
    category = django_filters.CharFilter(field_name="category__slug")
    brand = django_filters.CharFilter(field_name="brand__slug")
    prescription_required = django_filters.BooleanFilter(field_name="prescription_required")
    dosage_form = django_filters.CharFilter(field_name="dosage_form")

    class Meta:
        model = Product
        fields = ['category', 'brand', 'prescription_required', 'dosage_form', 'min_price', 'max_price']

class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Product.objects.filter(is_active=True).select_related('category', 'brand').prefetch_related('images')
    permission_classes = (permissions.AllowAny,)
    lookup_field = 'slug'
    filter_backends = (DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter)
    filterset_class = ProductFilter
    search_fields = ('name', 'generic_name', 'composition', 'manufacturer')
    ordering_fields = ('price', 'created_at', 'discount_percent', 'name')
    ordering = ('-created_at',)

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProductDetailSerializer
        return ProductListSerializer
