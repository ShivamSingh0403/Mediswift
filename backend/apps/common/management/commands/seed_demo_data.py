from decimal import Decimal
from django.core.management.base import BaseCommand
from apps.users.models import User, UserProfile, Address
from apps.products.models import Category, Brand, Product
from apps.doctors.models import Specialty, DoctorProfile
from apps.appointments.models import DoctorAvailability

class Command(BaseCommand):
    help = 'Seeds initial demo data for MediSwift development'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding demo data...')

        # 1. Admin & Test Users
        admin_user, _ = User.objects.get_or_create(
            email='admin@mediswift.in',
            defaults={
                'first_name': 'Admin',
                'last_name': 'MediSwift',
                'role': User.Role.ADMIN,
                'is_staff': True,
                'is_superuser': True,
                'is_kyc_verified': True,
            }
        )
        admin_user.set_password('Admin@12345')
        admin_user.save()
        UserProfile.objects.get_or_create(user=admin_user)

        doctor_user, _ = User.objects.get_or_create(
            email='dr.sharma@mediswift.in',
            defaults={
                'first_name': 'Rajesh',
                'last_name': 'Sharma',
                'role': User.Role.DOCTOR,
                'is_kyc_verified': True,
            }
        )
        doctor_user.set_password('Doctor@12345')
        doctor_user.save()
        UserProfile.objects.get_or_create(user=doctor_user)

        customer_user, _ = User.objects.get_or_create(
            email='customer@mediswift.in',
            defaults={
                'first_name': 'Aarav',
                'last_name': 'Patel',
                'role': User.Role.CUSTOMER,
                'is_kyc_verified': True,
            }
        )
        customer_user.set_password('Customer@12345')
        customer_user.save()
        UserProfile.objects.get_or_create(user=customer_user)

        # 2. Address for customer
        Address.objects.get_or_create(
            user=customer_user,
            is_default=True,
            defaults={
                'full_name': 'Aarav Patel',
                'phone': '+91 9876543210',
                'address_line1': 'Flat 402, Lotus Residency, SG Highway',
                'city': 'Ahmedabad',
                'state': 'Gujarat',
                'postal_code': '380054',
                'address_type': Address.AddressType.HOME,
            }
        )

        # 3. Product Categories & Brands
        cat_rx, _ = Category.objects.get_or_create(name='Prescription Medicines', slug='prescription-medicines', defaults={'description': 'Doctor prescribed pharmaceuticals'})
        cat_otc, _ = Category.objects.get_or_create(name='OTC & First Aid', slug='otc-first-aid', defaults={'description': 'Over the counter essentials'})
        cat_wellness, _ = Category.objects.get_or_create(name='Vitamins & Supplements', slug='vitamins-supplements', defaults={'description': 'Nutritional supplements and immunity boosters'})

        brand_cipla, _ = Brand.objects.get_or_create(name='Cipla', slug='cipla')
        brand_sun, _ = Brand.objects.get_or_create(name='Sun Pharma', slug='sun-pharma')
        brand_himalaya, _ = Brand.objects.get_or_create(name='Himalaya Wellness', slug='himalaya')

        # 4. Products
        Product.objects.get_or_create(
            sku='MED-CIP-001',
            defaults={
                'name': 'Augmentin 625 Duo Tablet',
                'slug': 'augmentin-625-duo-tablet',
                'generic_name': 'Amoxycillin and Potassium Clavulanate',
                'composition': 'Amoxycillin (500mg) + Clavulanic Acid (125mg)',
                'category': cat_rx,
                'brand': brand_cipla,
                'description': 'Effective antibiotic medication used to treat diverse bacterial infections of the respiratory tract, ear, and urinary tract.',
                'dosage_form': Product.DosageForm.TABLET,
                'pack_size': '10 Tablets in 1 Strip',
                'price': Decimal('223.50'),
                'discount_percent': Decimal('15.00'),
                'stock_quantity': 150,
                'prescription_required': True,
                'manufacturer': 'GlaxoSmithKline Pharmaceuticals Ltd',
            }
        )

        Product.objects.get_or_create(
            sku='MED-PAR-002',
            defaults={
                'name': 'Dolo 650 Tablet',
                'slug': 'dolo-650-tablet',
                'generic_name': 'Paracetamol 650mg',
                'composition': 'Paracetamol (650mg)',
                'category': cat_otc,
                'brand': brand_sun,
                'description': 'Rapid antipyretic and analgesic tablet formulated to relieve fever, headaches, body pain, and toothache.',
                'dosage_form': Product.DosageForm.TABLET,
                'pack_size': '15 Tablets in 1 Strip',
                'price': Decimal('34.00'),
                'discount_percent': Decimal('10.00'),
                'stock_quantity': 500,
                'prescription_required': False,
                'manufacturer': 'Micro Labs Ltd',
            }
        )

        Product.objects.get_or_create(
            sku='MED-VIT-003',
            defaults={
                'name': 'Himalaya Ashvagandha Tablet',
                'slug': 'himalaya-ashvagandha-tablet',
                'generic_name': 'Ashwagandha Extract',
                'composition': 'Withania somnifera (250mg)',
                'category': cat_wellness,
                'brand': brand_himalaya,
                'description': 'Pure herbal wellness booster that alleviates daily stress, enhances mental clarity, and supports natural immunity.',
                'dosage_form': Product.DosageForm.TABLET,
                'pack_size': '60 Tablets Bottle',
                'price': Decimal('220.00'),
                'discount_percent': Decimal('20.00'),
                'stock_quantity': 250,
                'prescription_required': False,
                'manufacturer': 'The Himalaya Drug Company',
            }
        )

        # 5. Doctor & Specialties
        spec_cardio, _ = Specialty.objects.get_or_create(name='Cardiology', slug='cardiology', defaults={'icon': 'HeartPulse', 'description': 'Heart health and cardiovascular system care'})
        spec_gp, _ = Specialty.objects.get_or_create(name='General Medicine', slug='general-medicine', defaults={'icon': 'Stethoscope', 'description': 'Primary consultations and everyday health issues'})

        doc_profile, _ = DoctorProfile.objects.get_or_create(
            user=doctor_user,
            defaults={
                'license_number': 'MCI-2015-89421',
                'qualifications': 'MBBS, MD (General Medicine)',
                'experience_years': 12,
                'consultation_fee': Decimal('500.00'),
                'languages': 'English, Hindi, Gujarati',
                'hospital_affiliation': 'Apollo Hospitals',
                'clinic_address': 'Room 304, Mediswift Health Clinic, Ahmedabad',
                'bio': 'Senior Consultant Physician with over 12 years experience treating lifestyle diseases, fevers, hypertension, and preventive care.',
                'rating': Decimal('4.9'),
                'review_count': 128,
                'is_available_for_telehealth': True,
                'is_verified': True,
            }
        )
        doc_profile.specialties.add(spec_gp)

        # Doctor availabilities
        for day in [0, 1, 2, 3, 4]:
            DoctorAvailability.objects.get_or_create(
                doctor=doc_profile,
                day_of_week=day,
                start_time='09:00:00',
                end_time='13:00:00',
                defaults={'slot_duration_minutes': 30}
            )

        self.stdout.write(self.style.SUCCESS('Successfully seeded MediSwift demo data!'))
