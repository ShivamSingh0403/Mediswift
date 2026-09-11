from rest_framework import generics, viewsets, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from apps.common.responses import api_response
from apps.users.models import User, UserProfile, Address
from apps.users.serializers import (
    UserSerializer,
    UserRegistrationSerializer,
    UserProfileSerializer,
    AddressSerializer,
    CustomTokenObtainPairSerializer,
)

class DecoratedTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return api_response(
            data=serializer.validated_data,
            message="Login successful.",
            status_code=status.HTTP_200_OK
        )

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserRegistrationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        user_data = UserSerializer(user).data
        return api_response(
            data=user_data,
            message="Account registered successfully.",
            status_code=status.HTTP_201_CREATED
        )

class CurrentUserView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        serializer = UserSerializer(request.user)
        return api_response(data=serializer.data, message="Profile retrieved successfully.")

    def patch(self, request):
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Update profile nested fields if present
        profile_data = request.data.get('profile')
        if profile_data:
            profile_serializer = UserProfileSerializer(user.profile, data=profile_data, partial=True)
            profile_serializer.is_valid(raise_exception=True)
            profile_serializer.save()

        return api_response(data=UserSerializer(user).data, message="Profile updated successfully.")

from rest_framework.decorators import action

class AddressViewSet(viewsets.ModelViewSet):
    serializer_class = AddressSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return api_response(data=serializer.data, message="Addresses fetched successfully.")

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return api_response(data=serializer.data, message="Address retrieved successfully.")

    def perform_create(self, serializer):
        user = self.request.user
        has_addresses = Address.objects.filter(user=user).exists()
        is_default = serializer.validated_data.get('is_default', False) or not has_addresses

        if is_default:
            Address.objects.filter(user=user).update(is_default=False)

        serializer.save(user=user, is_default=is_default)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return api_response(data=serializer.data, message="Address created successfully.", status_code=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        if serializer.validated_data.get('is_default'):
            Address.objects.filter(user=request.user).exclude(id=instance.id).update(is_default=False)

        self.perform_update(serializer)
        return api_response(data=serializer.data, message="Address updated successfully.")

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        was_default = instance.is_default
        self.perform_destroy(instance)

        if was_default:
            first_remaining = Address.objects.filter(user=request.user).first()
            if first_remaining:
                first_remaining.is_default = True
                first_remaining.save(update_fields=['is_default'])

        return api_response(data=None, message="Address deleted successfully.", status_code=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='set-default')
    def set_default(self, request, pk=None):
        address = self.get_object()
        Address.objects.filter(user=request.user).update(is_default=False)
        address.is_default = True
        address.save(update_fields=['is_default'])
        serializer = self.get_serializer(address)
        return api_response(data=serializer.data, message="Default address updated successfully.")
