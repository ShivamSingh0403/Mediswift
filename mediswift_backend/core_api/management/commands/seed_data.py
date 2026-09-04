from django.core.management.base import BaseCommand
from core_api.models import Medicine, Doctor
from decimal import Decimal

class Command(BaseCommand):
    help = 'Seeds initial 15 Medicines and 5 Doctor profiles into the database idempotently.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("==> Seeding Mediswift Pro database..."))

        # -------------------------------------------------------------
        # 1. 15 Curated Initial Medicines
        # -------------------------------------------------------------
        medicines_data = [
            # Prescription
            {
                "name": "Amoxicillin 500mg",
                "category": "prescription",
                "price": Decimal("18.50"),
                "stock": 65,
                "description": "Broad-spectrum bactericidal antibiotic used to treat bacterial infections of the respiratory tract, ear, and urinary system.",
                "image_url": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80",
                "manufacturer": "Pfizer Pharmaceuticals",
                "dosage": "500mg Capsule - Take 1 capsule three times daily with water",
                "requires_prescription": True,
            },
            {
                "name": "Azithromycin 250mg",
                "category": "prescription",
                "price": Decimal("24.00"),
                "stock": 40,
                "description": "Macrolide antibiotic indicated for mild to moderate upper and lower respiratory tract infections.",
                "image_url": "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=600&auto=format&fit=crop&q=80",
                "manufacturer": "Teva Pharmaceuticals",
                "dosage": "250mg Tablet - Once daily for 5 days",
                "requires_prescription": True,
            },
            {
                "name": "Atorvastatin 20mg",
                "category": "prescription",
                "price": Decimal("29.75"),
                "stock": 55,
                "description": "HMG-CoA reductase inhibitor (statin) to lower low-density lipoprotein (LDL) cholesterol and reduce cardiovascular risk.",
                "image_url": "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&auto=format&fit=crop&q=80",
                "manufacturer": "Viatris Labs",
                "dosage": "20mg Tablet - Take once daily in the evening",
                "requires_prescription": True,
            },
            {
                "name": "Metformin Hydrochloride 500mg",
                "category": "prescription",
                "price": Decimal("14.20"),
                "stock": 90,
                "description": "First-line oral anti-diabetic agent for glycemic control in Type 2 diabetes mellitus.",
                "image_url": "https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=600&auto=format&fit=crop&q=80",
                "manufacturer": "Merck KGaA",
                "dosage": "500mg Extended Release Tablet - Take with evening meal",
                "requires_prescription": True,
            },
            {
                "name": "Lisinopril 10mg",
                "category": "prescription",
                "price": Decimal("16.80"),
                "stock": 70,
                "description": "ACE inhibitor prescribed for essential hypertension and adjunctive therapy in heart failure.",
                "image_url": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80",
                "manufacturer": "AstraZeneca",
                "dosage": "10mg Tablet - Take once daily in the morning",
                "requires_prescription": True,
            },

            # Over-The-Counter (OTC)
            {
                "name": "Paracetamol Extra 650mg",
                "category": "otc",
                "price": Decimal("7.25"),
                "stock": 150,
                "description": "Fast-acting analgesic and antipyretic providing prompt relief from headache, toothache, and fever.",
                "image_url": "https://images.unsplash.com/photo-1550572017-4fcdbb59cc32?w=600&auto=format&fit=crop&q=80",
                "manufacturer": "GSK Consumer Health",
                "dosage": "650mg Tablet - 1 tablet every 4 to 6 hours as needed",
                "requires_prescription": False,
            },
            {
                "name": "Ibuprofen Rapid Relief 400mg",
                "category": "otc",
                "price": Decimal("9.50"),
                "stock": 110,
                "description": "NSAID formula providing effective anti-inflammatory and pain relief for muscle aches and joint pain.",
                "image_url": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80",
                "manufacturer": "Bayer Healthcare",
                "dosage": "400mg Liquid Capsule - Take with food or milk",
                "requires_prescription": False,
            },
            {
                "name": "Cetirizine 10mg 24Hr Allergy",
                "category": "otc",
                "price": Decimal("12.99"),
                "stock": 85,
                "description": "Second-generation non-drowsy antihistamine for seasonal allergic rhinitis, sneezing, and hives.",
                "image_url": "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&auto=format&fit=crop&q=80",
                "manufacturer": "Johnson & Johnson",
                "dosage": "10mg Tablet - Once daily",
                "requires_prescription": False,
            },
            {
                "name": "Omeprazole 20mg Acid Reducer",
                "category": "otc",
                "price": Decimal("15.40"),
                "stock": 95,
                "description": "Proton pump inhibitor (PPI) treating frequent heartburn and acid reflux symptoms.",
                "image_url": "https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=600&auto=format&fit=crop&q=80",
                "manufacturer": "Perrigo Health",
                "dosage": "20mg Capsule - Take 30 minutes before breakfast",
                "requires_prescription": False,
            },

            # Wellness & Supplements
            {
                "name": "Vitamin D3 5000 IU Immune Max",
                "category": "wellness",
                "price": Decimal("21.99"),
                "stock": 120,
                "description": "High-potency bioactive cholecalciferol supporting bone density, mood balance, and innate immunity.",
                "image_url": "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&auto=format&fit=crop&q=80",
                "manufacturer": "NatureMade Wellness",
                "dosage": "5000 IU Softgel - Take 1 softgel daily with a fat-containing meal",
                "requires_prescription": False,
            },
            {
                "name": "Omega-3 Triple Strength Fish Oil",
                "category": "wellness",
                "price": Decimal("26.50"),
                "stock": 75,
                "description": "Molecularly distilled wild deep-sea fish oil rich in EPA & DHA for cardiovascular and joint lubrication.",
                "image_url": "https://images.unsplash.com/photo-1550572017-4fcdbb59cc32?w=600&auto=format&fit=crop&q=80",
                "manufacturer": "Nordic Pure Labs",
                "dosage": "1200mg Enteric Softgel - Take 2 softgels daily",
                "requires_prescription": False,
            },
            {
                "name": "Daily Complete Multivitamin + Minerals",
                "category": "wellness",
                "price": Decimal("19.25"),
                "stock": 100,
                "description": "Synergistic blend of 24 essential micronutrients, antioxidants, and zinc for vitality.",
                "image_url": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80",
                "manufacturer": "Centrum Global",
                "dosage": "1 Tablet daily with water",
                "requires_prescription": False,
            },

            # Medical Devices & First Aid
            {
                "name": "Upper Arm Digital Blood Pressure Monitor",
                "category": "devices",
                "price": Decimal("49.99"),
                "stock": 35,
                "description": "Clinical accuracy automated oscillometric blood pressure monitor with irregular heartbeat sensor and Bluetooth.",
                "image_url": "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&auto=format&fit=crop&q=80",
                "manufacturer": "Omron Healthcare",
                "dosage": "1 Device Unit + Large Arm Cuff",
                "requires_prescription": False,
            },
            {
                "name": "Fingertip Pulse Oximeter Pro",
                "category": "devices",
                "price": Decimal("28.00"),
                "stock": 50,
                "description": "Real-time SpO2 blood oxygen saturation and pulse rate monitor with multi-directional OLED display.",
                "image_url": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80",
                "manufacturer": "Contec Medical",
                "dosage": "1 Unit Device with Lanyard & Batteries",
                "requires_prescription": False,
            },
            {
                "name": "Sterile Antiseptic Wound Solution 500ml",
                "category": "devices",
                "price": Decimal("8.75"),
                "stock": 140,
                "description": "Hospital-grade chlorhexidine antiseptic solution for wound disinfection and non-stinging cleansing.",
                "image_url": "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=600&auto=format&fit=crop&q=80",
                "manufacturer": "3M Healthcare",
                "dosage": "500ml Solution Bottle",
                "requires_prescription": False,
            },
        ]

        medicines_created = 0
        for med in medicines_data:
            obj, created = Medicine.objects.update_or_create(
                name=med["name"],
                defaults=med
            )
            if created:
                medicines_created += 1

        self.stdout.write(self.style.SUCCESS(f"[OK] Successfully seeded {len(medicines_data)} medicines ({medicines_created} newly created)."))

        # -------------------------------------------------------------
        # 2. 5 Doctor Profiles
        # -------------------------------------------------------------
        doctors_data = [
            {
                "name": "Sarah Jenkins",
                "specialty": "Cardiology",
                "experience": 14,
                "fee": Decimal("85.00"),
                "availability": "Mon - Fri: 09:00 AM - 05:00 PM",
                "email": "dr.jenkins@mediswift.com",
                "phone": "+1 (555) 349-2910",
                "bio": "Dr. Sarah Jenkins is a board-certified Cardiologist with 14+ years of clinical experience in preventive cardiovascular therapeutics, coronary artery disease, and hypertension management.",
                "rating": Decimal("4.95"),
                "image_url": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500&auto=format&fit=crop&q=80",
            },
            {
                "name": "Marcus Vance",
                "specialty": "Dermatology",
                "experience": 11,
                "fee": Decimal("75.00"),
                "availability": "Tue - Sat: 10:00 AM - 06:00 PM",
                "email": "dr.vance@mediswift.com",
                "phone": "+1 (555) 482-1928",
                "bio": "Dr. Marcus Vance specializes in medical and procedural dermatology, complex acne therapies, eczema management, and non-invasive skin health consultations.",
                "rating": Decimal("4.88"),
                "image_url": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=500&auto=format&fit=crop&q=80",
            },
            {
                "name": "Alexander Wright",
                "specialty": "General Physician",
                "experience": 10,
                "fee": Decimal("60.00"),
                "availability": "Mon - Fri: 08:30 AM - 04:30 PM",
                "email": "dr.wright@mediswift.com",
                "phone": "+1 (555) 837-1928",
                "bio": "Family medicine and primary diagnostic physician focused on comprehensive clinical triage, chronic illness maintenance, and digital prescription renewal.",
                "rating": Decimal("4.90"),
                "image_url": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=500&auto=format&fit=crop&q=80",
            },
            {
                "name": "Emily Chen",
                "specialty": "Pediatrics",
                "experience": 12,
                "fee": Decimal("70.00"),
                "availability": "Mon - Thu: 09:00 AM - 04:00 PM",
                "email": "dr.chen@mediswift.com",
                "phone": "+1 (555) 672-9182",
                "bio": "Fellowship-trained Pediatrician providing compassionate pediatric care, adolescent wellness assessments, immunization advice, and childhood infection treatment.",
                "rating": Decimal("4.92"),
                "image_url": "https://images.unsplash.com/photo-1594824813511-b4c6e9d0231b?w=500&auto=format&fit=crop&q=80",
            },
            {
                "name": "David Miller",
                "specialty": "Orthopedics",
                "experience": 16,
                "fee": Decimal("95.00"),
                "availability": "Wed - Sun: 11:00 AM - 07:00 PM",
                "email": "dr.miller@mediswift.com",
                "phone": "+1 (555) 918-2837",
                "bio": "Senior Orthopedic consultant focusing on sports injuries, joint rehabilitation, arthritis therapeutics, and post-operative musculoskeletal recovery.",
                "rating": Decimal("4.89"),
                "image_url": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=500&auto=format&fit=crop&q=80",
            },
        ]

        doctors_created = 0
        for doc in doctors_data:
            obj, created = Doctor.objects.update_or_create(
                name=doc["name"],
                defaults=doc
            )
            if created:
                doctors_created += 1

        self.stdout.write(self.style.SUCCESS(f"[OK] Successfully seeded {len(doctors_data)} doctor profiles ({doctors_created} newly created)."))
        self.stdout.write(self.style.SUCCESS("==> Database seeding complete! Ready for Next.js frontend consumption."))
