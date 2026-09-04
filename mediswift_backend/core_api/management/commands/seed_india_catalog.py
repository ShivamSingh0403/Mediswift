"""
Django Management Command: seed_india_catalog
Generates an authentic 250-item Indian Enterprise Pharmacy Catalog for Mediswift Pro.
Includes realistic brand names, active chemical compositions (salts), INR pricing,
MRPs, Indian pharmaceutical manufacturers, and dynamic high-resolution medical imagery.
"""

from decimal import Decimal
import random
from django.core.management.base import BaseCommand
from django.db import transaction
from core_api.models import Medicine


class Command(BaseCommand):
    help = 'Seeds 250 realistic Indian pharmaceutical items into Mediswift Pro catalog'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('[SEEDER] Initializing 250-item India Healthcare Enterprise Catalog...'))

        # Pool of 35+ hyper-realistic, high-resolution Unsplash medical image assets
        IMAGE_POOLS = {
            'tablet': [
                'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=800&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=800&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=800&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=800&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1577401239170-897942555fb3?w=800&auto=format&fit=crop&q=80',
            ],
            'capsule': [
                'https://images.unsplash.com/photo-1550572017-4fcdbb59cc32?w=800&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?w=800&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=800&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=800&auto=format&fit=crop&q=80',
            ],
            'syrup': [
                'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1587854680352-936b22b91030?w=800&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1622227432807-91af5901f87e?w=800&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=800&auto=format&fit=crop&q=80',
            ],
            'ointment': [
                'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1563178406-4cdc2923acbc?w=800&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1608248597359-0a6722bc1d8c?w=800&auto=format&fit=crop&q=80',
            ],
            'drops': [
                'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=800&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=800&auto=format&fit=crop&q=80',
            ],
            'inhaler': [
                'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800&auto=format&fit=crop&q=80',
            ],
            'devices': [
                'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?w=800&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=800&auto=format&fit=crop&q=80',
            ],
            'wellness': [
                'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=800&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=800&auto=format&fit=crop&q=80',
            ],
        }

        # Authentic Indian Medicine Catalog Definition
        # Structured with real brands, identical salts for generic substitution, MRPs and INR prices.
        CATALOG_DATA = [
            # 1. Paracetamol (650mg) cluster (Smart Substitute Candidates)
            ("Dolo 650 Tablet", "otc", "tablet", "Paracetamol (650mg)", "Micro Labs Ltd", "Strip of 15 tablets", 34.00, 31.00, False, "Effective analgesic and antipyretic for fever, headache, body aches, and post-vaccination fever."),
            ("Calpol 650 Tablet", "otc", "tablet", "Paracetamol (650mg)", "GlaxoSmithKline Pharmaceuticals", "Strip of 15 tablets", 35.00, 30.50, False, "Fast acting antipyretic and pain reliever formulated with microfined paracetamol."),
            ("Crocin 650 Advance", "otc", "tablet", "Paracetamol (650mg)", "GlaxoSmithKline Consumer Healthcare", "Strip of 15 tablets", 36.50, 32.00, False, "Fast absorption formulation that begins releasing paracetamol in as little as 5 minutes."),
            ("Pacimol 650 Tablet", "otc", "tablet", "Paracetamol (650mg)", "Ipca Laboratories Ltd", "Strip of 15 tablets", 28.00, 22.00, False, "Affordable high-potency paracetamol for continuous fever relief and systemic muscular ache."),
            ("P-650 Tablet", "otc", "tablet", "Paracetamol (650mg)", "Apex Laboratories Pvt Ltd", "Strip of 10 tablets", 22.00, 17.50, False, "High-yield generic paracetamol equivalent providing rapid antipyretic relief."),

            # 2. Pantoprazole (40mg) Antacid Cluster (Substitutes)
            ("Pan 40 Tablet", "prescription", "tablet", "Pantoprazole (40mg)", "Alkem Laboratories Ltd", "Strip of 15 tablets", 175.00, 148.00, True, "Proton pump inhibitor that reduces stomach acid production, treating GERD and peptic ulcers."),
            ("Pantocid 40 Tablet", "prescription", "tablet", "Pantoprazole (40mg)", "Sun Pharmaceutical Industries", "Strip of 15 tablets", 182.00, 154.00, True, "Clinically proven gastro-resistant tablet for severe acid reflux and erosive esophagitis."),
            ("Pantop 40 Tablet", "prescription", "tablet", "Pantoprazole (40mg)", "Aristo Pharmaceuticals", "Strip of 15 tablets", 145.00, 118.00, True, "Cost-effective proton pump inhibitor for hyperacidity and stomach lining protection."),
            ("Pantodac 40 Tablet", "prescription", "tablet", "Pantoprazole (40mg)", "Zydus Cadila", "Strip of 15 tablets", 160.00, 130.00, True, "Suppresses gastric acid secretion through irreversible H+/K+ ATPase inhibition."),
            ("Pan-D Capsule", "prescription", "capsule", "Pantoprazole (40mg) + Domperidone (30mg)", "Alkem Laboratories Ltd", "Strip of 15 capsules", 215.00, 185.00, True, "Dual active formula for acid reflux accompanied by nausea, bloating, and gastroparesis."),
            ("Pantocid DSR Capsule", "prescription", "capsule", "Pantoprazole (40mg) + Domperidone (30mg)", "Sun Pharmaceutical Industries", "Strip of 15 capsules", 228.00, 195.00, True, "Sustained release antacid and prokinetic capsule alleviating morning reflux."),

            # 3. Calcium + Vitamin D3 Cluster (Substitutes)
            ("Shelcal 500 Tablet", "otc", "tablet", "Calcium (500mg) + Vitamin D3 (250 IU)", "Torrent Pharmaceuticals Ltd", "Strip of 15 tablets", 144.00, 122.00, False, "Premium elemental calcium with cholecalciferol for bone mineral density and osteoporosis."),
            ("Cipcal 500 Tablet", "otc", "tablet", "Calcium (500mg) + Vitamin D3 (250 IU)", "Cipla Ltd", "Strip of 15 tablets", 120.00, 99.00, False, "Bioavailable calcium carbonate supporting joint strength and skeletal maintenance."),
            ("Gemcal Capsule", "otc", "capsule", "Calcium (500mg) + Calcitriol (0.25mcg)", "Alkem Laboratories Ltd", "Strip of 15 capsules", 310.00, 260.00, False, "Active calcitriol metabolite formulation providing superior intestinal calcium absorption."),
            ("Calcimax 500 Tablet", "otc", "tablet", "Calcium (500mg) + Vitamin D3 (250 IU) + Zinc", "Meyer Organics Pvt Ltd", "Strip of 30 tablets", 265.00, 225.00, False, "Enriched with magnesium and zinc for comprehensive osteo-cellular support."),

            # 4. Azithromycin (500mg) Cluster (Substitutes)
            ("Azithral 500 Tablet", "prescription", "tablet", "Azithromycin (500mg)", "Alembic Pharmaceuticals Ltd", "Strip of 5 tablets", 132.00, 112.00, True, "Broad-spectrum macrolide antibiotic indicated for bacterial chest, throat, and skin infections."),
            ("Azee 500 Tablet", "prescription", "tablet", "Azithromycin (500mg)", "Cipla Ltd", "Strip of 5 tablets", 130.00, 108.00, True, "High-potency single-daily dose antibiotic for community-acquired respiratory infections."),
            ("Zady 500 Tablet", "prescription", "tablet", "Azithromycin (500mg)", "Mankind Pharma Ltd", "Strip of 5 tablets", 110.00, 89.00, True, "Affordable macrolide antibiotic ensuring complete microbiological clearance."),
            ("Azimax 500 Tablet", "prescription", "tablet", "Azithromycin (500mg)", "Torrent Pharmaceuticals", "Strip of 5 tablets", 125.00, 98.00, True, "High-tissue penetration antibiotic suitable for tonsillitis and sinus infections."),

            # 5. Amoxicillin + Clavulanic Acid 625mg (Substitutes)
            ("Augmentin 625 Duo Tablet", "prescription", "tablet", "Amoxicillin (500mg) + Clavulanic Acid (125mg)", "GlaxoSmithKline Pharmaceuticals", "Strip of 10 tablets", 223.00, 192.00, True, "Gold-standard beta-lactamase inhibitor combination for complex bacterial infections."),
            ("Moxikind-CV 625 Tablet", "prescription", "tablet", "Amoxicillin (500mg) + Clavulanic Acid (125mg)", "Mankind Pharma Ltd", "Strip of 10 tablets", 185.00, 149.00, True, "Cost-effective co-amoxiclav formulation with proven clinical bio-equivalence."),
            ("Clavam 625 Tablet", "prescription", "tablet", "Amoxicillin (500mg) + Clavulanic Acid (125mg)", "Alkem Laboratories Ltd", "Strip of 10 tablets", 218.00, 178.00, True, "Broad-spectrum coverage for ENT, respiratory, dental, and urinary tract infections."),

            # 6. Fexofenadine Anti-Allergy Cluster (Substitutes)
            ("Allegra 120mg Tablet", "otc", "tablet", "Fexofenadine (120mg)", "Sanofi India Ltd", "Strip of 10 tablets", 215.00, 185.00, False, "Non-drowsy 2nd generation antihistamine for seasonal allergic rhinitis and urticaria."),
            ("Fexova 120 Tablet", "otc", "tablet", "Fexofenadine (120mg)", "Intas Pharmaceuticals Ltd", "Strip of 10 tablets", 145.00, 115.00, False, "Generic non-sedating antihistamine for sneezing, runny nose, and itchy eyes."),
            ("Allegra 180mg Tablet", "prescription", "tablet", "Fexofenadine (180mg)", "Sanofi India Ltd", "Strip of 10 tablets", 255.00, 220.00, True, "Maximum strength 24-hour relief from chronic idiopathic urticaria and persistent allergy."),
            ("Fexigra 180 Tablet", "prescription", "tablet", "Fexofenadine (180mg)", "Cipla Ltd", "Strip of 10 tablets", 190.00, 155.00, True, "Fast-acting relief from severe allergic skin flare-ups without central sedation."),

            # 7. Montelukast + Levocetirizine Cluster
            ("Montair LC Tablet", "prescription", "tablet", "Montelukast (10mg) + Levocetirizine (5mg)", "Cipla Ltd", "Strip of 10 tablets", 205.00, 172.00, True, "Synergistic leukotriene receptor antagonist and antihistamine for asthma and allergic bronchitis."),
            ("Telekast-L Tablet", "prescription", "tablet", "Montelukast (10mg) + Levocetirizine (5mg)", "Lupin Ltd", "Strip of 10 tablets", 195.00, 160.00, True, "Prevents nocturnal asthma symptoms and all-day allergic nasal congestion."),
            ("Montek-LC Tablet", "prescription", "tablet", "Montelukast (10mg) + Levocetirizine (5mg)", "Sun Pharmaceutical Industries", "Strip of 10 tablets", 210.00, 175.00, True, "Combats allergic airway inflammation and bronchial hyperreactivity."),

            # 8. Hypertension & Cardiac Care (Telmisartan Cluster)
            ("Telma 40 Tablet", "prescription", "tablet", "Telmisartan (40mg)", "Glenmark Pharmaceuticals Ltd", "Strip of 30 tablets", 280.00, 235.00, True, "Angiotensin receptor blocker providing smooth 24-hour blood pressure reduction."),
            ("Telmikind 40 Tablet", "prescription", "tablet", "Telmisartan (40mg)", "Mankind Pharma Ltd", "Strip of 10 tablets", 55.00, 42.00, True, "Economical once-daily antihypertensive protecting renal function in diabetics."),
            ("Telvas 40 Tablet", "prescription", "tablet", "Telmisartan (40mg)", "Aristo Pharmaceuticals", "Strip of 15 tablets", 115.00, 92.00, True, "Well-tolerated cardiovascular protection reducing stroke and myocardial risks."),
            ("Telma-H Tablet", "prescription", "tablet", "Telmisartan (40mg) + Hydrochlorothiazide (12.5mg)", "Glenmark Pharmaceuticals Ltd", "Strip of 15 tablets", 198.00, 168.00, True, "Combination diuretic therapy for resistant essential hypertension."),
            ("Telma-AM Tablet", "prescription", "tablet", "Telmisartan (40mg) + Amlodipine (5mg)", "Glenmark Pharmaceuticals Ltd", "Strip of 15 tablets", 210.00, 179.00, True, "Dual mechanism ARB and calcium channel blocker for enhanced vascular relaxation."),

            # 9. Atorvastatin Cluster (Cholesterol)
            ("Atorva 20 Tablet", "prescription", "tablet", "Atorvastatin (20mg)", "Zydus Cadila", "Strip of 15 tablets", 285.00, 238.00, True, "HMG-CoA reductase inhibitor lowering LDL bad cholesterol and cardiovascular risk."),
            ("Storvas 20 Tablet", "prescription", "tablet", "Atorvastatin (20mg)", "Sun Pharmaceutical Industries", "Strip of 15 tablets", 295.00, 245.00, True, "Potent lipid-lowering statin stabilizing atherosclerotic plaques."),
            ("Atorlip 20 Tablet", "prescription", "tablet", "Atorvastatin (20mg)", "Cipla Ltd", "Strip of 15 tablets", 270.00, 220.00, True, "Clinical statin therapy for dyslipidemia and secondary coronary prevention."),

            # 10. Diabetes - Metformin + Glimepiride Cluster
            ("Glycomet GP2 Tablet", "prescription", "tablet", "Glimepiride (2mg) + Metformin (500mg)", "USV Pvt Ltd", "Strip of 15 tablets", 168.00, 139.00, True, "Proven dual oral anti-diabetic formulation controlling both fasting and postprandial glucose."),
            ("Amaryl M2 Tablet", "prescription", "tablet", "Glimepiride (2mg) + Metformin (500mg)", "Sanofi India Ltd", "Strip of 15 tablets", 215.00, 182.00, True, "Original research brand for effective long-term glycemic control in Type 2 Diabetes."),
            ("Gluconorm-G 2 Forte", "prescription", "tablet", "Glimepiride (2mg) + Metformin (1000mg)", "Lupin Ltd", "Strip of 15 tablets", 210.00, 172.00, True, "High-strength sustained-release biguanide and sulfonylurea for glycemic target achievement."),
            ("Glycomet 500 SR Tablet", "prescription", "tablet", "Metformin (500mg)", "USV Pvt Ltd", "Strip of 20 tablets", 58.00, 48.00, True, "First-line sustained release insulin sensitizer with reduced GI side effects."),
            ("Januvia 100mg Tablet", "prescription", "tablet", "Sitagliptin (100mg)", "MSD Pharmaceuticals Pvt Ltd", "Strip of 7 tablets", 345.00, 310.00, True, "Incretin enhancer DPP-4 inhibitor providing glucose-dependent insulin release."),

            # 11. Pain Relief Gels & Sprays (Dosage Form: ointment)
            ("Volini Pain Relief Gel", "otc", "ointment", "Diclofenac Diethylamine (1.16%) + Linseed Oil + Menthol", "Sun Pharmaceutical Industries", "Tube of 75g", 195.00, 165.00, False, "Fast absorbing nanogel providing deep penetrating relief from backache, sprains, and joint pain."),
            ("Moov Pain Relief Cream", "otc", "ointment", "Oil of Wintergreen + Mint Extract + Turpentine Oil", "Reckitt Benckiser", "Tube of 50g", 175.00, 149.00, False, "100% Ayurvedic fast pain formula with 4 active herbal ingredients for muscular spasms."),
            ("Omnigel Pain Relief Gel", "otc", "ointment", "Diclofenac Diethylamine (1.16%) + Virgin Linseed Oil", "Cipla Ltd", "Tube of 50g", 135.00, 112.00, False, "Affordable anti-inflammatory gel targeting inflamed joint tissues and post-workout soreness."),
            ("Volini Pain Relief Spray", "otc", "ointment", "Diclofenac Diethylamine + Methyl Salicylate", "Sun Pharmaceutical Industries", "Can of 100g", 240.00, 205.00, False, "360-degree micro-spray nozzle delivering instant cooling and analgesic mist to muscle pulls."),

            # 12. Cough & Bronchial Syrups (Dosage Form: syrup)
            ("Ascoril LS Syrup", "prescription", "syrup", "Levosalbutamol (1mg) + Ambroxol (30mg) + Guaiphenesin (50mg)", "Glenmark Pharmaceuticals Ltd", "Bottle of 100ml", 128.00, 108.00, True, "Triple-action expectorant, bronchodilator, and mucolytic for chesty and productive wet cough."),
            ("Chericof Syrup", "otc", "syrup", "Dextromethorphan (10mg) + Chlorpheniramine (2mg) + Phenylephrine (5mg)", "Sun Pharmaceutical Industries", "Bottle of 100ml", 115.00, 98.00, False, "Effective relief from allergic, irritating dry hacking cough and throat tickle."),
            ("Benadryl Cough Formula Syrup", "otc", "syrup", "Diphenhydramine (14.08mg) + Ammonium Chloride (138mg)", "Johnson & Johnson Ltd", "Bottle of 150ml", 145.00, 126.00, False, "Classic trusted cough sedative and soothing syrup easing throat irritation and nighttime coughing."),
            ("Grilinctus Syrup", "prescription", "syrup", "Dextromethorphan + Chlorpheniramine + Guaiphenesin", "Franco-Indian Pharmaceuticals", "Bottle of 100ml", 125.00, 106.00, True, "Dual action formula clearing chest congestion and calming cough spasms."),
            ("Alex Cough Syrup", "otc", "syrup", "Dextromethorphan (10mg) + Chlorpheniramine (2mg)", "Glenmark Pharmaceuticals Ltd", "Bottle of 100ml", 122.00, 102.00, False, "Non-drowsy formulation suppressing non-productive dry cough episodes."),

            # 13. Topicals, Creams & First Aid (Dosage Form: ointment)
            ("Betadine 10% Solution", "otc", "syrup", "Povidone Iodine (10% w/v)", "Win-Medicare Pvt Ltd", "Bottle of 100ml", 145.00, 122.00, False, "Gold standard antiseptic solution for wound disinfection, cuts, burns, and post-surgical care."),
            ("Betadine 10% Ointment", "otc", "ointment", "Povidone Iodine (10% w/w)", "Win-Medicare Pvt Ltd", "Tube of 20g", 85.00, 72.00, False, "Broad spectrum microbicidal ointment preventing infection in minor wounds and burns."),
            ("Cipladine 5% Ointment", "otc", "ointment", "Povidone Iodine (5% w/w)", "Cipla Ltd", "Tube of 20g", 48.00, 39.00, False, "Budget-friendly antiseptic ointment preventing pathogenic bacterial colonization."),
            ("Candid-B Cream", "prescription", "ointment", "Clotrimazole (1%) + Beclomethasone (0.025%)", "Glenmark Pharmaceuticals Ltd", "Tube of 20g", 165.00, 139.00, True, "Dual antifungal and anti-inflammatory cream for fungal skin infections and intense itching."),
            ("Soframycin Skin Cream", "otc", "ointment", "Framycetin Sulfate (1%)", "Sanofi India Ltd", "Tube of 30g", 62.00, 52.00, False, "Topical antibiotic cream effective against burns, scalds, ulcers, and superficial wounds."),

            # 14. Essential Vitamins & Clinical Supplements
            ("Becosules Capsules", "wellness", "capsule", "Vitamin B-Complex + Vitamin C", "Pfizer Ltd", "Strip of 20 capsules", 55.00, 46.00, False, "Complete Vitamin B-complex enriched with Vitamin C for oral ulcers, fatigue, and cellular repair."),
            ("Neurobion Forte Tablet", "wellness", "tablet", "Vitamin B1 + B6 + B12", "Procter & Gamble Health Ltd", "Strip of 30 tablets", 44.00, 36.00, False, "Essential neurotropic B vitamins rejuvenating nerve health and relieving numbness and tingling."),
            ("Evion 400mg Capsule", "wellness", "capsule", "Vitamin E (400mg)", "Procter & Gamble Health Ltd", "Strip of 10 capsules", 38.00, 32.00, False, "Pure tocopheryl acetate antioxidant supporting cellular integrity, glowing skin, and hair vitality."),
            ("Limcee 500mg Chewable", "wellness", "tablet", "Ascorbic Acid (Vitamin C 500mg)", "Abbott Healthcare Pvt Ltd", "Strip of 15 tablets", 26.00, 21.00, False, "Tasty orange-flavoured Vitamin C chewables for enhanced collagen synthesis and daily immunity."),
            ("Zincovit Tablet", "wellness", "tablet", "Multivitamins + Multiminerals + Zinc", "Apex Laboratories Pvt Ltd", "Strip of 15 tablets", 115.00, 96.00, False, "Comprehensive dietary supplement providing vital micronutrients and immune support."),
            ("Uprise-D3 60K Capsule", "wellness", "capsule", "Cholecalciferol (Vitamin D3 60,000 IU)", "Alkem Laboratories Ltd", "Strip of 4 capsules", 135.00, 114.00, False, "Mega-dose weekly Vitamin D3 therapy restoring bone mineral density and hormonal wellness."),

            # 15. Inhalers & Respiratory Devices
            ("Asthalin Inhaler 100mcg", "prescription", "inhaler", "Salbutamol (100mcg per actuation)", "Cipla Ltd", "CFC-Free Device of 200 actuations", 168.00, 142.00, True, "Fast-acting rescue bronchodilator for acute wheezing, bronchospasm, and asthma attacks."),
            ("Budecort 200 Inhaler", "prescription", "inhaler", "Budesonide (200mcg per actuation)", "Cipla Ltd", "Inhaler of 200 metered doses", 395.00, 335.00, True, "Anti-inflammatory corticosteroid controller reducing bronchial swelling and chronic asthma."),
            ("Foracort 200 Inhaler", "prescription", "inhaler", "Formoterol (6mcg) + Budesonide (200mcg)", "Cipla Ltd", "Inhaler of 120 metered doses", 485.00, 415.00, True, "Dual long-acting beta2-agonist and inhaled corticosteroid for severe asthma and COPD maintenance."),

            # 16. Diagnostic & Home Care Devices
            ("Accu-Chek Active Test Strips", "devices", "devices", "Glucose Dehydrogenase Reagent Strips", "Roche Diabetes Care", "Box of 50 strips", 1025.00, 895.00, False, "High-precision blood glucose monitoring test strips compatible with Accu-Chek Active meters."),
            ("OneTouch Select Plus Strips", "devices", "devices", "Biosensor Blood Glucose Strips", "LifeScan Medical Devices", "Box of 50 strips", 1150.00, 990.00, False, "Accurate test strips featuring ColorSure technology for rapid diabetic blood sugar tracking."),
            ("Omron HEM 7120 BP Monitor", "devices", "devices", "Digital Oscillometric Pressure Sensor", "Omron Healthcare", "Complete Unit with Cuff", 2490.00, 1999.00, False, "Clinically validated automatic blood pressure monitor with hypertension indicator and cuff wrapping guide."),
            ("Dr. Trust Fingertip Pulse Oximeter", "devices", "devices", "Dual-Wavelength Optical Sensor", "Dr. Trust USA / India", "1 Unit with Lanyard & Batteries", 1850.00, 1299.00, False, "Real-time SpO2 blood oxygen saturation and pulse rate monitor with OLED display."),
        ]

        # Additional systematic generation to reach exactly 250 enterprise entries
        # Realistic templates modeled on authentic Indian pharmaceutical patterns:
        INDIAN_PHARMA_BRANDS = [
            # Brand root, category, form, active salt, manufacturer, packaging, base MRP, req_rx
            ("Telma-CT", "prescription", "tablet", "Telmisartan (40mg) + Chlorthalidone (12.5mg)", "Glenmark Pharmaceuticals", "Strip of 15 tablets", 220.0, True),
            ("Cilacar 10", "prescription", "tablet", "Cilnidipine (10mg)", "J.B. Chemicals & Pharmaceuticals", "Strip of 15 tablets", 148.0, True),
            ("Cilacar 20", "prescription", "tablet", "Cilnidipine (20mg)", "J.B. Chemicals & Pharmaceuticals", "Strip of 15 tablets", 235.0, True),
            ("Amlong 5", "prescription", "tablet", "Amlodipine (5mg)", "Micro Labs Ltd", "Strip of 15 tablets", 45.0, True),
            ("Amlong 10", "prescription", "tablet", "Amlodipine (10mg)", "Micro Labs Ltd", "Strip of 15 tablets", 75.0, True),
            ("Nebicard 5", "prescription", "tablet", "Nebivolol (5mg)", "Torrent Pharmaceuticals", "Strip of 10 tablets", 138.0, True),
            ("Concor 5", "prescription", "tablet", "Bisoprolol Fumarate (5mg)", "Merck Ltd", "Strip of 10 tablets", 125.0, True),
            ("Ecosprin 75", "prescription", "tablet", "Aspirin (75mg)", "USV Pvt Ltd", "Strip of 14 tablets", 6.20, True),
            ("Ecosprin 150", "prescription", "tablet", "Aspirin (150mg)", "USV Pvt Ltd", "Strip of 14 tablets", 11.50, True),
            ("Rosuvas 10", "prescription", "tablet", "Rosuvastatin (10mg)", "Sun Pharmaceutical Industries", "Strip of 15 tablets", 280.0, True),
            ("Rosuvas 20", "prescription", "tablet", "Rosuvastatin (20mg)", "Sun Pharmaceutical Industries", "Strip of 15 tablets", 440.0, True),
            ("Lipaglyn", "prescription", "tablet", "Saroglitazar (4mg)", "Zydus Cadila", "Strip of 10 tablets", 320.0, True),
            ("Galvus Met 50/500", "prescription", "tablet", "Vildagliptin (50mg) + Metformin (500mg)", "Novartis India Ltd", "Strip of 14 tablets", 360.0, True),
            ("Jardiance 10", "prescription", "tablet", "Empagliflozin (10mg)", "Boehringer Ingelheim", "Strip of 10 tablets", 540.0, True),
            ("Jardiance 25", "prescription", "tablet", "Empagliflozin (25mg)", "Boehringer Ingelheim", "Strip of 10 tablets", 690.0, True),
            ("Forxiga 10", "prescription", "tablet", "Dapagliflozin (10mg)", "AstraZeneca India", "Strip of 14 tablets", 780.0, True),
            ("Rybelsus 3mg", "prescription", "tablet", "Semaglutide (3mg)", "Novo Nordisk India", "Strip of 10 tablets", 3100.0, True),
            ("Thyronorm 25mcg", "prescription", "tablet", "Thyroxine Sodium (25mcg)", "Abbott Healthcare", "Bottle of 120 tablets", 160.0, True),
            ("Thyronorm 50mcg", "prescription", "tablet", "Thyroxine Sodium (50mcg)", "Abbott Healthcare", "Bottle of 120 tablets", 195.0, True),
            ("Thyronorm 75mcg", "prescription", "tablet", "Thyroxine Sodium (75mcg)", "Abbott Healthcare", "Bottle of 120 tablets", 220.0, True),
            ("Thyronorm 100mcg", "prescription", "tablet", "Thyroxine Sodium (100mcg)", "Abbott Healthcare", "Bottle of 120 tablets", 245.0, True),
            ("Eltroxin 50mcg", "prescription", "tablet", "Thyroxine Sodium (50mcg)", "GlaxoSmithKline Pharmaceuticals", "Bottle of 120 tablets", 190.0, True),
            ("Omez 20", "prescription", "capsule", "Omeprazole (20mg)", "Dr. Reddy's Laboratories", "Strip of 20 capsules", 65.0, True),
            ("Ocid 20", "prescription", "capsule", "Omeprazole (20mg)", "Zydus Cadila", "Strip of 15 capsules", 55.0, True),
            ("Razo 20", "prescription", "tablet", "Rabeprazole (20mg)", "Dr. Reddy's Laboratories", "Strip of 15 tablets", 190.0, True),
            ("Rabekind-DSR", "prescription", "capsule", "Rabeprazole (20mg) + Domperidone (30mg)", "Mankind Pharma Ltd", "Strip of 10 capsules", 145.0, True),
            ("Gelusil MPS Syrup", "otc", "syrup", "Aluminium Hydroxide + Magnesium Hydroxide + Simethicone", "Pfizer Ltd", "Bottle of 200ml", 142.0, False),
            ("Digene Mint Gel", "otc", "syrup", "Dried Aluminium Hydroxide + Magnesium Hydroxide", "Abbott Healthcare", "Bottle of 200ml", 152.0, False),
            ("Digene Orange Tablets", "otc", "tablet", "Magnesium Hydroxide + Simethicone", "Abbott Healthcare", "Strip of 15 chewable tablets", 32.0, False),
            ("Cremaffin Mixed Fruit", "otc", "syrup", "Liquid Paraffin + Milk of Magnesia", "Abbott Healthcare", "Bottle of 225ml", 265.0, False),
            ("Duphalac Syrup", "prescription", "syrup", "Lactulose (10g/15ml)", "Abbott Healthcare", "Bottle of 150ml", 295.0, True),
            ("Eldoper Capsule", "prescription", "capsule", "Loperamide (2mg)", "Micro Labs Ltd", "Strip of 10 capsules", 24.0, True),
            ("Econorm Sachet", "otc", "powder", "Saccharomyces Boulardii (250mg)", "Dr. Reddy's Laboratories", "Sachet of 1g", 48.0, False),
            ("Sporlac-DS Tablet", "otc", "tablet", "Lactic Acid Bacillus (120 million spores)", "Sanzyme Ltd", "Strip of 20 tablets", 140.0, False),
            ("Zerodol-SP", "prescription", "tablet", "Aceclofenac (100mg) + Paracetamol (325mg) + Serratiopeptidase (15mg)", "Ipca Laboratories Ltd", "Strip of 10 tablets", 124.0, True),
            ("Zerodol-P", "prescription", "tablet", "Aceclofenac (100mg) + Paracetamol (325mg)", "Ipca Laboratories Ltd", "Strip of 10 tablets", 72.0, True),
            ("Zerodol-TH 4", "prescription", "tablet", "Aceclofenac (100mg) + Thiocolchicoside (4mg)", "Ipca Laboratories Ltd", "Strip of 10 tablets", 225.0, True),
            ("Combiflam Tablet", "otc", "tablet", "Ibuprofen (400mg) + Paracetamol (325mg)", "Sanofi India Ltd", "Strip of 20 tablets", 48.0, False),
            ("Meftal-Spas Tablet", "prescription", "tablet", "Mefenamic Acid (250mg) + Dicyclomine (10mg)", "Blue Cross Laboratories", "Strip of 10 tablets", 54.0, True),
            ("Meftal 500 Tablet", "prescription", "tablet", "Mefenamic Acid (500mg)", "Blue Cross Laboratories", "Strip of 10 tablets", 38.0, True),
            ("Ultracet Tablet", "prescription", "tablet", "Tramadol (37.5mg) + Paracetamol (325mg)", "Janssen Pharmaceuticals", "Strip of 15 tablets", 320.0, True),
            ("Voveran 50 GE", "prescription", "tablet", "Diclofenac Sodium (50mg)", "Novartis India Ltd", "Strip of 15 tablets", 92.0, True),
            ("Voveran SR 100", "prescription", "tablet", "Diclofenac Sodium (100mg)", "Novartis India Ltd", "Strip of 15 tablets", 175.0, True),
            ("Taxim-O 200", "prescription", "tablet", "Cefixime (200mg)", "Alkem Laboratories Ltd", "Strip of 10 tablets", 185.0, True),
            ("Mahacef 200", "prescription", "tablet", "Cefixime (200mg)", "Mankind Pharma Ltd", "Strip of 10 tablets", 145.0, True),
            ("Zifi 200", "prescription", "tablet", "Cefixime (200mg)", "FDC Ltd", "Strip of 10 tablets", 178.0, True),
            ("Cifran 500", "prescription", "tablet", "Ciprofloxacin (500mg)", "Sun Pharmaceutical Industries", "Strip of 10 tablets", 46.0, True),
            ("Ciplox 500", "prescription", "tablet", "Ciprofloxacin (500mg)", "Cipla Ltd", "Strip of 10 tablets", 44.0, True),
            ("Oflox 200", "prescription", "tablet", "Ofloxacin (200mg)", "Cipla Ltd", "Strip of 10 tablets", 78.0, True),
            ("Zenflox-OZ", "prescription", "tablet", "Ofloxacin (200mg) + Ornidazole (500mg)", "Mankind Pharma Ltd", "Strip of 10 tablets", 125.0, True),
            ("Norflox 400", "prescription", "tablet", "Norfloxacin (400mg)", "Cipla Ltd", "Strip of 10 tablets", 84.0, True),
            ("Doxy-1 L-DR Forte", "prescription", "capsule", "Doxycycline (100mg) + Lactobacillus", "USV Pvt Ltd", "Strip of 10 capsules", 128.0, True),
            ("Monocef 1g Injection", "prescription", "injection", "Ceftriaxone (1000mg)", "Aristo Pharmaceuticals", "Vial of 1 Unit", 68.0, True),
            ("Monocef-O 200", "prescription", "tablet", "Cefpodoxime Proxetil (200mg)", "Aristo Pharmaceuticals", "Strip of 10 tablets", 225.0, True),
            ("Gudcef 200", "prescription", "tablet", "Cefpodoxime Proxetil (200mg)", "Mankind Pharma Ltd", "Strip of 10 tablets", 175.0, True),
            ("Cepodem 200", "prescription", "tablet", "Cefpodoxime Proxetil (200mg)", "Ranbaxy / Sun Pharma", "Strip of 10 tablets", 230.0, True),
            ("Levolin Inhaler 50mcg", "prescription", "inhaler", "Levosalbutamol (50mcg)", "Cipla Ltd", "200 Metered Doses", 195.0, True),
            ("Duolin Inhaler", "prescription", "inhaler", "Levosalbutamol + Ipratropium Bromide", "Cipla Ltd", "200 Metered Doses", 380.0, True),
            ("Aerocort Inhaler", "prescription", "inhaler", "Levosalbutamol + Beclomethasone", "Cipla Ltd", "200 Metered Doses", 310.0, True),
            ("Mucinac 600 Effervescent", "prescription", "tablet", "Acetylcysteine (600mg)", "Cipla Ltd", "Strip of 10 effervescent tablets", 295.0, True),
            ("Bactoclav 625", "prescription", "tablet", "Amoxicillin (500mg) + Clavulanic Acid (125mg)", "Micro Labs Ltd", "Strip of 6 tablets", 120.0, True),
            ("Cefakind 500", "prescription", "tablet", "Cefuroxime Axetil (500mg)", "Mankind Pharma Ltd", "Strip of 10 tablets", 440.0, True),
            ("Ceftum 500", "prescription", "tablet", "Cefuroxime Axetil (500mg)", "GlaxoSmithKline Pharmaceuticals", "Strip of 4 tablets", 325.0, True),
            ("Clindac A Gel", "prescription", "ointment", "Clindamycin Phosphate (1% w/w)", "Alkem Laboratories Ltd", "Tube of 20g", 210.0, True),
            ("Sebogel Salicylic Acid Gel", "otc", "ointment", "Salicylic Acid (2%) + Nicotinamide (6%)", "Apex Laboratories Pvt Ltd", "Tube of 30g", 280.0, False),
            ("Tretin 0.025% Cream", "prescription", "ointment", "Tretinoin (0.025% w/w)", "Hegde & Hegde Pharmaceutica", "Tube of 20g", 215.0, True),
            ("Tretin 0.05% Cream", "prescription", "ointment", "Tretinoin (0.05% w/w)", "Hegde & Hegde Pharmaceutica", "Tube of 20g", 260.0, True),
            ("Moiz Cleansing Lotion", "personal_care", "syrup", "Cetyl Alcohol + Stearyl Alcohol", "Glowderma Labs", "Bottle of 200ml", 360.0, False),
            ("Cetaphil Gentle Cleanser", "personal_care", "syrup", "Niacinamide + Panthenol + Glycerin", "Galderma India", "Bottle of 125ml", 395.0, False),
            ("Sebamed Clear Face Gel", "personal_care", "ointment", "Hyaluronic Acid + Aloe Barbadensis", "Sebapharma / USV", "Tube of 50ml", 475.0, False),
            ("Otrivin Oxy Fast Relief", "otc", "drops", "Oxymetazoline (0.05%)", "GlaxoSmithKline Consumer Healthcare", "Bottle of 10ml", 105.0, False),
            ("Nasivion Classic Drops", "otc", "drops", "Oxymetazoline (0.05%)", "Procter & Gamble Health Ltd", "Bottle of 10ml", 112.0, False),
            ("Refresh Tears Eye Drops", "otc", "drops", "Carboxymethylcellulose (0.5%)", "Allergan India Pvt Ltd", "Vial of 10ml", 165.0, False),
            ("Systane Ultra Eye Drops", "otc", "drops", "Polyethylene Glycol + Propylene Glycol", "Alcon Laboratories", "Vial of 10ml", 440.0, False),
            ("Ciplox Eye/Ear Drops", "prescription", "drops", "Ciprofloxacin (0.3% w/v)", "Cipla Ltd", "Vial of 10ml", 22.0, True),
            ("Waxolve Ear Drops", "otc", "drops", "Paradichlorobenzene + Benzocaine + Chlorbutol", "Wallace Pharmaceuticals", "Bottle of 10ml", 95.0, False),
            ("Solspre Nasal Spray", "otc", "drops", "Isotonic Sodium Chloride (0.65%)", "Canixa Life Sciences", "Bottle of 50ml", 185.0, False),
            ("Bilashine 20 Tablet", "prescription", "tablet", "Bilastine (20mg)", "Sun Pharmaceutical Industries", "Strip of 10 tablets", 175.0, True),
            ("Bilaxten 20 Tablet", "prescription", "tablet", "Bilastine (20mg)", "Dr. Reddy's Laboratories", "Strip of 10 tablets", 195.0, True),
            ("Levocet 5 Tablet", "otc", "tablet", "Levocetirizine (5mg)", "Hetero Healthcare Ltd", "Strip of 10 tablets", 45.0, False),
            ("Vozet 5 Tablet", "otc", "tablet", "Levocetirizine (5mg)", "Glenmark Pharmaceuticals", "Strip of 10 tablets", 58.0, False),
            ("Okacet Tablet", "otc", "tablet", "Cetirizine (10mg)", "Cipla Ltd", "Strip of 10 tablets", 24.0, False),
            ("Cetzine Tablet", "otc", "tablet", "Cetirizine (10mg)", "Dr. Reddy's Laboratories", "Strip of 10 tablets", 26.0, False),
            ("Avil 25 Tablet", "otc", "tablet", "Pheniramine Maleate (25mg)", "Sanofi India Ltd", "Strip of 15 tablets", 14.5, False),
            ("Stemetil 5 Tablet", "prescription", "tablet", "Prochlorperazine Maleate (5mg)", "Abbott Healthcare", "Strip of 10 tablets", 85.0, True),
            ("Vertin 16 Tablet", "prescription", "tablet", "Betahistine Dihydrochloride (16mg)", "Abbott Healthcare", "Strip of 15 tablets", 310.0, True),
            ("Vertin 24 Tablet", "prescription", "tablet", "Betahistine Dihydrochloride (24mg)", "Abbott Healthcare", "Strip of 15 tablets", 440.0, True),
            ("Stugeron 25 Tablet", "prescription", "tablet", "Cinnarizine (25mg)", "Johnson & Johnson Ltd", "Strip of 25 tablets", 215.0, True),
            ("Flunarin 10 Tablet", "prescription", "tablet", "Flunarizine (10mg)", "FDC Ltd", "Strip of 10 tablets", 75.0, True),
            ("Suminat 50 Tablet", "prescription", "tablet", "Sumatriptan (50mg)", "Sun Pharmaceutical Industries", "Strip of 2 tablets", 185.0, True),
            ("Nexpro 40 Tablet", "prescription", "tablet", "Esomeprazole (40mg)", "Torrent Pharmaceuticals", "Strip of 15 tablets", 175.0, True),
            ("Nexpro-L Capsule", "prescription", "capsule", "Esomeprazole (40mg) + Levosulpiride (75mg)", "Torrent Pharmaceuticals", "Strip of 15 capsules", 265.0, True),
            ("Sompraz D 40", "prescription", "capsule", "Esomeprazole (40mg) + Domperidone (30mg)", "Sun Pharmaceutical Industries", "Strip of 15 capsules", 235.0, True),
            ("Sucrafil Suspension", "prescription", "syrup", "Sucralfate (1000mg/5ml)", "Fourrts Laboratories", "Bottle of 200ml", 245.0, True),
            ("Pegclear Oral Solution", "prescription", "syrup", "Polyethylene Glycol + Electrolytes", "Zydus Cadila", "Bottle of 200ml", 365.0, True),
            ("Udiliv 300 Tablet", "prescription", "tablet", "Ursodeoxycholic Acid (300mg)", "Abbott Healthcare", "Strip of 15 tablets", 590.0, True),
            ("Liv 52 DS Tablet", "wellness", "tablet", "Himsra + Kasani Liver Protective Herbal Extract", "Himalaya Wellness", "Bottle of 60 tablets", 180.0, False),
            ("Liv 52 Syrup", "wellness", "syrup", "Himsra + Kasani Herbal Hepatic Tonic", "Himalaya Wellness", "Bottle of 200ml", 165.0, False),
            ("Septilin Tablet", "wellness", "tablet", "Guggulu + Yashtimadhu Herbal Immune Modulator", "Himalaya Wellness", "Bottle of 60 tablets", 175.0, False),
            ("Cystone Tablet", "wellness", "tablet", "Didymocarpus Pedicellata + Saxifraga Ligulata", "Himalaya Wellness", "Bottle of 60 tablets", 175.0, False),
            ("Koflet Syrup", "wellness", "syrup", "Madhu + Tulasi + Yashtimadhu Herbal Cough Reliever", "Himalaya Wellness", "Bottle of 100ml", 110.0, False),
            ("Chyavanaprasha Special", "wellness", "syrup", "Amla + 40 Vital Ayurvedic Herbs", "Dabur India Ltd", "Jar of 1kg", 425.0, False),
            ("Dabur Honitus Cough Syrup", "wellness", "syrup", "Tulsi + Mulethi + Banapsha + Honey", "Dabur India Ltd", "Bottle of 100ml", 115.0, False),
            ("Dabur Pudin Hara Pearls", "wellness", "capsule", "Mentha Piperita (Pudina Satva)", "Dabur India Ltd", "Strip of 10 pearls", 30.0, False),
            ("Revital H Daily Health", "wellness", "capsule", "Ginseng + 10 Vitamins + 9 Minerals", "Sun Pharmaceutical Industries", "Pack of 30 capsules", 330.0, False),
            ("Revital H Woman Tablet", "wellness", "tablet", "Ginseng + Iron + Calcium + Vitamin D", "Sun Pharmaceutical Industries", "Pack of 30 tablets", 365.0, False),
            ("Supradyn Daily Multivitamin", "wellness", "tablet", "12 Vitamins + 5 Minerals + Amino Acids", "Bayer Pharmaceuticals", "Strip of 15 tablets", 62.0, False),
            ("Caripill 1100mg Tablet", "wellness", "tablet", "Carica Papaya Leaf Extract (1100mg)", "Micro Labs Ltd", "Strip of 15 tablets", 540.0, False),
            ("Platimax Tablet", "wellness", "tablet", "Carica Papaya + Tinospora Cordifolia", "Mankind Pharma Ltd", "Strip of 15 tablets", 420.0, False),
            ("Kenacort 0.1% Paste", "prescription", "ointment", "Triamcinolone Acetonide (0.1%)", "Abbott Healthcare", "Tube of 5g", 145.0, True),
            ("Dologel CT Gel", "otc", "ointment", "Choline Salicylate + Lidocaine", "Dr. Reddy's Laboratories", "Tube of 10g", 98.0, False),
            ("Zytee RB Gel", "otc", "ointment", "Choline Salicylate + Benzalkonium Chloride", "Raptakos Brett", "Tube of 10ml", 112.0, False),
            ("Burnol Antiseptic Cream", "otc", "ointment", "Aminacrine HCL + Cetrimide", "Morepen Laboratories", "Tube of 20g", 85.0, False),
            ("Meganeuron Forte Capsule", "wellness", "capsule", "Methylcobalamin (1500mcg) + Alpha Lipoic Acid", "Aristo Pharmaceuticals", "Strip of 10 capsules", 195.0, False),
            ("Nurokind-Plus RF", "wellness", "capsule", "Mecobalamin (1500mcg) + Pyridoxine + Folic Acid", "Mankind Pharma Ltd", "Strip of 10 capsules", 125.0, False),
            ("Folvite 5mg Tablet", "wellness", "tablet", "Folic Acid (5mg)", "Pfizer Ltd", "Strip of 45 tablets", 75.0, False),
            ("Autrin Capsule", "wellness", "capsule", "Ferrous Fumarate + Vitamin B12 + Folic Acid", "Pfizer Ltd", "Strip of 30 capsules", 210.0, False),
            ("Orofer XT Tablet", "wellness", "tablet", "Ferrous Ascorbate (100mg) + Folic Acid (1.5mg)", "Emcure Pharmaceuticals", "Strip of 10 tablets", 190.0, False),
            ("Livogen-Z Captab", "wellness", "tablet", "Ferrous Fumarate + Folic Acid + Zinc Sulfate", "Merck / Procter & Gamble", "Strip of 15 tablets", 92.0, False),
            ("Dexorange Syrup", "wellness", "syrup", "Ferric Ammonium Citrate + Cyanocobalamin", "Franco-Indian Pharmaceuticals", "Bottle of 200ml", 168.0, False),
            ("Cheri Syrup", "wellness", "syrup", "Iron + Folic Acid + Vitamin B12", "Alkem Laboratories Ltd", "Bottle of 200ml", 175.0, False),
            ("Celin 500 Tablet", "wellness", "tablet", "Vitamin C (500mg)", "GlaxoSmithKline Pharmaceuticals", "Strip of 25 tablets", 42.0, False),
            ("Suckcee 500mg Chewable", "wellness", "tablet", "Vitamin C (500mg) Orange Flavour", "Mankind Pharma Ltd", "Strip of 15 chewable tablets", 22.0, False),
            ("Calcirol Sachet", "wellness", "powder", "Cholecalciferol (60,000 IU)", "Cadila Pharmaceuticals", "Sachet of 1g", 48.0, False),
            ("D-Rise 60K Capsule", "wellness", "capsule", "Cholecalciferol (60,000 IU)", "USV Pvt Ltd", "Strip of 4 capsules", 140.0, False),
            ("Tay D3 60K Oral Drops", "wellness", "drops", "Cholecalciferol (400 IU/ml)", "Alkem Laboratories Ltd", "Dropper Bottle of 15ml", 185.0, False),
            ("Calcimax Forte Plus", "wellness", "tablet", "Calcium Carbonate + Calcitriol + Zinc + Boron", "Meyer Organics", "Strip of 30 tablets", 340.0, False),
            ("Osteo-K2 Tablet", "wellness", "tablet", "Calcium + Calcitriol + Vitamin K2-7", "Torrent Pharmaceuticals", "Strip of 10 tablets", 265.0, False),
            ("Rejoint UC Capsule", "wellness", "capsule", "Undenatured Collagen Type II + Boswellia", "Alkem Laboratories Ltd", "Strip of 10 capsules", 650.0, False),
            ("Cartigen Forte Tablet", "wellness", "tablet", "Glucosamine Sulfate + Chondroitin", "Mankind Pharma Ltd", "Strip of 10 tablets", 380.0, False),
            ("Bio-D3 Max Capsule", "wellness", "capsule", "Calcitriol + Calcium + EPA + DHA + Methylcobalamin", "Macleods Pharmaceuticals", "Strip of 10 capsules", 320.0, False),
            ("Dr. Morepen Gluco One BG-03", "devices", "devices", "Blood Glucose Biosensor System", "Dr. Morepen Healthcare", "1 Unit with 25 Strips & Lancets", 999.0, False),
            ("Dr. Morepen BG-03 Strips 50s", "devices", "devices", "Dehydrogenase Glucose Test Strips", "Dr. Morepen Healthcare", "Box of 50 Strips", 799.0, False),
            ("Omron MC 246 Digital Thermometer", "devices", "devices", "High Precision Thermistor Sensor", "Omron Healthcare", "1 Unit with Storage Case", 310.0, False),
            ("Dr. Trust Waterproof Flexible Thermometer", "devices", "devices", "Rapid 10-Second Digital Fever Sensor", "Dr. Trust USA", "1 Unit", 299.0, False),
            ("Dr. Trust Junior Compressor Nebulizer", "devices", "devices", "Medical Aerosol Air Compressor", "Dr. Trust USA", "1 Unit with Adult & Pediatric Masks", 1890.0, False),
            ("Omron NE C28 Compressor Nebulizer", "devices", "devices", "Virtual Valve Technology Nebulizer", "Omron Healthcare", "1 Heavy Duty Unit", 2690.0, False),
            ("Flamingo Orthopedic Heat Belt", "devices", "devices", "Thermostatic Electric Heating Pad", "Flamingo Healthcare", "1 Unit with 3-Level Controller", 995.0, False),
            ("Flamingo Lumbar Sacro Support Belt", "devices", "devices", "Contoured Anatomical Back Support", "Flamingo Healthcare", "1 Unit Size L", 845.0, False),
            ("Vissco Pro Cervical Collar", "devices", "devices", "High Density Foam with Chin Support", "Vissco Rehabilitation Aids", "1 Unit Size M", 520.0, False),
            ("Dettol Antiseptic Liquid 550ml", "otc", "syrup", "Chloroxylenol (4.8% w/v)", "Reckitt Benckiser India", "Bottle of 550ml", 215.0, False),
            ("Savlon Antiseptic Liquid 500ml", "otc", "syrup", "Chlorhexidine Gluconate + Cetrimide", "ITC Ltd", "Bottle of 500ml", 195.0, False),
            ("Himalaya Neem Face Wash", "personal_care", "syrup", "Neem + Turmeric Purifying Cleanser", "Himalaya Wellness", "Tube of 150ml", 190.0, False),
            ("Himalaya Anti-Hair Fall Shampoo", "personal_care", "syrup", "Bhringaraja + Butea Frondosa Herbal Extract", "Himalaya Wellness", "Bottle of 400ml", 295.0, False),
            ("Himalaya Baby Lotion 400ml", "personal_care", "syrup", "Almond Oil + Olive Oil Pediatric Formula", "Himalaya Wellness", "Bottle of 400ml", 285.0, False),
            ("Sebamed Baby Diaper Rash Cream", "personal_care", "ointment", "Titanium Dioxide + Squalane + Panthenol", "Sebapharma / USV", "Tube of 100ml", 525.0, False),
            ("Eskina Anti-Dandruff Lotion", "personal_care", "syrup", "Ketoconazole (2% w/v) + Zinc Pyrithione", "Glenmark Pharmaceuticals", "Bottle of 100ml", 310.0, False),
            ("Nizral 2% Solution", "otc", "syrup", "Ketoconazole (2% w/v)", "Johnson & Johnson Ltd", "Bottle of 100ml", 345.0, False),
            ("Scalpe Pro Daily Anti-Dandruff", "otc", "syrup", "Climbazole + ZPTO + Piroctone Olamine", "Glenmark Pharmaceuticals", "Bottle of 200ml", 340.0, False),
            ("Cipla Saslic DS Foaming Wash", "otc", "syrup", "Salicylic Acid (2% w/v)", "Cipla Ltd", "Pump Bottle of 60ml", 440.0, False),
            ("Moiz Daily Moisturizing Cream", "personal_care", "ointment", "Shea Butter + Dimethicone + Vitamin E", "Glowderma Labs", "Tub of 200g", 490.0, False),
            ("Venusia Max Intensive Cream", "personal_care", "ointment", "Shea + Mango + Cocoa + Aloe Butter", "Dr. Reddy's Laboratories", "Tub of 150g", 530.0, False),
            ("Epilyt Moisturizing Lotion", "personal_care", "syrup", "Light Liquid Paraffin + White Soft Paraffin", "Curatio Healthcare", "Bottle of 200ml", 380.0, False),
            ("Ahaglow S Foaming Face Wash", "personal_care", "syrup", "Glycolic Acid (1%) + Salicylic Acid (2%)", "Torrent Pharmaceuticals", "Pump Bottle of 100ml", 595.0, False),
            ("Dermafique All-Matte Sunscreen", "personal_care", "ointment", "SPF 50 PA+++ Full Light Protection", "ITC Ltd", "Tube of 50g", 749.0, False),
            ("La Shield Sunscreen Gel SPF 40", "personal_care", "ointment", "Micronized Titanium Dioxide + Zinc Oxide", "Glenmark Pharmaceuticals", "Tube of 50g", 790.0, False),
            ("Photostable Gold Sunscreen Gel", "personal_care", "ointment", "SPF 55+ PA++++ Non-Comedogenic", "Sun Pharmaceutical Industries", "Tube of 50g", 825.0, False),
            ("Suncros 50 Aquagel", "personal_care", "ointment", "Zinc Oxide SPF 50 Water-Resistant", "Sun Pharmaceutical Industries", "Tube of 100g", 695.0, False),
            ("Oral-B Pro-Health Toothbrush", "devices", "devices", "CrossAction Multi-Angle Bristles", "Procter & Gamble", "Pack of 4 Brushes", 240.0, False),
            ("Sensodyne Fresh Mint Gel", "otc", "ointment", "Potassium Nitrate (5% w/w)", "GlaxoSmithKline Consumer Healthcare", "Tube of 150g", 260.0, False),
            ("Sensodyne Rapid Relief", "otc", "ointment", "Strontium Acetate + Sodium Fluoride", "GlaxoSmithKline Consumer Healthcare", "Tube of 100g", 245.0, False),
            ("Thermoseal Prossafe Toothpaste", "otc", "ointment", "Potassium Nitrate + Sodium Monofluorophosphate", "ICPA Health Products Ltd", "Tube of 100g", 165.0, False),
            ("Listerine Cool Mint Mouthwash", "otc", "syrup", "Eucalyptol + Menthol + Methyl Salicylate + Thymol", "Johnson & Johnson Ltd", "Bottle of 500ml", 320.0, False),
            ("Hexidine EP Mouthwash", "prescription", "syrup", "Chlorhexidine Gluconate (0.2% w/v)", "ICPA Health Products Ltd", "Bottle of 160ml", 135.0, True),
            ("Clohex Plus Mouthwash", "prescription", "syrup", "Chlorhexidine Gluconate + Zinc Chloride", "Dr. Reddy's Laboratories", "Bottle of 150ml", 145.0, True),
            ("Hansaplast Waterproof Plasters", "devices", "devices", "Breathable Polyurethane Adhesive Bandages", "Beiersdorf India", "Box of 20 Plasters", 70.0, False),
            ("3M Micropore Surgical Tape", "devices", "devices", "Hypoallergenic Gentle Paper Tape 1 Inch", "3M India Ltd", "1 Roll with Dispenser", 95.0, False),
            ("Crepe Bandage 10cm x 4m", "devices", "devices", "Fast-Edged Pure Cotton Compression Bandage", "Dynamic Techno Medicals", "1 Roll with Clips", 165.0, False),
        ]

        # Combine fixed catalog entries
        all_medicines = []

        # 1. Process CATALOG_DATA
        for item in CATALOG_DATA:
            name, cat, form, comp, mfr, pack, mrp, price, req_rx, desc = item
            all_medicines.append({
                "name": name,
                "category": cat,
                "dosage_form": form,
                "composition": comp,
                "manufacturer": mfr,
                "packaging": pack,
                "mrp": Decimal(str(mrp)),
                "price": Decimal(str(price)),
                "requires_prescription": req_rx,
                "description": desc,
            })

        # 2. Process INDIAN_PHARMA_BRANDS
        for brand in INDIAN_PHARMA_BRANDS:
            name, cat, form, comp, mfr, pack, mrp_val, req_rx = brand
            disc_rate = random.choice([0.12, 0.15, 0.18, 0.20, 0.22])
            mrp_dec = Decimal(f"{mrp_val:.2f}")
            price_dec = Decimal(f"{mrp_val * (1.0 - disc_rate):.2f}")
            desc = f"Authentic Indian pharmaceutical formulation containing {comp}. Manufactured under stringent GMP guidelines by {mfr} for reliable clinical outcomes."
            all_medicines.append({
                "name": name,
                "category": cat,
                "dosage_form": form,
                "composition": comp,
                "manufacturer": mfr,
                "packaging": pack,
                "mrp": mrp_dec,
                "price": price_dec,
                "requires_prescription": req_rx,
                "description": desc,
            })

        # 3. If needed, pad to exactly 250 items with clinically sound Indian generics
        current_len = len(all_medicines)
        needed = 250 - current_len

        if needed > 0:
            generics_salts = [
                ("Atorvastatin (10mg)", "Atorlip", "Cipla Ltd", "tablet", "prescription"),
                ("Rosuvastatin (5mg)", "Rosuvas", "Sun Pharmaceutical Industries", "tablet", "prescription"),
                ("Pantoprazole (20mg)", "Pantocid Junior", "Sun Pharmaceutical Industries", "tablet", "prescription"),
                ("Rabeprazole (10mg)", "Rablet", "Lupin Ltd", "tablet", "prescription"),
                ("Paracetamol (500mg)", "Calpol 500", "GlaxoSmithKline", "tablet", "otc"),
                ("Ibuprofen (200mg)", "Brufen 200", "Abbott Healthcare", "tablet", "otc"),
                ("Levocetirizine (2.5mg/5ml)", "Levocet Syrup", "Hetero Healthcare", "syrup", "otc"),
                ("Amoxicillin (250mg)", "Novamox 250", "Cipla Ltd", "capsule", "prescription"),
                ("Azithromycin (250mg)", "Azithral 250", "Alembic Pharmaceuticals", "tablet", "prescription"),
                ("Metformin (850mg)", "Glycomet 850", "USV Pvt Ltd", "tablet", "prescription"),
                ("Glimepiride (1mg)", "Amaryl 1", "Sanofi India", "tablet", "prescription"),
                ("Voglibose (0.2mg)", "Volibo 0.2", "Sun Pharmaceutical Industries", "tablet", "prescription"),
                ("Cough Relief Lozenges", "Strepsils Honey & Lemon", "Reckitt Benckiser", "tablet", "otc"),
                ("Antiseptic Healing Cream", "Boroline Antiseptic Scented", "G.D. Pharmaceuticals", "ointment", "otc"),
                ("Petroleum Jelly Skin Protectant", "Vaseline Pure Petroleum Jelly", "Hindustan Unilever", "ointment", "otc"),
                ("Electrolyte Hydration Powder", "Electral Oral Rehydration Salts", "FDC Ltd", "powder", "otc"),
                ("Zincovit Drops 15ml", "Zincovit Pediatric Drops", "Apex Laboratories", "drops", "wellness"),
                ("Becosules Z Capsules", "Becosules Z Immune Formula", "Pfizer Ltd", "capsule", "wellness"),
                ("Calcium Sandoz 500", "Calcium Sandoz Effervescent", "Novartis India", "tablet", "wellness"),
                ("Softovac Bowel Regulator", "Softovac Constipation Granules", "Lupin Ltd", "powder", "wellness"),
                ("Isabgol Husk 100g", "Dabur Nature Care Isabgol", "Dabur India", "powder", "wellness"),
                ("Triphala Churna 100g", "Baidyanath Triphala Churna", "Baidyanath", "powder", "wellness"),
                ("Ashwagandha 60 Capsules", "Himalaya Ashwagandha Stress Relief", "Himalaya Wellness", "capsule", "wellness"),
                ("Brahmi Memory Support", "Himalaya Brahmi Mind Wellness", "Himalaya Wellness", "tablet", "wellness"),
                ("Gasex Chewable Tablets", "Himalaya Gasex Digestive Aid", "Himalaya Wellness", "tablet", "wellness"),
            ]

            counter = 1
            while len(all_medicines) < 250:
                for salt_formula, brand_base, company, form, cat in generics_salts:
                    if len(all_medicines) >= 250:
                        break
                    salt_clean = salt_formula.split('(')[0].strip()
                    mrp_val = round(random.uniform(40.0, 380.0), 2)
                    disc = random.choice([0.10, 0.15, 0.18, 0.25])
                    price_val = round(mrp_val * (1.0 - disc), 2)
                    req = (cat == 'prescription')

                    all_medicines.append({
                        "name": f"{brand_base} Generic-{counter}" if counter > 1 else brand_base,
                        "category": cat,
                        "dosage_form": form,
                        "composition": salt_formula,
                        "manufacturer": company,
                        "packaging": f"Strip of 10 {form}s" if form in ['tablet', 'capsule'] else f"Pack of 1 {form}",
                        "mrp": Decimal(f"{mrp_val:.2f}"),
                        "price": Decimal(f"{price_val:.2f}"),
                        "requires_prescription": req,
                        "description": f"Standard bioequivalent generic featuring {salt_formula}. Rigorously evaluated by {company} for maximum therapeutic bio-availability in Indian healthcare.",
                    })
                counter += 1

        # Cap at exactly 250
        all_medicines = all_medicines[:250]

        # Save to database inside an atomic transaction
        with transaction.atomic():
            # Clear old dummy medicines so catalog is strictly 250 authentic items
            Medicine.objects.all().delete()

            created_objs = []
            for idx, item in enumerate(all_medicines, start=1):
                form = item["dosage_form"]
                pool = IMAGE_POOLS.get(form, IMAGE_POOLS['tablet'])
                # Distribute deterministically or sequentially across the 30+ photo pool
                image_url = pool[idx % len(pool)]

                mrp = item["mrp"]
                price = item["price"]
                discount_percent = 15
                if mrp and mrp > price:
                    discount_percent = int(round(float((mrp - price) / mrp) * 100))

                med = Medicine(
                    name=item["name"],
                    category=item["category"],
                    dosage_form=item["dosage_form"],
                    composition=item["composition"],
                    manufacturer=item["manufacturer"],
                    packaging=item["packaging"],
                    dosage=f"As directed by physician ({item['packaging']})",
                    mrp=mrp,
                    price=price,
                    discount_percent=discount_percent,
                    stock=random.randint(15, 250),
                    requires_prescription=item["requires_prescription"],
                    description=item["description"],
                    side_effects="Mild nausea, headache, or gastrointestinal discomfort in sensitive patients. Consult physician if symptoms persist.",
                    how_to_use="Take with a full glass of water. Strictly adhere to dosage schedule prescribed on the blister packaging.",
                    image_url=image_url
                )
                created_objs.append(med)

            Medicine.objects.bulk_create(created_objs)

        self.stdout.write(
            self.style.SUCCESS(
                f"[OK] Successfully seeded exactly {len(created_objs)} enterprise Indian medicines into Mediswift Pro database!"
            )
        )
