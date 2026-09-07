from django.db import models
from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
import django_filters
from apps.common.responses import api_response
from apps.products.models import Category, Brand, Product
from apps.products.serializers import (
    CategorySerializer,
    BrandSerializer,
    ProductListSerializer,
    ProductDetailSerializer,
    RelatedProductSerializer,
)

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.filter(is_active=True).prefetch_related('subcategories', 'products')
    serializer_class = CategorySerializer
    permission_classes = (permissions.AllowAny,)
    lookup_field = 'slug'
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    search_fields = ('name', 'description')
    ordering_fields = ('name', 'created_at')
    ordering = ('name',)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return api_response(data=serializer.data, message="Category retrieved successfully.")

class BrandViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Brand.objects.all().prefetch_related('products')
    serializer_class = BrandSerializer
    permission_classes = (permissions.AllowAny,)
    lookup_field = 'slug'
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    search_fields = ('name',)
    ordering_fields = ('name',)
    ordering = ('name',)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return api_response(data=serializer.data, message="Brand retrieved successfully.")

class ProductFilter(django_filters.FilterSet):
    min_price = django_filters.NumberFilter(method='filter_min_price', help_text="Minimum price in INR")
    max_price = django_filters.NumberFilter(method='filter_max_price', help_text="Maximum price in INR")
    category = django_filters.CharFilter(method='filter_category', help_text="Category slug or name")
    brand = django_filters.CharFilter(method='filter_brand', help_text="Brand slug or name")
    prescription_required = django_filters.BooleanFilter(field_name="prescription_required")
    requires_prescription = django_filters.BooleanFilter(field_name="requires_prescription")
    min_rating = django_filters.NumberFilter(field_name="rating", lookup_expr='gte')
    rating = django_filters.NumberFilter(field_name="rating", lookup_expr='gte')
    featured = django_filters.BooleanFilter(field_name="featured")
    trending = django_filters.BooleanFilter(field_name="trending")
    bestseller = django_filters.BooleanFilter(field_name="bestseller")
    in_stock = django_filters.BooleanFilter(method='filter_in_stock', help_text="Filter in-stock items (true/false)")
    dosage_form = django_filters.CharFilter(field_name="dosage_form", lookup_expr='iexact')

    class Meta:
        model = Product
        fields = [
            'category', 'brand', 'prescription_required', 'requires_prescription',
            'dosage_form', 'min_price', 'max_price', 'min_rating', 'rating',
            'featured', 'trending', 'bestseller', 'in_stock'
        ]

    def filter_min_price(self, queryset, name, value):
        return queryset.filter(models.Q(price_inr__gte=value) | models.Q(price__gte=value))

    def filter_max_price(self, queryset, name, value):
        return queryset.filter(models.Q(price_inr__lte=value) | models.Q(price__lte=value))

    def filter_category(self, queryset, name, value):
        return queryset.filter(
            models.Q(category__slug__iexact=value) | models.Q(category__name__icontains=value)
        )

    def filter_brand(self, queryset, name, value):
        return queryset.filter(
            models.Q(brand__slug__iexact=value) | models.Q(brand__name__icontains=value)
        )

    def filter_in_stock(self, queryset, name, value):
        if value is True:
            return queryset.filter(stock_quantity__gt=0)
        elif value is False:
            return queryset.filter(stock_quantity=0)
        return queryset

class CustomOrderingFilter(filters.OrderingFilter):
    ordering_param = 'ordering'

    def get_ordering(self, request, queryset, view):
        sort_param = request.query_params.get('sort')
        if sort_param:
            sort_map = {
                'price_asc': ['price_inr', 'price'],
                'price': ['price_inr', 'price'],
                '+price': ['price_inr', 'price'],
                'price_desc': ['-price_inr', '-price'],
                '-price': ['-price_inr', '-price'],
                '-price_inr': ['-price_inr', '-price'],
                'popularity': ['-review_count', '-rating'],
                'popular': ['-review_count', '-rating'],
                '-popularity': ['-review_count', '-rating'],
                '-review_count': ['-review_count', '-rating'],
                'rating': ['-rating', '-review_count'],
                '-rating': ['-rating', '-review_count'],
                'newest': ['-created_at'],
                '-newest': ['-created_at'],
                '-created_at': ['-created_at'],
                'oldest': ['created_at'],
                'created_at': ['created_at'],
            }
            if sort_param in sort_map:
                return sort_map[sort_param]
        return super().get_ordering(request, queryset, view)

class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Product.objects.filter(is_active=True).select_related('category', 'brand').prefetch_related('images')
    permission_classes = (permissions.AllowAny,)
    lookup_field = 'slug'
    filter_backends = (DjangoFilterBackend, filters.SearchFilter, CustomOrderingFilter)
    filterset_class = ProductFilter
    search_fields = (
        'name', 'generic_name', 'composition', 'ingredients',
        'manufacturer', 'brand__name', 'category__name', 'tags', 'short_description'
    )
    ordering_fields = (
        'price', 'price_inr', 'created_at', 'discount_percent',
        'rating', 'review_count', 'name'
    )
    ordering = ('-created_at',)

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProductDetailSerializer
        return ProductListSerializer

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return api_response(data=serializer.data, message="Product retrieved successfully.")

    @action(detail=True, methods=['get'])
    def related(self, request, slug=None):
        """Dedicated endpoint for related product recommendations."""
        product = self.get_object()
        related_products = Product.objects.filter(
            is_active=True,
            category=product.category
        ).exclude(id=product.id).order_by('-rating', '-review_count')[:8]

        serializer = RelatedProductSerializer(related_products, many=True, context={'request': request})
        return api_response(
            data=serializer.data,
            message="Related products retrieved successfully."
        )
