from rest_framework.permissions import BasePermission

class IsCustomer(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'CUSTOMER')

class IsDoctor(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'DOCTOR')

class IsPharmacist(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ('PHARMACIST', 'ADMIN'))

class IsDeliveryManager(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ('DELIVERY_MANAGER', 'ADMIN'))

class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.role == 'ADMIN' or request.user.is_staff))
