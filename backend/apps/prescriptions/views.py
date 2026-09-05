from django.utils import timezone
from django.http import FileResponse, Http404
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from apps.common.responses import api_response
from apps.common.permissions import IsPharmacist
from apps.prescriptions.models import Prescription
from apps.products.models import Product
from apps.prescriptions.serializers import (
    PrescriptionSerializer,
    PrescriptionUploadSerializer,
    PrescriptionVerifySerializer,
)

class PrescriptionViewSet(viewsets.ModelViewSet):
    serializer_class = PrescriptionSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        if user.role in ('PHARMACIST', 'ADMIN'):
            return Prescription.objects.all().select_related('patient', 'verified_by').prefetch_related('approved_products')
        return Prescription.objects.filter(patient=user).prefetch_related('approved_products')

    def create(self, request, *args, **kwargs):
        serializer = PrescriptionUploadSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        prescription = serializer.save()
        out_serializer = PrescriptionSerializer(prescription, context={'request': request})
        return api_response(
            data=out_serializer.data,
            message="Prescription uploaded successfully and queued for pharmacist review.",
            status_code=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'], permission_classes=[IsPharmacist])
    def verify(self, request, pk=None):
        prescription = self.get_object()
        serializer = PrescriptionVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        prescription.status = serializer.validated_data.get('status', Prescription.Status.VERIFIED)
        prescription.pharmacist_notes = serializer.validated_data.get('pharmacist_notes', '')
        prescription.verified_by = request.user
        prescription.verified_at = timezone.now()

        product_ids = serializer.validated_data.get('approved_product_ids', [])
        if product_ids:
            products = Product.objects.filter(id__in=product_ids)
            prescription.approved_products.set(products)

        prescription.save()
        return api_response(
            data=PrescriptionSerializer(prescription, context={'request': request}).data,
            message="Prescription verification status updated."
        )

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        prescription = self.get_object()
        if not prescription.document:
            raise Http404("Prescription document not found.")
        return FileResponse(prescription.document.open('rb'), as_attachment=False)
