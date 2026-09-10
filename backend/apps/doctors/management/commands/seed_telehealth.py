import datetime
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils.text import slugify
from apps.doctors.models import Specialty, DoctorProfile
from apps.appointments.models import DoctorAvailability, DoctorBlockedDate, Appointment

User = get_user_model()

SPECIALTIES_DATA = [
    {
        "name": "General Physician",
        "slug": "general-physician",
        "icon": "Stethoscope",
        "description": "Primary medical care, viral infections, lifestyle disorders, hypertension, and routine diagnostics."
    },
    {
        "name": "Dermatologist",
        "slug": "dermatologist",
        "icon": "Sparkles",
        "description": "Clinical diagnosis and therapy for skin, hair, nails, acne, eczema, psoriasis, and cosmetic dermatology."
    },
    {
        "name": "Pediatrician",
        "slug": "pediatrician",
        "icon": "Baby",
        "description": "Comprehensive child healthcare, developmental assessments, newborn care, and pediatric immunizations."
    },
    {
        "name": "Cardiologist",
        "slug": "cardiologist",
        "icon": "HeartPulse",
        "description": "Interventional cardiology, coronary heart disease, ECG analysis, arrhythmias, and cardiovascular health."
    },
    {
        "name": "Dentist",
        "slug": "dentist",
        "icon": "Smile",
        "description": "Preventive dentistry, cosmetic dental enhancements, root canals, implants, and oral hygiene procedures."
    },
    {
        "name": "Orthopedic Specialist",
        "slug": "orthopedic-specialist",
        "icon": "Bone",
        "description": "Joint replacement, fracture treatment, musculoskeletal conditions, spine disorders, and sports injuries."
    },
    {
        "name": "Gynecologist",
        "slug": "gynecologist",
        "icon": "Heart",
        "description": "Comprehensive women's health, obstetric care, PCOS management, fertility, and prenatal guidance."
    },
    {
        "name": "Neurologist",
        "slug": "neurologist",
        "icon": "Brain",
        "description": "Treatment of neurological disorders, chronic migraines, epilepsy, neuropathy, and stroke recovery."
    },
    {
        "name": "Nutritionist",
        "slug": "nutritionist",
        "icon": "Apple",
        "description": "Evidence-based dietary planning, therapeutic clinical nutrition, metabolic health, and weight management."
    },
    {
        "name": "Psychiatrist",
        "slug": "psychiatrist",
        "icon": "Activity",
        "description": "Mental health consultations, cognitive behavioral therapy, anxiety, depression, and stress management."
    },
]

DOCTORS_DATA = [
    {
        "email": "dr.arjun.sharma@mediswift.in",
        "first_name": "Arjun",
        "last_name": "Sharma",
        "phone": "+919810112233",
        "specialty_slugs": ["general-physician"],
        "license_number": "MCI-DL-2008-44912",
        "qualifications": "MBBS, MD (Internal Medicine) - AIIMS New Delhi",
        "experience_years": 16,
        "consultation_fee": Decimal("800.00"),
        "languages": "English, Hindi, Punjabi",
        "hospital_affiliation": "AIIMS New Delhi & Apollo Indraprastha",
        "clinic_address": "Suite 402, MediTower, Sarita Vihar, New Delhi - 110076",
        "city": "New Delhi",
        "avatar_url": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=800&auto=format&fit=crop",
        "bio": "Dr. Arjun Sharma is a senior consultant physician with 16+ years of clinical excellence in internal medicine. He specialized in metabolic disorders, type 2 diabetes management, and chronic lifestyle disease reversal at AIIMS New Delhi.",
        "rating": Decimal("4.94"),
        "review_count": 348,
        "is_available_for_telehealth": True,
        "is_available_for_in_person": True,
    },
    {
        "email": "dr.ananya.deshmukh@mediswift.in",
        "first_name": "Ananya",
        "last_name": "Deshmukh",
        "phone": "+919820223344",
        "specialty_slugs": ["dermatologist"],
        "license_number": "MMC-2012-08-3211",
        "qualifications": "MBBS, MD (Dermatology, Venereology & Leprosy) - KEM Mumbai",
        "experience_years": 12,
        "consultation_fee": Decimal("1000.00"),
        "languages": "English, Hindi, Marathi",
        "hospital_affiliation": "Fortis Hospital Mulund & SkinAura Clinic",
        "clinic_address": "Ground Floor, Sunrise Chambers, Bandra West, Mumbai - 400050",
        "city": "Mumbai",
        "avatar_url": "https://images.unsplash.com/photo-1594824813581-cb8371307b0e?q=80&w=800&auto=format&fit=crop",
        "bio": "Dr. Ananya Deshmukh is a board-certified dermatologist and aesthetic medicine specialist. She brings cutting-edge clinical precision to eczema, severe acne vulgaris, hair fall treatments, and laser dermatology.",
        "rating": Decimal("4.91"),
        "review_count": 274,
        "is_available_for_telehealth": True,
        "is_available_for_in_person": True,
    },
    {
        "email": "dr.rajesh.iyer@mediswift.in",
        "first_name": "Rajesh",
        "last_name": "Iyer",
        "phone": "+919840334455",
        "specialty_slugs": ["cardiologist"],
        "license_number": "TMC-2004-1908",
        "qualifications": "MBBS, MD (General Medicine), DM (Cardiology), FACC",
        "experience_years": 20,
        "consultation_fee": Decimal("1400.00"),
        "languages": "English, Hindi, Tamil",
        "hospital_affiliation": "Apollo Heart Centre, Greams Road & Manipal Hospitals",
        "clinic_address": "Apollo Hospitals Campus, 21 Greams Lane, Thousand Lights, Chennai - 600006",
        "city": "Chennai",
        "avatar_url": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=800&auto=format&fit=crop",
        "bio": "Dr. Rajesh Iyer is an internationally acclaimed interventional cardiologist with over two decades of clinical experience performing complex angioplasties and managing resistant hypertension and coronary heart disease.",
        "rating": Decimal("4.98"),
        "review_count": 512,
        "is_available_for_telehealth": True,
        "is_available_for_in_person": True,
    },
    {
        "email": "dr.priya.nambiar@mediswift.in",
        "first_name": "Priya",
        "last_name": "Nambiar",
        "phone": "+919880445566",
        "specialty_slugs": ["pediatrician"],
        "license_number": "KMC-2015-11-9082",
        "qualifications": "MBBS, DNB (Pediatrics), Fellowship in Neonatology - Rainbow Children's",
        "experience_years": 10,
        "consultation_fee": Decimal("750.00"),
        "languages": "English, Hindi, Kannada, Malayalam",
        "hospital_affiliation": "Rainbow Children's Hospital, Bannerghatta Road",
        "clinic_address": "120/4, 7th Main, 4th Block, Koramangala, Bengaluru - 560034",
        "city": "Bengaluru",
        "avatar_url": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=800&auto=format&fit=crop",
        "bio": "Dr. Priya Nambiar is a compassionate pediatrician who specializes in infant nutrition, pediatric respiratory illnesses, growth milestone tracking, and preventive immunization protocols for young children.",
        "rating": Decimal("4.89"),
        "review_count": 195,
        "is_available_for_telehealth": True,
        "is_available_for_in_person": True,
    },
    {
        "email": "dr.vikram.patel@mediswift.in",
        "first_name": "Vikram",
        "last_name": "Patel",
        "phone": "+919870556677",
        "specialty_slugs": ["orthopedic-specialist"],
        "license_number": "GMC-2009-04-1876",
        "qualifications": "MBBS, MS (Orthopedics), MCh (Ortho - UK), Fellowship in Joint Replacement",
        "experience_years": 15,
        "consultation_fee": Decimal("1100.00"),
        "languages": "English, Hindi, Gujarati",
        "hospital_affiliation": "Max Super Speciality Hospital Saket & Fortis Memorial",
        "clinic_address": "Max Hospital Complex, 1 Press Enclave Marg, Saket, New Delhi - 110017",
        "city": "New Delhi",
        "avatar_url": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=800&auto=format&fit=crop",
        "bio": "Dr. Vikram Patel is a leading orthopedic surgeon and sports medicine consultant. His expertise encompasses robotic knee arthroplasty, ligament reconstruction, degenerative spinal conditions, and chronic joint pain therapy.",
        "rating": Decimal("4.92"),
        "review_count": 310,
        "is_available_for_telehealth": True,
        "is_available_for_in_person": True,
    },
    {
        "email": "dr.sunita.rao@mediswift.in",
        "first_name": "Sunita",
        "last_name": "Rao",
        "phone": "+919845667788",
        "specialty_slugs": ["gynecologist"],
        "license_number": "APMC-2007-9942",
        "qualifications": "MBBS, MD (Obstetrics & Gynecology), FICOG, Diploma in Advanced Endoscopy",
        "experience_years": 17,
        "consultation_fee": Decimal("950.00"),
        "languages": "English, Hindi, Telugu",
        "hospital_affiliation": "Apollo Cradle & Yashoda Hospitals Hitec City",
        "clinic_address": "Plot 18, Road No. 2, Banjara Hills, Hyderabad - 500034",
        "city": "Hyderabad",
        "avatar_url": "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?q=80&w=800&auto=format&fit=crop",
        "bio": "Dr. Sunita Rao is a renowned senior obstetrician and gynecologist. She is celebrated for her holistic approach to PCOS management, high-risk pregnancy care, pre-conception counseling, and laparoscopic pelvic procedures.",
        "rating": Decimal("4.95"),
        "review_count": 420,
        "is_available_for_telehealth": True,
        "is_available_for_in_person": True,
    },
    {
        "email": "dr.rohit.sen@mediswift.in",
        "first_name": "Rohit",
        "last_name": "Sen",
        "phone": "+919830778899",
        "specialty_slugs": ["neurologist"],
        "license_number": "WBMC-2010-5512",
        "qualifications": "MBBS, MD (General Medicine), DM (Neurology - NIMHANS)",
        "experience_years": 14,
        "consultation_fee": Decimal("1300.00"),
        "languages": "English, Hindi, Bengali",
        "hospital_affiliation": "Medanta The Medicity & Apollo Gleneagles",
        "clinic_address": "Sector 38, CH Bakhtawar Singh Road, Gurugram, Haryana - 122001",
        "city": "Gurugram",
        "avatar_url": "https://images.unsplash.com/photo-1582750433449-648ed127bb54?q=80&w=800&auto=format&fit=crop",
        "bio": "Trained at the prestigious NIMHANS Bengaluru, Dr. Rohit Sen specializes in refractory epilepsy, migraine management, neuromuscular disorders, Parkinson's disease, and post-stroke rehabilitation.",
        "rating": Decimal("4.93"),
        "review_count": 288,
        "is_available_for_telehealth": True,
        "is_available_for_in_person": True,
    },
    {
        "email": "dr.tanvi.mehta@mediswift.in",
        "first_name": "Tanvi",
        "last_name": "Mehta",
        "phone": "+919821889900",
        "specialty_slugs": ["psychiatrist"],
        "license_number": "MMC-2014-06-2009",
        "qualifications": "MBBS, MD (Psychiatry - KEM), MRCPsych (UK)",
        "experience_years": 11,
        "consultation_fee": Decimal("1200.00"),
        "languages": "English, Hindi, Marathi",
        "hospital_affiliation": "Kokilaben Dhirubhai Ambani Hospital & MindWell Clinic",
        "clinic_address": "Rao Saheb Achutrao Patwardhan Marg, Four Bungalows, Andheri West, Mumbai - 400053",
        "city": "Mumbai",
        "avatar_url": "https://images.unsplash.com/photo-1527613426441-4da17471b66d?q=80&w=800&auto=format&fit=crop",
        "bio": "Dr. Tanvi Mehta offers compassionate, evidence-driven mental health consultations. Her practice emphasizes non-judgmental care for adult ADHD, acute anxiety, clinical depression, work-life burnout, and sleep disorders.",
        "rating": Decimal("4.97"),
        "review_count": 362,
        "is_available_for_telehealth": True,
        "is_available_for_in_person": False,
    },
    {
        "email": "dr.kabir.malhotra@mediswift.in",
        "first_name": "Kabir",
        "last_name": "Malhotra",
        "phone": "+919811990011",
        "specialty_slugs": ["dentist"],
        "license_number": "DDC-2013-1021",
        "qualifications": "BDS, MDS (Prosthodontics & Implantology) - Maulana Azad Institute",
        "experience_years": 11,
        "consultation_fee": Decimal("650.00"),
        "languages": "English, Hindi, Punjabi",
        "hospital_affiliation": "Max Healthcare & Malhotra Dental Studio",
        "clinic_address": "D-14, Ground Floor, Defence Colony, New Delhi - 110024",
        "city": "New Delhi",
        "avatar_url": "https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=800&auto=format&fit=crop",
        "bio": "Dr. Kabir Malhotra is a cosmetic and reconstructive dentist. He has performed over 3,000 successful smile rehabilitations, dental implants, painless single-sitting root canals, and invisible aligner treatments.",
        "rating": Decimal("4.88"),
        "review_count": 210,
        "is_available_for_telehealth": True,
        "is_available_for_in_person": True,
    },
    {
        "email": "dt.pooja.agarwal@mediswift.in",
        "first_name": "Pooja",
        "last_name": "Agarwal",
        "phone": "+919886001122",
        "specialty_slugs": ["nutritionist"],
        "license_number": "IDA-2016-8821",
        "qualifications": "M.Sc (Clinical Nutrition & Dietetics), Certified Diabetic Educator (CDE)",
        "experience_years": 9,
        "consultation_fee": Decimal("600.00"),
        "languages": "English, Hindi, Bengali",
        "hospital_affiliation": "Manipal Hospital Whitefield & NutriHealth Studio",
        "clinic_address": "ITPL Main Road, Brookefield, Bengaluru - 560066",
        "city": "Bengaluru",
        "avatar_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop",
        "bio": "Pooja Agarwal is an expert clinical nutritionist and certified diabetes educator specializing in medical nutrition therapy for fatty liver reversal, insulin resistance, thyroid disorders, and sustainable weight management.",
        "rating": Decimal("4.96"),
        "review_count": 240,
        "is_available_for_telehealth": True,
        "is_available_for_in_person": False,
    },
]

class Command(BaseCommand):
    help = "Seeds standard medical specialties, verified doctors, weekly schedules, and sample appointments"

    def handle(self, *args, **options):
        self.stdout.write("Starting Telehealth & Doctor Data Seeding...")

        # 1. Seed Specialties
        specialty_map = {}
        for spec_data in SPECIALTIES_DATA:
            specialty, created = Specialty.objects.update_or_create(
                slug=spec_data["slug"],
                defaults={
                    "name": spec_data["name"],
                    "icon": spec_data["icon"],
                    "description": spec_data["description"]
                }
            )
            specialty_map[spec_data["slug"]] = specialty
            status_text = "Created" if created else "Updated"
            self.stdout.write(f"  [Specialty] {status_text}: {specialty.name}")

        # 2. Seed Doctors
        for doc_data in DOCTORS_DATA:
            user, u_created = User.objects.get_or_create(
                email=doc_data["email"],
                defaults={
                    "first_name": doc_data["first_name"],
                    "last_name": doc_data["last_name"],
                    "phone_number": doc_data["phone"],
                    "role": User.Role.DOCTOR,
                    "is_kyc_verified": True
                }
            )
            if u_created:
                user.set_password("Doctor@12345")
                user.save()
            else:
                user.first_name = doc_data["first_name"]
                user.last_name = doc_data["last_name"]
                user.phone_number = doc_data["phone"]
                user.role = User.Role.DOCTOR
                user.save()

            slug_candidate = slugify(f"dr-{doc_data['first_name']}-{doc_data['last_name']}")
            profile, p_created = DoctorProfile.objects.update_or_create(
                user=user,
                defaults={
                    "slug": slug_candidate,
                    "license_number": doc_data["license_number"],
                    "qualifications": doc_data["qualifications"],
                    "experience_years": doc_data["experience_years"],
                    "consultation_fee": doc_data["consultation_fee"],
                    "languages": doc_data["languages"],
                    "hospital_affiliation": doc_data["hospital_affiliation"],
                    "clinic_address": doc_data["clinic_address"],
                    "city": doc_data["city"],
                    "avatar_url": doc_data["avatar_url"],
                    "bio": doc_data["bio"],
                    "rating": doc_data["rating"],
                    "review_count": doc_data["review_count"],
                    "is_available_for_telehealth": doc_data["is_available_for_telehealth"],
                    "is_available_for_in_person": doc_data["is_available_for_in_person"],
                    "is_verified": True,
                }
            )

            # Assign specialties
            profile_specialties = [specialty_map[s] for s in doc_data["specialty_slugs"] if s in specialty_map]
            profile.specialties.set(profile_specialties)

            # 3. Create Weekly Availabilities (Mon - Fri: 09:00 to 18:00 with lunch break 13:00-14:00; Sat: 09:00 to 14:00)
            for weekday in range(0, 5):  # Mon-Fri
                DoctorAvailability.objects.update_or_create(
                    doctor=profile,
                    day_of_week=weekday,
                    start_time=datetime.time(9, 0),
                    defaults={
                        "end_time": datetime.time(18, 0),
                        "slot_duration_minutes": 30,
                        "break_start_time": datetime.time(13, 0),
                        "break_end_time": datetime.time(14, 0),
                        "is_active": True
                    }
                )

            # Saturday half day
            DoctorAvailability.objects.update_or_create(
                doctor=profile,
                day_of_week=5,  # Saturday
                start_time=datetime.time(9, 0),
                defaults={
                    "end_time": datetime.time(14, 0),
                    "slot_duration_minutes": 30,
                    "break_start_time": None,
                    "break_end_time": None,
                    "is_active": True
                }
            )

            status_text = "Created" if p_created else "Updated"
            self.stdout.write(f"  [Doctor] {status_text}: Dr. {user.get_full_name()} ({doc_data['city']})")

        self.stdout.write(self.style.SUCCESS("Successfully seeded Telehealth specialties, doctors, and schedules!"))
