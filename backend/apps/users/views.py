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

class AddressViewSet(viewsets.ModelViewSet):
    serializer_class = AddressSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return api_response(data=serializer.data, message="Addresses fetched successfully.")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return api_response(data=serializer.data, message="Address created successfully.", status_code=status.HTTP_201_CREATED)
