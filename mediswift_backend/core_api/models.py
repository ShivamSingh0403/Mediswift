from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _

class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser.
    Enables future role-based permissions and profile extension.
    """
    class RoleChoices(models.TextChoices):
        PATIENT = 'PATIENT', _('Patient')
        DOCTOR = 'DOCTOR', _('Doctor')
        PHARMACIST = 'PHARMACIST', _('Pharmacist')
        ADMIN = 'ADMIN', _('Administrator')

    email = models.EmailField(_('email address'), unique=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    role = models.CharField(
        max_length=20,
        choices=RoleChoices.choices,
        default=RoleChoices.PATIENT,
    )
    address = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    def __str__(self):
        return f"{self.email} ({self.get_full_name() or self.username})"


class Medicine(models.Model):
    """
    Medicine catalog item representation calibrated for Indian pharmaceutical standard.
    """
    CATEGORY_CHOICES = [
        ('prescription', 'Prescription Drugs'),
        ('otc', 'Over-The-Counter (OTC)'),
        ('wellness', 'Wellness & Supplements'),
        ('devices', 'Medical Devices & First Aid'),
        ('personal_care', 'Personal Care'),
    ]

    DOSAGE_FORM_CHOICES = [
        ('tablet', 'Tablet'),
        ('capsule', 'Capsule'),
        ('syrup', 'Syrup / Suspension'),
        ('ointment', 'Ointment / Gel / Cream'),
        ('injection', 'Injection / Vial'),
        ('drops', 'Eye / Ear Drops'),
        ('inhaler', 'Inhaler / Respules'),
        ('powder', 'Powder / Sachet'),
    ]

    name = models.CharField(max_length=255, db_index=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, db_index=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Selling price in INR (₹)")
    mrp = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Maximum Retail Price in INR (₹)")
    discount_percent = models.PositiveIntegerField(default=15, help_text="Discount percentage against MRP")
    stock = models.PositiveIntegerField(default=0)
    description = models.TextField()
    image_url = models.URLField(max_length=1000, blank=True, default='')
    manufacturer = models.CharField(max_length=255, blank=True, default='')
    composition = models.CharField(
        max_length=255,
        blank=True,
        default='',
        db_index=True,
        help_text="Active salt / chemical composition e.g. Paracetamol (650mg)"
    )
    dosage = models.CharField(max_length=100, blank=True, default='')
    dosage_form = models.CharField(
        max_length=50,
        choices=DOSAGE_FORM_CHOICES,
        default='tablet',
        db_index=True
    )
    packaging = models.CharField(
        max_length=120,
        blank=True,
        default='Strip of 10 tablets',
        help_text="Package configuration e.g. Strip of 15 tablets, Bottle of 100ml"
    )
    side_effects = models.TextField(blank=True, default='')
    how_to_use = models.TextField(blank=True, default='')
    requires_prescription = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['name', 'category']),
            models.Index(fields=['composition']),
            models.Index(fields=['dosage_form']),
        ]

    def __str__(self):
        return f"{self.name} - ₹{self.price}"


class Doctor(models.Model):
    """
    Doctor profile for appointment booking and teleconsultation.
    """
    SPECIALTY_CHOICES = [
        ('Cardiology', 'Cardiologist'),
        ('Dermatology', 'Dermatologist'),
        ('General Physician', 'General Physician'),
        ('Neurology', 'Neurologist'),
        ('Pediatrics', 'Pediatrician'),
        ('Orthopedics', 'Orthopedic Surgeon'),
        ('Psychiatry', 'Psychiatrist'),
    ]

    name = models.CharField(max_length=255)
    specialty = models.CharField(max_length=100, choices=SPECIALTY_CHOICES, db_index=True)
    experience = models.PositiveIntegerField(help_text='Experience in years')
    fee = models.DecimalField(max_digits=8, decimal_places=2, help_text='Consultation fee')
    availability = models.CharField(
        max_length=255,
        default='Mon - Fri: 09:00 AM - 05:00 PM',
        help_text='Working hours or schedule string'
    )
    email = models.EmailField(blank=True, default='')
    phone = models.CharField(max_length=20, blank=True, default='')
    bio = models.TextField(blank=True, default='')
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=4.90)
    image_url = models.URLField(max_length=1000, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"Dr. {self.name} ({self.specialty})"


class Order(models.Model):
    """
    Customer order containing one or multiple medicine line items.
    """
    class OrderStatus(models.TextChoices):
        PENDING = 'PENDING', _('Pending Payment')
        PAID = 'PAID', _('Paid')
        PROCESSING = 'PROCESSING', _('Processing')
        SHIPPED = 'SHIPPED', _('Shipped')
        DELIVERED = 'DELIVERED', _('Delivered')
        CANCELLED = 'CANCELLED', _('Cancelled')

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='orders'
    )
    total_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    status = models.CharField(
        max_length=20,
        choices=OrderStatus.choices,
        default=OrderStatus.PENDING,
        db_index=True
    )
    shipping_address = models.TextField(blank=True, default='')
    contact_phone = models.CharField(max_length=20, blank=True, default='')
    payment_id = models.CharField(max_length=100, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Order #{self.id} - {self.user.email} - {self.status}"


class OrderItem(models.Model):
    """
    Individual items linked to an Order.
    """
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items'
    )
    medicine = models.ForeignKey(
        Medicine,
        on_delete=models.PROTECT,
        related_name='order_items'
    )
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.quantity}x {self.medicine.name} in Order #{self.order_id}"

    @property
    def subtotal(self):
        return self.quantity * self.unit_price


class Appointment(models.Model):
    """
    Telehealth / In-clinic appointment booking with a Doctor.
    """
    class AppointmentStatus(models.TextChoices):
        PENDING = 'PENDING', _('Pending')
        CONFIRMED = 'CONFIRMED', _('Confirmed')
        COMPLETED = 'COMPLETED', _('Completed')
        CANCELLED = 'CANCELLED', _('Cancelled')

    doctor = models.ForeignKey(
        Doctor,
        on_delete=models.CASCADE,
        related_name='appointments'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='appointments',
        null=True,
        blank=True
    )
    patient_name = models.CharField(max_length=255)
    patient_email = models.EmailField()
    patient_phone = models.CharField(max_length=20)
    appointment_date = models.DateField(db_index=True)
    time_slot = models.CharField(max_length=50)
    status = models.CharField(
        max_length=20,
        choices=AppointmentStatus.choices,
        default=AppointmentStatus.PENDING
    )
    reason = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-appointment_date', 'time_slot']
        constraints = [
            models.UniqueConstraint(
                fields=['doctor', 'appointment_date', 'time_slot'],
                condition=~models.Q(status='CANCELLED'),
                name='unique_active_doctor_slot'
            )
        ]

    def __str__(self):
        return f"Appointment with Dr. {self.doctor.name} for {self.patient_name} on {self.appointment_date} ({self.time_slot})"


class Availability(models.Model):
    """
    Weekly schedule availability for doctors.
    """
    DAYS_OF_WEEK = [
        (0, _('Monday')),
        (1, _('Tuesday')),
        (2, _('Wednesday')),
        (3, _('Thursday')),
        (4, _('Friday')),
        (5, _('Saturday')),
        (6, _('Sunday')),
    ]

    doctor = models.ForeignKey(
        Doctor,
        on_delete=models.CASCADE,
        related_name='availabilities'
    )
    day_of_week = models.IntegerField(choices=DAYS_OF_WEEK, db_index=True)
    start_time = models.TimeField(default='09:00:00')
    end_time = models.TimeField(default='17:00:00')
    slot_duration = models.PositiveIntegerField(default=30, help_text='Duration per slot in minutes')
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['doctor', 'day_of_week', 'start_time']
        verbose_name_plural = 'Availabilities'
        unique_together = ('doctor', 'day_of_week')

    def __str__(self):
        return f"Dr. {self.doctor.name} - {self.get_day_of_week_display()}: {self.start_time.strftime('%I:%M %p')} - {self.end_time.strftime('%I:%M %p')}"


class Prescription(models.Model):
    """
    Uploaded medical prescriptions awaiting pharmacist or doctor review.
    """
    class PrescriptionStatus(models.TextChoices):
        PENDING = 'PENDING', _('Pending Review')
        APPROVED = 'APPROVED', _('Approved')
        REJECTED = 'REJECTED', _('Rejected')

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='prescriptions',
        null=True,
        blank=True
    )
    file = models.FileField(upload_to='prescriptions/%Y/%m/%d/')
    image_url = models.URLField(max_length=1000, blank=True, default='')
    patient_name = models.CharField(max_length=255, blank=True, default='')
    doctor_notes = models.TextField(blank=True, default='')
    status = models.CharField(
        max_length=20,
        choices=PrescriptionStatus.choices,
        default=PrescriptionStatus.PENDING,
        db_index=True
    )
    rejection_reason = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Prescription #{self.id} ({self.status}) - {self.patient_name or (self.user.email if self.user else 'Guest')}"
