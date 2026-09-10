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
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = DoctorProfile
        fields = (
            'id', 'slug', 'user', 'doctor_name', 'avatar', 'avatar_url', 'specialties',
            'qualifications', 'experience_years', 'consultation_fee', 'languages',
            'hospital_affiliation', 'city', 'rating', 'review_count',
            'is_available_for_telehealth', 'is_available_for_in_person', 'is_verified'
        )

    def get_avatar(self, obj):
        if obj.avatar_url:
            return obj.avatar_url
        if hasattr(obj.user, 'profile') and obj.user.profile.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.user.profile.avatar.url)
            return obj.user.profile.avatar.url
        return None

class DoctorDetailSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    specialties = SpecialtySerializer(many=True, read_only=True)
    doctor_name = serializers.CharField(source='user.get_full_name', read_only=True)
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = DoctorProfile
        fields = (
            'id', 'slug', 'user', 'doctor_name', 'avatar', 'avatar_url', 'specialties',
            'license_number', 'qualifications', 'experience_years', 'consultation_fee',
            'languages', 'hospital_affiliation', 'clinic_address', 'city', 'bio',
            'rating', 'review_count', 'is_available_for_telehealth',
            'is_available_for_in_person', 'is_verified', 'created_at'
        )

    def get_avatar(self, obj):
        if obj.avatar_url:
            return obj.avatar_url
        if hasattr(obj.user, 'profile') and obj.user.profile.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.user.profile.avatar.url)
            return obj.user.profile.avatar.url
        return None
