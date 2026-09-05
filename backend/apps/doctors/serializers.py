from rest_framework import serializers
from apps.doctors.models import Specialty, DoctorProfile
from apps.users.serializers import UserSerializer

class SpecialtySerializer(serializers.ModelSerializer):
    class Meta:
        model = Specialty
        fields = ('id', 'name', 'slug', 'description', 'icon')

class DoctorListSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    specialties = SpecialtySerializer(many=True, read_only=True)
    doctor_name = serializers.CharField(source='user.get_full_name', read_only=True)
    avatar = serializers.ImageField(source='user.profile.avatar', read_only=True)

    class Meta:
        model = DoctorProfile
        fields = (
            'id', 'user', 'doctor_name', 'avatar', 'specialties', 'qualifications',
            'experience_years', 'consultation_fee', 'languages', 'hospital_affiliation',
            'rating', 'review_count', 'is_available_for_telehealth', 'is_verified'
        )

class DoctorDetailSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    specialties = SpecialtySerializer(many=True, read_only=True)
    doctor_name = serializers.CharField(source='user.get_full_name', read_only=True)
    avatar = serializers.ImageField(source='user.profile.avatar', read_only=True)

    class Meta:
        model = DoctorProfile
        fields = (
            'id', 'user', 'doctor_name', 'avatar', 'specialties', 'license_number',
            'qualifications', 'experience_years', 'consultation_fee', 'languages',
            'hospital_affiliation', 'clinic_address', 'bio', 'rating',
            'review_count', 'is_available_for_telehealth', 'is_verified', 'created_at'
        )
