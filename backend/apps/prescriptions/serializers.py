from rest_framework import serializers
from apps.prescriptions.models import Prescription
from apps.products.serializers import ProductListSerializer

class PrescriptionSerializer(serializers.ModelSerializer):
    approved_products = ProductListSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    verified_by_name = serializers.CharField(source='verified_by.get_full_name', read_only=True)

    class Meta:
        model = Prescription
        fields = (
            'id', 'patient', 'document', 'original_filename', 'doctor_name',
            'patient_notes', 'status', 'status_display', 'pharmacist_notes',
            'verified_by', 'verified_by_name', 'verified_at', 'approved_products',
            'created_at'
        )
        read_only_fields = ('id', 'patient', 'status', 'pharmacist_notes', 'verified_by', 'verified_at', 'created_at')

class PrescriptionUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prescription
        fields = ('document', 'doctor_name', 'patient_notes')

    def create(self, validated_data):
        doc = validated_data.get('document')
        if doc:
            validated_data['original_filename'] = doc.name
        validated_data['patient'] = self.context['request'].user
        return super().create(validated_data)

class PrescriptionVerifySerializer(serializers.ModelSerializer):
    approved_product_ids = serializers.ListField(
        child=serializers.UUIDField(), required=False, write_only=True
    )

    class Meta:
        model = Prescription
        fields = ('status', 'pharmacist_notes', 'approved_product_ids')
