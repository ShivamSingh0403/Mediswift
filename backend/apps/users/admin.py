from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from apps.users.models import User, UserProfile, Address

class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)
    list_display = ('email', 'first_name', 'last_name', 'role', 'is_kyc_verified', 'is_staff', 'created_at')
    list_filter = ('role', 'is_kyc_verified', 'is_staff', 'is_active')
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'phone_number')}),
        ('Permissions', {'fields': ('role', 'is_kyc_verified', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'created_at', 'updated_at')}),
    )
    readonly_fields = ('created_at', 'updated_at')
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password', 'role', 'first_name', 'last_name'),
        }),
    )
    search_fields = ('email', 'first_name', 'last_name', 'phone_number')
    ordering = ('-created_at',)

@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'user', 'city', 'state', 'postal_code', 'address_type', 'is_default')
    list_filter = ('address_type', 'is_default', 'state')
    search_fields = ('full_name', 'user__email', 'postal_code', 'city')
