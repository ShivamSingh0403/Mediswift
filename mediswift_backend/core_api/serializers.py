from rest_framework import serializers
from django.db import transaction
from .models import User, Medicine, Doctor, Order, OrderItem, Appointment, Prescription, Availability

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone_number', 'role', 'address']
        read_only_fields = ['id', 'role']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'password', 'first_name', 'last_name', 'phone_number']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone_number=validated_data.get('phone_number', '')
        )
        return user


class MedicineSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    dosage_form_display = serializers.CharField(source='get_dosage_form_display', read_only=True)

    class Meta:
        model = Medicine
        fields = [
            'id', 'name', 'category', 'category_display', 'price', 'mrp',
            'discount_percent', 'stock', 'description', 'image_url',
            'manufacturer', 'composition', 'dosage', 'dosage_form',
            'dosage_form_display', 'packaging', 'side_effects', 'how_to_use',
            'requires_prescription', 'created_at', 'updated_at'
        ]


class DoctorSerializer(serializers.ModelSerializer):
    specialty_display = serializers.CharField(source='get_specialty_display', read_only=True)

    class Meta:
        model = Doctor
        fields = [
            'id', 'name', 'specialty', 'specialty_display', 'experience',
            'fee', 'availability', 'email', 'phone', 'bio', 'rating',
            'image_url', 'created_at'
        ]


class OrderItemSerializer(serializers.ModelSerializer):
    medicine_name = serializers.ReadOnlyField(source='medicine.name')
    medicine_image = serializers.ReadOnlyField(source='medicine.image_url')
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'medicine', 'medicine_name', 'medicine_image', 'quantity', 'unit_price', 'subtotal']
        read_only_fields = ['unit_price', 'subtotal']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user_email = serializers.ReadOnlyField(source='user.email')

    # Input items field for checkout order creation
    cart_items = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Order
        fields = [
            'id', 'user', 'user_email', 'total_price', 'status',
            'shipping_address', 'contact_phone', 'payment_id',
            'items', 'cart_items', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'total_price', 'created_at', 'updated_at']

    def create(self, validated_data):
        cart_items_data = validated_data.pop('cart_items', [])
        user = self.context['request'].user
        
        with transaction.atomic():
            order = Order.objects.create(user=user, **validated_data)
            calculated_total = 0

            for item_data in cart_items_data:
                med_id = item_data.get('medicine_id') or item_data.get('id')
                qty = int(item_data.get('quantity', 1))

                medicine = Medicine.objects.select_for_update().get(id=med_id)
                if medicine.stock < qty:
                    raise serializers.ValidationError(
                        f"Insufficient stock for {medicine.name}. Available: {medicine.stock}, requested: {qty}"
                    )

                # Deduct stock
                medicine.stock -= qty
                medicine.save(update_fields=['stock'])

                unit_price = medicine.price
                item_total = unit_price * qty
                calculated_total += item_total

                OrderItem.objects.create(
                    order=order,
                    medicine=medicine,
                    quantity=qty,
                    unit_price=unit_price
                )

            order.total_price = calculated_total
            order.save(update_fields=['total_price'])

        return order


class AppointmentSerializer(serializers.ModelSerializer):
    doctor_name = serializers.ReadOnlyField(source='doctor.name')
    doctor_specialty = serializers.ReadOnlyField(source='doctor.specialty')
    doctor_fee = serializers.ReadOnlyField(source='doctor.fee')

    class Meta:
        model = Appointment
        fields = [
            'id', 'doctor', 'doctor_name', 'doctor_specialty', 'doctor_fee',
            'user', 'patient_name', 'patient_email', 'patient_phone',
            'appointment_date', 'time_slot', 'status', 'reason', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'status', 'created_at']


class AvailabilitySerializer(serializers.ModelSerializer):
    day_name = serializers.CharField(source='get_day_of_week_display', read_only=True)

    class Meta:
        model = Availability
        fields = [
            'id', 'doctor', 'day_of_week', 'day_name', 'start_time',
            'end_time', 'slot_duration', 'is_active'
        ]


class PrescriptionSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source='user.email')
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Prescription
        fields = [
            'id', 'user', 'user_email', 'file', 'file_url', 'image_url',
            'patient_name', 'doctor_notes', 'status', 'rejection_reason',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'status', 'rejection_reason', 'created_at', 'updated_at']

    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return obj.image_url
