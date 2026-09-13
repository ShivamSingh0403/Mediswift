import os
import io
import json
import csv
import hashlib
import zipfile
from pathlib import Path
from django.db import models
from django.utils import timezone
from django.conf import settings
from django.core.files.base import ContentFile
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
import django_filters
from apps.common.responses import api_response
from apps.products.models import Category, Brand, Product, ProductImage, ProductImageCandidate
from apps.products.serializers import (
    CategorySerializer,
    BrandSerializer,
    ProductListSerializer,
    ProductDetailSerializer,
    RelatedProductSerializer,
    ProductImageSerializer,
    ProductImageCandidateSerializer,
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

    @action(detail=False, methods=['get'], url_path='image-stats')
    def image_stats(self, request):
        """Returns comprehensive image metrics matching validate_product_images."""
        total = Product.objects.count()
        verified = Product.objects.filter(image_status='VERIFIED').count()
        missing = Product.objects.filter(image_status='MISSING').count()
        pending_review = Product.objects.filter(image_status='PENDING_REVIEW').count()
        rejected = Product.objects.filter(image_status='REJECTED').count()
        broken = Product.objects.filter(image_status='BROKEN').count()
        duplicate = Product.objects.filter(image_status='DUPLICATE').count()

        # Check products without primary images
        products_with_url = set(Product.objects.exclude(image_url='').values_list('id', flat=True))
        products_with_primary_img = set(ProductImage.objects.filter(is_primary=True).values_list('product_id', flat=True))
        products_having_primary = products_with_url.union(products_with_primary_img)
        without_primary = total - len(products_having_primary)

        # Scan packshot directory
        packshot_dir = Path(settings.MEDIA_ROOT) / 'products' / 'packshots'
        unmatched_count = 0
        invalid_count = 0
        valid_exts = {'.jpg', '.jpeg', '.png', '.webp', '.avif', '.svg'}
        all_skus = set(Product.objects.values_list('sku', flat=True))
        sku_lookup = {sku.strip().upper(): sku for sku in all_skus if sku}

        if packshot_dir.exists():
            for item in packshot_dir.iterdir():
                if item.is_file():
                    if item.suffix.lower() not in valid_exts:
                        invalid_count += 1
                        continue
                    if item.stem.strip().upper() not in sku_lookup:
                        unmatched_count += 1

        return api_response(data={
            "total_products": total,
            "verified_images": verified,
            "missing_images": missing,
            "pending_review_images": pending_review,
            "rejected_images": rejected,
            "broken_images": broken,
            "duplicate_images": duplicate,
            "unmatched_image_filenames": unmatched_count,
            "invalid_files": invalid_count,
            "products_without_primary_images": without_primary,
        }, message="Image metrics retrieved successfully.")

    @action(detail=False, methods=['get'], url_path='admin-images')
    def admin_images(self, request):
        """Admin endpoint for searching products and viewing verification statuses."""
        qs = Product.objects.all().select_related('category', 'brand').prefetch_related('images')
        search = request.query_params.get('search', '').strip()
        sku_filter = request.query_params.get('sku', '').strip()
        status_filter = request.query_params.get('status', '').strip().upper()

        if search:
            qs = qs.filter(
                models.Q(name__icontains=search) |
                models.Q(sku__icontains=search) |
                models.Q(generic_name__icontains=search)
            )

        if sku_filter:
            qs = qs.filter(sku__iexact=sku_filter)

        if status_filter and status_filter != 'ALL':
            qs = qs.filter(image_status=status_filter)

        qs = qs.order_by('sku')
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        start = (page - 1) * page_size
        end = start + page_size

        total_count = qs.count()
        products = qs[start:end]

        results = []
        for p in products:
            primary_img = p.images.filter(is_primary=True).first() or p.images.first()
            p_img_url = p.image_url or (primary_img.image_url if primary_img else '')
            if not p_img_url and primary_img and primary_img.image:
                p_img_url = request.build_absolute_uri(primary_img.image.url)

            results.append({
                "id": str(p.id),
                "name": p.name,
                "sku": p.sku,
                "slug": p.slug,
                "category_name": p.category.name if p.category else 'General',
                "brand_name": p.brand.name if p.brand else '',
                "dosage_form": p.dosage_form,
                "strength": p.strength,
                "pack_size": p.pack_size,
                "image_url": p_img_url,
                "image_status": p.image_status,
                "image_source": p.image_source,
                "source_url": p.source_url,
                "image_license": p.image_license,
                "image_alt_text": p.image_alt_text,
                "verified_by": p.verified_by,
                "verified_at": p.verified_at.isoformat() if p.verified_at else None,
                "images_count": p.images.count(),
                "images": [
                    {
                        "id": str(img.id),
                        "url": img.image_url or (request.build_absolute_uri(img.image.url) if img.image else ''),
                        "is_primary": img.is_primary,
                        "status": img.status,
                        "source": img.source,
                        "source_url": img.source_url,
                        "license": img.license,
                        "verified_by": img.verified_by,
                    }
                    for img in p.images.all()
                ]
            })

        return api_response(data={
            "results": results,
            "total": total_count,
            "page": page,
            "page_size": page_size,
            "total_pages": (total_count + page_size - 1) // page_size if page_size else 1
        }, message="Admin products retrieved.")

    @action(detail=False, methods=['post'], url_path='update-image')
    def update_image(self, request):
        """Update image and verification metadata by product SKU or ID."""
        sku = request.data.get('sku')
        product_id = request.data.get('id')

        product = None
        if sku:
            product = Product.objects.filter(sku__iexact=sku.strip()).first()
        elif product_id:
            product = Product.objects.filter(id=product_id).first()

        if not product:
            return api_response(success=False, message="Product not found by SKU or ID.", status_code=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('image_status', '').strip().upper()
        valid_statuses = {'MISSING', 'PENDING_REVIEW', 'VERIFIED', 'REJECTED', 'BROKEN', 'DUPLICATE'}
        if new_status and new_status in valid_statuses:
            product.image_status = new_status

        if 'image_source' in request.data:
            product.image_source = request.data['image_source'].strip()
        if 'source_url' in request.data:
            product.source_url = request.data['source_url'].strip()
        if 'image_license' in request.data:
            product.image_license = request.data['image_license'].strip()
        if 'image_alt_text' in request.data:
            product.image_alt_text = request.data['image_alt_text'].strip()

        verified_by = request.data.get('verified_by')
        if verified_by is not None:
            product.verified_by = verified_by.strip()
            if product.image_status == 'VERIFIED' and not product.verified_at:
                product.verified_at = timezone.now()

        if product.image_status == 'VERIFIED' and not product.verified_at:
            product.verified_at = timezone.now()
        elif product.image_status != 'VERIFIED' and not verified_by:
            product.verified_at = None

        # Handle uploaded file
        uploaded_file = request.FILES.get('image_file')
        if uploaded_file:
            # Strictly save to packshots media directory
            ext = os.path.splitext(uploaded_file.name)[1].lower()
            clean_filename = f"{product.sku}{ext}"
            packshot_rel_path = f"products/packshots/{clean_filename}"

            pimg = product.images.filter(is_primary=True).first()
            if not pimg:
                pimg = ProductImage(product=product, is_primary=True)

            pimg.image.save(clean_filename, uploaded_file, save=False)
            pimg.status = product.image_status
            pimg.source = product.image_source
            pimg.source_url = product.source_url
            pimg.license = product.image_license
            pimg.verified_by = product.verified_by
            pimg.verified_at = product.verified_at
            pimg.save()

            product.image_url = pimg.image.url

        elif 'image_url' in request.data:
            url_val = request.data['image_url'].strip()
            product.image_url = url_val
            if url_val:
                pimg = product.images.filter(is_primary=True).first()
                if not pimg:
                    pimg = ProductImage(product=product, is_primary=True)
                pimg.image_url = url_val
                pimg.status = product.image_status
                pimg.source = product.image_source
                pimg.source_url = product.source_url
                pimg.license = product.image_license
                pimg.verified_by = product.verified_by
                pimg.verified_at = product.verified_at
                pimg.save()

        # Handle remove image
        if request.data.get('remove_image') in [True, 'true', '1']:
            product.image_url = ''
            product.image_status = 'MISSING'
            product.images.all().delete()

        product.save()
        return api_response(data={
            "id": str(product.id),
            "sku": product.sku,
            "image_status": product.image_status,
            "image_url": product.image_url,
            "verified_by": product.verified_by,
            "verified_at": product.verified_at.isoformat() if product.verified_at else None,
        }, message=f"Product {product.sku} image configuration updated successfully.")

    @action(detail=False, methods=['post'], url_path='batch-import-images')
    def batch_import_images(self, request):
        """
        Batch import packaging photos from ZIP archive with optional manifest (CSV/Excel/JSON).
        Strict matching rule: image filename stem MUST match product SKU exactly (e.g. MS-0001.jpg -> MS-0001).
        Never match by approximate product name.
        """
        zip_file = request.FILES.get('zip_file')
        manifest_file = request.FILES.get('manifest_file')
        default_status = request.data.get('default_status', 'PENDING_REVIEW').strip().upper()
        default_source = request.data.get('default_source', 'Authorized Distributor Batch Import').strip()
        default_license = request.data.get('default_license', 'Authorized Pharmaceutical Asset').strip()
        verified_by = request.data.get('verified_by', '').strip()

        if default_status not in {'MISSING', 'PENDING_REVIEW', 'VERIFIED', 'REJECTED', 'BROKEN', 'DUPLICATE'}:
            default_status = 'PENDING_REVIEW'

        # 1. Parse manifest if provided (CSV, JSON, XLSX)
        manifest_data = {}
        if manifest_file:
            m_name = manifest_file.name.lower()
            try:
                if m_name.endswith('.csv'):
                    content = manifest_file.read().decode('utf-8-sig', errors='replace')
                    reader = csv.DictReader(io.StringIO(content))
                    for row in reader:
                        # Find SKU key
                        sku = row.get('sku') or row.get('SKU') or row.get('product_sku')
                        if sku:
                            manifest_data[sku.strip().upper()] = row
                elif m_name.endswith('.json'):
                    content = json.loads(manifest_file.read().decode('utf-8', errors='replace'))
                    if isinstance(content, list):
                        for row in content:
                            sku = row.get('sku') or row.get('SKU')
                            if sku:
                                manifest_data[sku.strip().upper()] = row
                    elif isinstance(content, dict):
                        for k, v in content.items():
                            manifest_data[k.strip().upper()] = v
                elif m_name.endswith(('.xlsx', '.xls')):
                    import openpyxl
                    wb = openpyxl.load_workbook(manifest_file, data_only=True)
                    sheet = wb.active
                    headers = [str(cell.value or '').strip().lower() for cell in sheet[1]]
                    for r in sheet.iter_rows(min_row=2, values_only=True):
                        row_dict = {headers[i]: r[i] for i in range(min(len(headers), len(r)))}
                        sku = row_dict.get('sku')
                        if sku:
                            manifest_data[str(sku).strip().upper()] = row_dict
            except Exception as e:
                return api_response(success=False, message=f"Failed to parse manifest file: {str(e)}", status_code=status.HTTP_400_BAD_REQUEST)

        # 2. Process ZIP archive
        if not zip_file:
            return api_response(success=False, message="Please upload a ZIP file containing packaging photographs named by SKU.", status_code=status.HTTP_400_BAD_REQUEST)

        valid_exts = {'.jpg', '.jpeg', '.png', '.webp', '.avif', '.svg'}
        packshot_dir = Path(settings.MEDIA_ROOT) / 'products' / 'packshots'
        packshot_dir.mkdir(parents=True, exist_ok=True)

        all_products = {p.sku.strip().upper(): p for p in Product.objects.all()}

        matched = []
        unmatched = []
        invalid = []
        duplicates = []
        seen_hashes = {}

        try:
            with zipfile.ZipFile(zip_file, 'r') as zf:
                for file_info in zf.infolist():
                    if file_info.is_dir():
                        continue

                    # Ignore MacOS metadata files or hidden files
                    filename = os.path.basename(file_info.filename)
                    if not filename or filename.startswith('.') or filename.startswith('__MACOSX'):
                        continue

                    stem, ext = os.path.splitext(filename)
                    ext = ext.lower()

                    if ext not in valid_exts:
                        invalid.append(filename)
                        continue

                    # Strict SKU matching: MS-0001.jpg -> MS-0001
                    sku_key = stem.strip().upper()
                    if sku_key not in all_products:
                        unmatched.append(filename)
                        continue

                    file_bytes = zf.read(file_info.filename)
                    file_hash = hashlib.md5(file_bytes).hexdigest()

                    if file_hash in seen_hashes:
                        duplicates.append((filename, seen_hashes[file_hash]))
                    else:
                        seen_hashes[file_hash] = filename

                    # Exact product match found!
                    product = all_products[sku_key]

                    # Manifest metadata overrides if provided
                    m_row = manifest_data.get(sku_key, {})
                    status_to_set = m_row.get('status') or m_row.get('image_status') or default_status
                    if status_to_set not in {'MISSING', 'PENDING_REVIEW', 'VERIFIED', 'REJECTED', 'BROKEN', 'DUPLICATE'}:
                        status_to_set = default_status

                    source_name = m_row.get('source') or m_row.get('image_source') or default_source
                    source_url = m_row.get('source_url') or ''
                    license_note = m_row.get('license') or m_row.get('image_license') or default_license
                    verifier = m_row.get('verified_by') or verified_by

                    clean_name = f"{product.sku}{ext}"
                    # Every newly imported image must be PENDING_REVIEW unless admin explicitly requested VERIFIED
                    if status_to_set == 'VERIFIED':
                        target_dir = Path(settings.MEDIA_ROOT) / 'product_images' / 'verified'
                        target_rel = f"product_images/verified/{clean_name}"
                    else:
                        target_dir = Path(settings.MEDIA_ROOT) / 'product_images' / 'pending_review'
                        target_rel = f"product_images/pending_review/{clean_name}"

                    target_dir.mkdir(parents=True, exist_ok=True)
                    dest_file_path = target_dir / clean_name
                    with open(dest_file_path, 'wb') as f:
                        f.write(file_bytes)

                    # Update or create ProductImage
                    pimg = product.images.filter(is_primary=True).first()
                    if not pimg:
                        pimg = ProductImage(product=product, sku=product.sku, is_primary=True)

                    pimg.sku = product.sku
                    pimg.image_file.name = target_rel
                    pimg.image.name = target_rel
                    pimg.image_url = f"/media/{target_rel}"
                    pimg.image_status = status_to_set
                    pimg.status = status_to_set
                    pimg.source_name = source_name
                    pimg.source = source_name
                    pimg.source_url = source_url
                    pimg.license_note = license_note
                    pimg.license = license_note
                    pimg.verified_by = verifier
                    pimg.image_hash = file_hash
                    pimg.alt_text = f"Packaging photograph for {product.name} ({product.sku})"
                    if status_to_set == 'VERIFIED':
                        pimg.verified_at = timezone.now()
                    pimg.save()

                    # Update Product record
                    product.image_url = pimg.image_url
                    product.image_status = status_to_set
                    product.image_source = source_name
                    product.source_url = source_url
                    product.image_license = license_note
                    product.verified_by = verifier
                    if status_to_set == 'VERIFIED':
                        product.verified_at = timezone.now()
                    product.save()

                    matched.append({
                        "sku": product.sku,
                        "name": product.name,
                        "filename": filename,
                        "status": status_to_set,
                        "image_url": product.image_url
                    })

        except zipfile.BadZipFile:
            return api_response(success=False, message="The uploaded file is not a valid ZIP archive.", status_code=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return api_response(success=False, message=f"Error extracting ZIP archive: {str(e)}", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return api_response(data={
            "matched_count": len(matched),
            "unmatched_count": len(unmatched),
            "invalid_count": len(invalid),
            "duplicates_count": len(duplicates),
            "matched": matched[:50],  # Sample of matched items
            "unmatched": unmatched,
            "invalid": invalid,
            "duplicates": [f"'{dup}' duplicates '{orig}'" for dup, orig in duplicates]
        }, message=f"Batch import finished: {len(matched)} product images successfully linked by SKU.")

    @action(detail=False, methods=['post'], url_path='approve-image')
    def approve_image(self, request):
        """Approve product image: moves file to verified/, sets status VERIFIED."""
        sku = request.data.get('sku')
        product_id = request.data.get('id')
        verifier = request.data.get('verified_by', 'Administrator').strip() or 'Administrator'

        product = None
        if sku:
            product = Product.objects.filter(sku__iexact=sku.strip()).first()
        elif product_id:
            product = Product.objects.filter(id=product_id).first()

        if not product:
            return api_response(success=False, message="Product not found.", status_code=status.HTTP_404_NOT_FOUND)

        pimg = product.images.filter(is_primary=True).first() or product.images.first()
        if not pimg:
            return api_response(success=False, message="No image asset to verify for this product.", status_code=status.HTTP_400_BAD_REQUEST)

        pimg.mark_verified(verified_by=verifier)

        return api_response(data={
            "sku": product.sku,
            "status": "VERIFIED",
            "image_url": product.image_url,
            "verified_by": verifier,
        }, message=f"Product {product.sku} image officially verified and moved to verified/ directory.")

    @action(detail=False, methods=['post'], url_path='reject-image')
    def reject_image(self, request):
        """Reject product image: moves file to rejected/, sets status REJECTED."""
        sku = request.data.get('sku')
        product_id = request.data.get('id')
        rejector = request.data.get('rejected_by', 'Administrator').strip() or 'Administrator'
        reason = request.data.get('reason', '').strip()

        product = None
        if sku:
            product = Product.objects.filter(sku__iexact=sku.strip()).first()
        elif product_id:
            product = Product.objects.filter(id=product_id).first()

        if not product:
            return api_response(success=False, message="Product not found.", status_code=status.HTTP_404_NOT_FOUND)

        pimg = product.images.filter(is_primary=True).first() or product.images.first()
        if not pimg:
            return api_response(success=False, message="No image asset found for this product.", status_code=status.HTTP_400_BAD_REQUEST)

        pimg.mark_rejected(rejected_by=rejector, reason=reason)

        return api_response(data={
            "sku": product.sku,
            "status": "REJECTED",
        }, message=f"Product {product.sku} image rejected and moved to rejected/ directory.")

    @action(detail=False, methods=['post'], url_path='export-zip')
    def export_zip(self, request):
        """Triggers export_product_images_zip command and returns download metadata."""
        from django.core.management import call_command
        try:
            call_command('export_product_images_zip')
            exports_dir = settings.BASE_DIR.parent / 'exports'
            zip_path = exports_dir / 'mediswift_product_images.zip'
            report_path = exports_dir / 'mediswift_product_images_report.json'

            report_data = {}
            if report_path.exists():
                with open(report_path, 'r', encoding='utf-8') as f:
                    report_data = json.load(f)

            return api_response(data={
                "zip_file": str(zip_path),
                "zip_size_bytes": os.path.getsize(zip_path) if zip_path.exists() else 0,
                "report": report_data
            }, message="ZIP archive and audit reports successfully generated.")
        except Exception as e:
            return api_response(success=False, message=f"Failed to generate ZIP: {str(e)}", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], url_path='audit-broken-images')
    def audit_broken_images(self, request):
        """Scans database and filesystem for broken or duplicate images."""
        broken = []
        for p in Product.objects.exclude(image_url=''):
            url = p.image_url.strip()
            if url.startswith('/media/'):
                rel_path = url[len('/media/'):]
                full_path = Path(settings.MEDIA_ROOT) / rel_path
                if not full_path.exists():
                    p.image_status = 'BROKEN'
                    p.save(update_fields=['image_status'])
                    broken.append({"sku": p.sku, "name": p.name, "url": url, "reason": "Local media file missing"})
            elif url.startswith('media/'):
                rel_path = url[len('media/'):]
                full_path = Path(settings.MEDIA_ROOT) / rel_path
                if not full_path.exists():
                    p.image_status = 'BROKEN'
                    p.save(update_fields=['image_status'])
                    broken.append({"sku": p.sku, "name": p.name, "url": url, "reason": "Local media file missing"})

        return api_response(data={
            "broken_detected": len(broken),
            "items": broken
        }, message="Audit completed.")


class ProductImageCandidateFilter(django_filters.FilterSet):
    status = django_filters.CharFilter(field_name='status', lookup_expr='iexact')
    sku = django_filters.CharFilter(field_name='sku', lookup_expr='icontains')
    source_domain = django_filters.CharFilter(field_name='source_domain', lookup_expr='icontains')
    min_confidence = django_filters.NumberFilter(field_name='matching_confidence', lookup_expr='gte')

    class Meta:
        model = ProductImageCandidate
        fields = ['status', 'sku', 'source_domain', 'min_confidence']


class ProductImageCandidateViewSet(viewsets.ModelViewSet):
    queryset = ProductImageCandidate.objects.all().select_related('product', 'product__brand')
    serializer_class = ProductImageCandidateSerializer
    permission_classes = (permissions.AllowAny,)
    filter_backends = (filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend)
    filterset_class = ProductImageCandidateFilter
    search_fields = ('sku', 'product_name', 'brand', 'source_domain', 'image_title', 'detected_alt_text')
    ordering_fields = ('matching_confidence', 'discovered_at', 'status', 'created_at')
    ordering = ('-matching_confidence', '-discovered_at')

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        """Returns candidate metrics breakdown across all statuses."""
        cands = ProductImageCandidate.objects.all()
        return api_response(data={
            "total": cands.count(),
            "discovered": cands.filter(status=ProductImageCandidate.CandidateStatus.DISCOVERED).count(),
            "pending_review": cands.filter(status=ProductImageCandidate.CandidateStatus.PENDING_REVIEW).count(),
            "approved_for_download": cands.filter(status=ProductImageCandidate.CandidateStatus.APPROVED_FOR_DOWNLOAD).count(),
            "downloaded": cands.filter(status=ProductImageCandidate.CandidateStatus.DOWNLOADED).count(),
            "verified": cands.filter(status=ProductImageCandidate.CandidateStatus.VERIFIED).count(),
            "rejected": cands.filter(status=ProductImageCandidate.CandidateStatus.REJECTED).count(),
            "rights_unknown": cands.filter(status=ProductImageCandidate.CandidateStatus.RIGHTS_UNKNOWN).count(),
            "product_mismatch": cands.filter(status=ProductImageCandidate.CandidateStatus.PRODUCT_MISMATCH).count(),
            "blocked_source": cands.filter(status=ProductImageCandidate.CandidateStatus.BLOCKED_SOURCE).count(),
        }, message="Candidate statistics retrieved.")

    @action(detail=True, methods=['post'], url_path='action')
    def take_action(self, request, pk=None):
        """
        Executes an administrative workflow action on a candidate:
        - approve_for_download
        - reject
        - mark_verified
        - mark_rights_unknown
        - mark_mismatch
        """
        candidate = self.get_object()
        action_type = request.data.get('action')
        reason = request.data.get('reason', '').strip()
        verifier = request.data.get('verified_by', 'Administrator').strip() or 'Administrator'

        if action_type == 'approve_for_download':
            candidate.status = ProductImageCandidate.CandidateStatus.APPROVED_FOR_DOWNLOAD
            candidate.review_reason = reason or "Approved for download by administrator."
            candidate.save()
            return api_response(data=self.get_serializer(candidate).data, message="Candidate approved for automated download.")

        elif action_type == 'reject':
            candidate.status = ProductImageCandidate.CandidateStatus.REJECTED
            candidate.review_reason = reason or "Candidate rejected during review."
            candidate.save()
            if candidate.downloaded_image:
                candidate.downloaded_image.mark_rejected(rejected_by=verifier, reason=reason)
            return api_response(data=self.get_serializer(candidate).data, message="Candidate rejected.")

        elif action_type == 'mark_verified':
            # If not yet downloaded, trigger download first
            if not candidate.downloaded_image:
                from django.core.management import call_command
                candidate.status = ProductImageCandidate.CandidateStatus.APPROVED_FOR_DOWNLOAD
                candidate.save()
                call_command('download_approved_product_images', sku=candidate.sku)
                candidate.refresh_from_db()

            if candidate.downloaded_image:
                candidate.downloaded_image.mark_verified(verified_by=verifier)
            else:
                candidate.product.image_url = candidate.candidate_image_url
                candidate.product.image_status = Product.ImageStatus.VERIFIED
                candidate.product.verified_by = verifier
                candidate.product.verified_at = timezone.now()
                candidate.product.save(update_fields=['image_url', 'image_status', 'verified_by', 'verified_at'])

            candidate.status = ProductImageCandidate.CandidateStatus.VERIFIED
            candidate.review_reason = f"Verified by {verifier} at {timezone.now().strftime('%Y-%m-%d %H:%M')}"
            candidate.save()
            return api_response(data=self.get_serializer(candidate).data, message=f"Candidate verified and product image activated.")

        elif action_type == 'mark_rights_unknown':
            candidate.status = ProductImageCandidate.CandidateStatus.RIGHTS_UNKNOWN
            candidate.rights_note = "Usage permission has not been confirmed."
            candidate.review_reason = reason or "Usage permission unconfirmed or requires licensing clearance."
            candidate.save()
            return api_response(data=self.get_serializer(candidate).data, message="Candidate flagged with Rights Unknown warning.")

        elif action_type == 'mark_mismatch':
            candidate.status = ProductImageCandidate.CandidateStatus.PRODUCT_MISMATCH
            candidate.review_reason = reason or "Catalog attribute mismatch (strength, pack size, or form differs)."
            candidate.save()
            return api_response(data=self.get_serializer(candidate).data, message="Candidate flagged as Product Mismatch.")

        else:
            return api_response(success=False, message=f"Unknown action: '{action_type}'", status_code=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='run-discovery')
    def run_discovery(self, request):
        """Runs the discover_product_images management command."""
        from django.core.management import call_command
        sku = request.data.get('sku', '').strip()
        limit = int(request.data.get('limit', 15))
        source = request.data.get('source', 'all').strip()

        kwargs = {'limit': limit, 'source': source}
        if sku:
            kwargs['sku'] = sku

        try:
            call_command('discover_product_images', **kwargs)
            return self.stats(request)
        except Exception as e:
            return api_response(success=False, message=f"Discovery failed: {str(e)}", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], url_path='run-download-approved')
    def run_download_approved(self, request):
        """Runs the download_approved_product_images management command."""
        from django.core.management import call_command
        sku = request.data.get('sku', '').strip()
        auto_approve = request.data.get('auto_approve', False)

        kwargs = {}
        if sku:
            kwargs['sku'] = sku
        if auto_approve:
            kwargs['auto_approve_high_confidence'] = True

        try:
            call_command('download_approved_product_images', **kwargs)
            return self.stats(request)
        except Exception as e:
            return api_response(success=False, message=f"Download failed: {str(e)}", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], url_path='export-data-package')
    def export_data_package(self, request):
        """Runs export_product_image_data and returns metadata & ZIP path."""
        from django.core.management import call_command
        try:
            call_command('export_product_image_data')
            zip_path = Path(settings.BASE_DIR).parent / 'exports' / 'mediswift_product_image_data.zip'
            size_kb = zip_path.stat().st_size / 1024 if zip_path.exists() else 0

            return api_response(data={
                "zip_path": str(zip_path),
                "zip_filename": "mediswift_product_image_data.zip",
                "size_kb": round(size_kb, 1),
                "generated_at": timezone.now().isoformat(),
            }, message="Full product image audit data package generated successfully.")
        except Exception as e:
            return api_response(success=False, message=f"Export failed: {str(e)}", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


