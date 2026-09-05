import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _
from apps.common.models import TimeStampedModel

class UserManager(BaseUserManager):
    """Custom user model manager with email as unique identifier."""
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('The Email must be set'))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', User.Role.ADMIN)

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))

        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    class Role(models.TextChoices):
        CUSTOMER = 'CUSTOMER', _('Customer')
        DOCTOR = 'DOCTOR', _('Doctor')
        PHARMACIST = 'PHARMACIST', _('Pharmacist')
        ADMIN = 'ADMIN', _('Administrator')
        DELIVERY_MANAGER = 'DELIVERY_MANAGER', _('Delivery Manager')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = None
    email = models.EmailField(_('email address'), unique=True, db_index=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CUSTOMER, db_index=True)
    phone_number = models.CharField(max_length=15, blank=True)
    is_kyc_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = UserManager()

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email', 'role']),
        ]

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"

class UserProfile(TimeStampedModel):
    class Gender(models.TextChoices):
        MALE = 'MALE', _('Male')
        FEMALE = 'FEMALE', _('Female')
        OTHER = 'OTHER', _('Other')
        PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY', _('Prefer not to say')

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=20, choices=Gender.choices, default=Gender.PREFER_NOT_TO_SAY)
    blood_group = models.CharField(max_length=5, blank=True)
    emergency_contact = models.CharField(max_length=15, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)

    def __str__(self):
        return f"Profile for {self.user.email}"

class Address(TimeStampedModel):
    class AddressType(models.TextChoices):
        HOME = 'HOME', _('Home')
        WORK = 'WORK', _('Work')
        OTHER = 'OTHER', _('Other')

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    full_name = models.CharField(max_length=120)
    phone = models.CharField(max_length=15)
    address_line1 = models.CharField(max_length=255)
    address_line2 = models.CharField(max_length=255, blank=True)
    landmark = models.CharField(max_length=150, blank=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=10, db_index=True)
    address_type = models.CharField(max_length=10, choices=AddressType.choices, default=AddressType.HOME)
    is_default = models.BooleanField(default=False)

    class Meta:
        ordering = ['-is_default', '-created_at']

    def save(self, *args, **kwargs):
        if self.is_default:
            Address.objects.filter(user=self.user, is_default=True).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.full_name}, {self.city} - {self.postal_code}"
