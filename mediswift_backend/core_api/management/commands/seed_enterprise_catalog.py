from django.core.management.base import BaseCommand
from core_api.models import Medicine
from decimal import Decimal
import random

class Command(BaseCommand):
    help = 'Programmatically generates and seeds 150 realistic pharmaceutical and medical devices into the database.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("==> Generating 150-Item Enterprise Medicine Catalog..."))

        # Real high-resolution pharmacy and medical photo IDs from Unsplash CDN
        CURATED_PHOTO_IDS = [
            "1584308666744-24d5c474f2ae", "1585435557343-3b092031a831", "1471864190281-a93a3070b6de",
            "1550572017-edd951aa8f72", "1550572017-4fcdbb59cc32", "1576091160550-2173dba999ef",
            "1587854692152-cbe660dbde88", "1607613009820-a29f7bb81c04", "1584017911766-d451b3d0e843",
            "1563213126-a4273aed2016", "1527613426441-4da17471b66d", "1584362917165-526a968579e8",
            "1579165466791-78822d31e0a6", "1532938911079-1b06ac7ceec7", "1587854680352-936b22b91030",
            "1628771065518-0d82f1938462", "1584362917165-526a968579e8", "1550572017-4fcdbb59cc32",
            "1584515979956-d9f6e5d09982", "1587854680352-936b22b91030"
        ]

        MANUFACTURERS = [
            "Pfizer Labs", "Novartis Health", "Roche Pharmaceuticals", "GlaxoSmithKline",
            "Merck & Co.", "Teva Industries", "AstraZeneca", "Abbott Laboratories",
            "Sanofi Healthcare", "Bayer Pharma", "Johnson & Johnson", "Bristol Myers Squibb",
            "Eli Lilly & Co.", "Boehringer Ingelheim", "Viatris Labs"
        ]

        # 150 Medically Authentic Formulations
        CATALOG_BLUEPRINTS = [
            # 1. Antibiotics (Prescription) - 25 items
            ("Amoxicillin", "prescription", "500mg Capsule", "Broad-spectrum penicillin antibiotic for bacterial ear, sinus, and respiratory infections.", True, "18.50"),
            ("Azithromycin", "prescription", "250mg Tablet", "Macrolide antibiotic treating community-acquired pneumonia and strep infections.", True, "24.00"),
            ("Ciprofloxacin", "prescription", "500mg Tablet", "Fluoroquinolone antibiotic for urinary tract infections and severe bacterial bronchitis.", True, "22.75"),
            ("Doxycycline Hyclate", "prescription", "100mg Capsule", "Tetracycline class antimicrobial for respiratory infections, Lyme disease, and acne.", True, "19.90"),
            ("Cephalexin", "prescription", "500mg Capsule", "First-generation cephalosporin for skin, bone, and soft-tissue bacterial infections.", True, "21.50"),
            ("Clindamycin Hydrochloride", "prescription", "300mg Capsule", "Lincosamide antibiotic treating serious anaerobic bacterial infections.", True, "27.40"),
            ("Levofloxacin", "prescription", "500mg Tablet", "Third-generation fluoroquinolone indicated for complicated pyelonephritis and pneumonia.", True, "26.80"),
            ("Penicillin V Potassium", "prescription", "500mg Tablet", "Natural penicillin prescribed for streptococcal pharyngitis and dental infections.", True, "14.20"),
            ("Clarithromycin", "prescription", "500mg Tablet", "Extended-spectrum macrolide used in H. pylori eradication and respiratory care.", True, "31.00"),
            ("Sulfamethoxazole-Trimethoprim", "prescription", "800/160mg DS Tablet", "Synergistic sulfonamide antibiotic targeting urinary and bronchial pathogens.", True, "16.40"),
            ("Nitrofurantoin Monohydrate", "prescription", "100mg Capsule", "Urinary tract specific antibacterial treating acute uncomplicated cystitis.", True, "23.90"),
            ("Augmentin (Amoxicillin/Clavulanate)", "prescription", "875/125mg Tablet", "Beta-lactamase inhibitor combination for resistant sinusitis and animal bites.", True, "34.50"),
            ("Metronidazole", "prescription", "500mg Tablet", "Nitroimidazole synthetic antibacterial and antiprotozoal for anaerobic infections.", True, "15.75"),
            ("Cefdinir", "prescription", "300mg Capsule", "Third-generation cephalosporin for otitis media and acute bacterial exacerbations.", True, "38.20"),
            ("Minocycline", "prescription", "100mg Capsule", "Long-acting tetracycline derivative for inflammatory acne and skin infections.", True, "29.99"),
            ("Moxifloxacin", "prescription", "400mg Tablet", "Broad-spectrum respiratory fluoroquinolone for acute bacterial sinusitis.", True, "42.50"),
            ("Ampicillin", "prescription", "500mg Capsule", "Aminopenicillin used in susceptible gastrointestinal and genitourinary infections.", True, "17.80"),
            ("Cefuroxime Axetil", "prescription", "500mg Tablet", "Second-generation cephalosporin for Lyme borreliosis and pharyngitis.", True, "33.60"),
            ("Linezolid", "prescription", "600mg Tablet", "Oxazolidinone antibacterial active against multidrug-resistant Gram-positive pathogens.", True, "85.00"),
            ("Rifampin", "prescription", "300mg Capsule", "Rifamycin bactericidal antibiotic used in synergistic combination regimens.", True, "45.00"),
            ("Erythromycin Base", "prescription", "250mg Tablet", "Macrolide antibiotic used as an alternative for penicillin-allergic patients.", True, "20.10"),
            ("Tobramycin Inhalation", "prescription", "300mg/5mL Ampule", "Aminoglycoside aerosol treating chronic Pseudomonas infections in cystic fibrosis.", True, "120.00"),
            ("Vancomycin Oral", "prescription", "125mg Capsule", "Glycopeptide antibiotic targeting Clostridioides difficile colitis.", True, "115.00"),
            ("Fosfomycin Tromethamine", "prescription", "3g Oral Sachet", "Single-dose bactericidal agent for acute uncomplicated lower urinary tract infection.", True, "48.00"),
            ("Cefadroxil", "prescription", "500mg Capsule", "Cephalosporin indicated for susceptible skin and urinary infections.", True, "24.50"),

            # 2. Pain Relief, Analgesics & Anti-inflammatories - 20 items
            ("Paracetamol Extra Strength", "otc", "650mg Tablet", "Antipyretic and analgesic for prompt relief of tension headaches and fever.", False, "7.50"),
            ("Ibuprofen Rapid Release", "otc", "400mg Softgel", "Nonsteroidal anti-inflammatory drug (NSAID) relieving acute muscular pain.", False, "9.80"),
            ("Naproxen Sodium", "otc", "220mg Tablet", "All-day 12-hour relief for osteoarthritis stiffness and backache.", False, "11.20"),
            ("Acetaminophen PM", "otc", "500mg Caplet + Diphenhydramine", "Nighttime pain reliever and sleep aid for headache and minor aches.", False, "8.90"),
            ("Aspirin Low Dose Enteric", "otc", "81mg Delayed-Release", "Cardioprotective anti-platelet therapy preventing secondary ischemic events.", False, "6.50"),
            ("Celecoxib", "prescription", "200mg Capsule", "Selective COX-2 inhibitor relieving rheumatoid arthritis and ankylosing spondylitis.", True, "32.00"),
            ("Meloxicam", "prescription", "15mg Tablet", "Long-acting NSAID for osteoarthritis joint tenderness and swelling.", True, "18.40"),
            ("Diclofenac Sodium Topical Gel", "otc", "1% Arthritis Gel 100g", "Targeted topical NSAID providing direct osteoarthritis relief without pills.", False, "16.80"),
            ("Tramadol Hydrochloride", "prescription", "50mg Tablet", "Centrally acting synthetic opioid analgesic for moderate to moderately severe pain.", True, "28.50"),
            ("Ketorolac Tromethamine", "prescription", "10mg Tablet", "Potent NSAID indicated for short-term management of acute postoperative pain.", True, "26.00"),
            ("Baclofen", "prescription", "10mg Tablet", "Centrally acting gamma-aminobutyric acid analog for skeletal muscle spasticity.", True, "21.00"),
            ("Cyclobenzaprine Hydrochloride", "prescription", "10mg Tablet", "Muscle relaxant relieving acute painful musculoskeletal spasms.", True, "19.50"),
            ("Methocarbamol", "prescription", "750mg Tablet", "Muscle relaxer providing relief from acute tendon and back strains.", True, "22.30"),
            ("Tizanidine Hydrochloride", "prescription", "4mg Tablet", "Short-acting alpha-2 adrenergic agonist managing spasticity episodes.", True, "25.00"),
            ("Lidocaine 4% Pain Relief Patch", "otc", "5 Patches Box", "Topical numbing patches desensitizing aggravated peripheral nerves.", False, "14.99"),
            ("Capsaicin 0.1% Warming Cream", "otc", "50g Tube", "Substance-P depleting warming topical cream for localized arthritic joints.", False, "12.50"),
            ("Indomethacin", "prescription", "50mg Capsule", "Potent prostaglandin synthesis inhibitor for acute gouty arthritis attacks.", True, "27.80"),
            ("Nabumetone", "prescription", "500mg Tablet", "Non-acidic prodrug NSAID with lower gastric mucosal irritation profile.", True, "24.00"),
            ("Piroxicam", "prescription", "20mg Capsule", "Long half-life oxicam NSAID once daily for chronic degenerative joint disease.", True, "29.50"),
            ("Sumatriptan Succinate", "prescription", "100mg Tablet", "5-HT1B/1D receptor agonist (triptan) aborting acute migraine attacks with aura.", True, "45.00"),

            # 3. Diabetes & Metabolic Health - 15 items
            ("Metformin Extended Release", "prescription", "500mg ER Tablet", "First-line biguanide reducing hepatic glucose output and enhancing insulin sensitivity.", True, "14.20"),
            ("Glipizide", "prescription", "10mg XL Tablet", "Second-generation sulfonylurea stimulating physiological pancreatic beta-cell insulin secretion.", True, "16.50"),
            ("Sitagliptin (Januvia)", "prescription", "100mg Tablet", "DPP-4 inhibitor augmenting incretin hormone levels to regulate postprandial glucose.", True, "78.00"),
            ("Empagliflozin (Jardiance)", "prescription", "25mg Tablet", "SGLT2 inhibitor promoting urinary glucose excretion and cardiovascular risk reduction.", True, "125.00"),
            ("Dapagliflozin (Farxiga)", "prescription", "10mg Tablet", "Selective sodium-glucose co-transporter 2 inhibitor for diabetic nephropathy.", True, "118.00"),
            ("Pioglitazone", "prescription", "30mg Tablet", "Thiazolidinedione PPAR-gamma agonist improving peripheral insulin sensitivity.", True, "28.00"),
            ("Glimepiride", "prescription", "4mg Tablet", "Potent sulfonylurea maintaining sustained glycemic control in Type 2 diabetes.", True, "15.80"),
            ("Semaglutide Oral Formulation", "prescription", "7mg Tablet", "GLP-1 receptor agonist enhancing glucose-dependent insulin secretion and weight loss.", True, "195.00"),
            ("Repaglinide", "prescription", "1mg Tablet", "Meglitinide rapid-acting insulin secretagogue targeted for mealtime blood sugar spikes.", True, "32.00"),
            ("Acarbose", "prescription", "50mg Tablet", "Alpha-glucosidase inhibitor delaying complex carbohydrate digestion in the gut.", True, "24.50"),
            ("Insulin Glargine Pen", "prescription", "100 units/mL 3mL Pen", "Once-daily ultra-long-acting basal insulin analog with steady 24h profile.", True, "85.00"),
            ("Insulin Lispro Rapid-Acting", "prescription", "100 units/mL 10mL Vial", "Fast-acting prandial insulin analog for postprandial glycemic coverage.", True, "68.00"),
            ("Glucagon Emergency Injection Kit", "prescription", "1mg Syringe Kit", "Emergency synthetic hormone reversing severe acute hypoglycemia.", True, "140.00"),
            ("Blood Glucose Monitoring Strips", "devices", "50 Strips Pack", "Biosensor enzymatic test strips providing 5-second precise blood sugar readings.", False, "22.50"),
            ("Sterile Safety Lancets 30G", "devices", "100 Lancets Box", "Ultra-fine silicon-coated safety lancets for virtually painless capillary sampling.", False, "9.99"),

            # 4. Cardiovascular, Cholesterol & Blood Pressure - 20 items
            ("Atorvastatin Calcium", "prescription", "20mg Tablet", "HMG-CoA reductase inhibitor lowering LDL-C and stabilizing vascular plaque.", True, "29.75"),
            ("Rosuvastatin", "prescription", "10mg Tablet", "High-intensity statin with potent lipid-lowering and anti-atherosclerotic properties.", True, "34.00"),
            ("Lisinopril", "prescription", "10mg Tablet", "Angiotensin-converting enzyme inhibitor controlling hypertension and heart failure.", True, "16.80"),
            ("Amlodipine Besylate", "prescription", "5mg Tablet", "Dihydropyridine calcium channel blocker reducing peripheral vascular resistance.", True, "15.20"),
            ("Losartan Potassium", "prescription", "50mg Tablet", "Angiotensin II receptor blocker (ARB) protecting renal and cardiac function.", True, "18.90"),
            ("Metoprolol Succinate ER", "prescription", "50mg 24h Tablet", "Cardioselective beta-1 blocker controlling hypertension and stable angina.", True, "22.00"),
            ("Hydrochlorothiazide (HCTZ)", "prescription", "25mg Tablet", "Thiazide diuretic reducing plasma volume and arterial pressure.", True, "12.40"),
            ("Clopidogrel (Plavix)", "prescription", "75mg Tablet", "P2Y12 platelet inhibitor reducing thrombotic events after myocardial infarction.", True, "26.50"),
            ("Carvedilol", "prescription", "25mg Tablet", "Non-selective beta and alpha-1 blocker improving left ventricular ejection fraction.", True, "21.50"),
            ("Spironolactone", "prescription", "25mg Tablet", "Potassium-sparing aldosterone receptor antagonist treating resistant edema.", True, "17.80"),
            ("Valsartan", "prescription", "160mg Tablet", "Potent ARB reducing hospitalizations in heart failure with reduced ejection fraction.", True, "28.00"),
            ("Furosemide (Lasix)", "prescription", "40mg Tablet", "Loop diuretic promoting rapid diuresis in pulmonary edema and chronic heart failure.", True, "14.50"),
            ("Diltiazem CD", "prescription", "180mg Extended Capsule", "Non-dihydropyridine calcium antagonist controlling supraventricular arrhythmias.", True, "36.00"),
            ("Warfarin Sodium", "prescription", "5mg Tablet", "Vitamin K antagonist anticoagulant preventing venous thromboembolism.", True, "16.00"),
            ("Apixaban (Eliquis)", "prescription", "5mg Tablet", "Direct factor Xa inhibitor preventing stroke in nonvalvular atrial fibrillation.", True, "145.00"),
            ("Rivaroxaban (Xarelto)", "prescription", "20mg Tablet", "Novel oral anticoagulant for deep vein thrombosis and pulmonary embolism treatment.", True, "140.00"),
            ("Fenofibrate Micronized", "prescription", "134mg Capsule", "PPAR-alpha activator lowering severe elevated triglyceride levels.", True, "27.50"),
            ("Ezetimibe", "prescription", "10mg Tablet", "Niemann-Pick C1-Like 1 inhibitor blocking intestinal dietary cholesterol absorption.", True, "31.20"),
            ("Hydralazine Hydrochloride", "prescription", "25mg Tablet", "Direct-acting peripheral arteriolar vasodilator for refractory hypertension.", True, "19.00"),
            ("Digoxin", "prescription", "0.125mg Tablet", "Cardiac glycoside increasing myocardial contractility and slowing AV node conduction.", True, "22.50"),

            # 5. Respiratory, Asthma & Allergy - 15 items
            ("Albuterol Sulfate Inhalation Aerosol", "prescription", "90mcg 200 Actuations", "Fast-acting beta-2 agonist bronchodilator for acute asthma bronchospasm.", True, "38.00"),
            ("Fluticasone Propionate Nasal Spray", "otc", "50mcg 120 Sprays", "Intranasal corticosteroid relieving seasonal allergic congestion and sneezing.", False, "16.50"),
            ("Montelukast Sodium (Singulair)", "prescription", "10mg Tablet", "Leukotriene receptor antagonist managing chronic asthma and perennial allergies.", True, "23.40"),
            ("Cetirizine Hydrochloride", "otc", "10mg 24Hr Tablet", "Non-drowsy second-generation antihistamine relieving pollen, pet, and dust allergies.", False, "12.99"),
            ("Fexofenadine (Allegra)", "otc", "180mg 24Hr Tablet", "Non-sedating antihistamine providing complete 24-hour relief without cognitive fog.", False, "17.25"),
            ("Loratadine (Claritin)", "otc", "10mg Tablet", "Antihistamine preventing histamine-induced ocular itching and rhinorrhea.", False, "11.50"),
            ("Budesonide/Formoterol (Symbicort)", "prescription", "160/4.5mcg Inhaler", "Inhaled steroid and long-acting bronchodilator for dual maintenance therapy.", True, "89.00"),
            ("Ipratropium Bromide Nasal Spray", "prescription", "0.03% 30mL Spray", "Anticholinergic agent drying persistent allergic and non-allergic rhinorrhea.", True, "28.50"),
            ("Prednisone", "prescription", "20mg Tablet", "Systemic glucocorticoid suppressing severe systemic inflammation and asthma flare-ups.", True, "15.00"),
            ("Methylprednisolone Dose Pack", "prescription", "4mg 21 Tablets Pack", "Tapering oral steroid pack providing systemic relief for acute inflammation.", True, "24.00"),
            ("Guaifenesin Extended Release", "otc", "1200mg Expectorant", "Mucolytic expectorant thinning bronchial secretions and clearing congestion.", False, "14.80"),
            ("Dextromethorphan HBr Cough Syrup", "otc", "15mg/5mL 240mL Bottle", "Centrally active antitussive suppressing dry non-productive bronchial cough.", False, "9.99"),
            ("Saline Nasal Irrigation Kit", "devices", "Sinus Rinse Bottle + 50 Packets", "Physiological isotonic nasal wash flushing allergens and irritants from sinuses.", False, "15.99"),
            ("Peak Flow Respiratory Meter", "devices", "Handheld Diagnostic Unit", "Monitors personal lung peak expiratory flow to track asthma control at home.", False, "24.50"),
            ("Cool Mist Ultrasonic Humidifier", "devices", "2.5L Medical Grade", "Relieves dry airways, scratchy throat, and nighttime nasal dryness.", False, "39.99"),

            # 6. Gastrointestinal & Digestive Health - 15 items
            ("Omeprazole Delayed Release", "otc", "20mg Capsule", "Proton pump inhibitor treating severe heartburn and erosive esophagitis.", False, "15.40"),
            ("Pantoprazole Sodium", "prescription", "40mg Delayed Tablet", "Suppresses gastric parietal acid secretion in gastroesophageal reflux disease (GERD).", True, "21.00"),
            ("Famotidine (Pepcid AC)", "otc", "20mg Tablet", "H2 receptor antagonist preventing meal-induced acid indigestion in 15 minutes.", False, "10.50"),
            ("Esomeprazole (Nexium)", "otc", "20mg Capsule", "S-isomer PPI offering superior 24-hour gastric acid control and healing.", False, "18.75"),
            ("Ondansetron (Zofran)", "prescription", "4mg ODT Oral Tablet", "5-HT3 antagonist preventing chemotherapy and postoperative nausea/vomiting.", True, "26.50"),
            ("Dicyclomine Hydrochloride", "prescription", "20mg Tablet", "Antispasmodic anticholinergic relieving abdominal cramps in irritable bowel syndrome.", True, "19.00"),
            ("Sucralfate", "prescription", "1g Tablet", "Forms a protective mucosal barrier coating duodenal ulcer craters against acid.", True, "29.80"),
            ("Polyethylene Glycol 3350 (MiraLAX)", "otc", "510g Powder 30 Doses", "Osmotic laxative gently retaining water in the stool to relieve constipation.", False, "16.20"),
            ("Loperamide Hydrochloride (Imodium)", "otc", "2mg Caplet", "Opioid-receptor agonist slowing intestinal peristalsis for acute diarrhea control.", False, "7.99"),
            ("Simethicone Extra Strength", "otc", "125mg Softgel", "Antifoaming surfactant breaking gas bubbles to alleviate bloating and pressure.", False, "8.50"),
            ("Digestive Enzyme Complex", "wellness", "90 Vegetarian Capsules", "Comprehensive broad-spectrum protease, amylase, and lipase for optimal digestion.", False, "22.00"),
            ("Bismuth Subsalicylate (Pepto)", "otc", "262mg Chewable Tablet", "Coats stomach lining and exhibits antimicrobial action against diarrhea pathogens.", False, "7.25"),
            ("Lactase Enzyme Fast Acting", "otc", "9000 FCC Units Caplet", "Neutralizes dairy lactose preventing gas, cramps, and intolerance symptoms.", False, "12.99"),
            ("Metoclopramide", "prescription", "10mg Tablet", "Dopamine antagonist prokinetic stimulating upper GI motility in diabetic gastroparesis.", True, "18.50"),
            ("Mesalamine", "prescription", "800mg Delayed Tablet", "Topical 5-ASA anti-inflammatory inducing remission in mild to moderate ulcerative colitis.", True, "85.00"),

            # 7. Mental Health, Neurology & Sleep - 15 items
            ("Sertraline Hydrochloride (Zoloft)", "prescription", "50mg Tablet", "Selective serotonin reuptake inhibitor (SSRI) treating major depressive disorder and OCD.", True, "22.50"),
            ("Escitalopram Oxalate (Lexapro)", "prescription", "10mg Tablet", "Pure S-enantiomer SSRI with high selectivity for generalized anxiety disorder.", True, "24.00"),
            ("Fluoxetine (Prozac)", "prescription", "20mg Capsule", "Long half-life antidepressant stabilizing mood and treating panic disorder.", True, "19.80"),
            ("Duloxetine (Cymbalta)", "prescription", "60mg Delayed Capsule", "Serotonin-norepinephrine reuptake inhibitor (SNRI) for depression and neuropathic pain.", True, "38.50"),
            ("Bupropion Hydrochloride XL", "prescription", "150mg 24h Tablet", "Norepinephrine-dopamine reuptake inhibitor improving focus with low sexual side effects.", True, "32.00"),
            ("Gabapentin", "prescription", "300mg Capsule", "GABA structural analog treating postherpetic neuralgia and focal epileptic seizures.", True, "18.20"),
            ("Pregabalin (Lyrica)", "prescription", "75mg Capsule", "Alpha-2-delta ligand alleviating fibromyalgia and diabetic peripheral neuropathy.", True, "45.00"),
            ("Clonazepam", "prescription", "0.5mg Tablet", "Long-acting benzodiazepine anticonvulsant managing acute panic and seizure disorders.", True, "21.00"),
            ("Lamotrigine", "prescription", "100mg Tablet", "Voltage-gated sodium channel blocker for bipolar maintenance and epilepsy.", True, "28.00"),
            ("Topiramate", "prescription", "50mg Tablet", "Neurotherapeutic agent preventing chronic migraine headaches and focal seizures.", True, "26.50"),
            ("Buspirone Hydrochloride", "prescription", "10mg Tablet", "Non-benzodiazepine 5-HT1A partial agonist relieving generalized anxiety without sedation.", True, "17.50"),
            ("Hydroxyzine Pamoate", "prescription", "25mg Capsule", "Sedating first-generation antihistamine offering rapid acute anxiety relief.", True, "15.90"),
            ("Melatonin Dual Release", "wellness", "5mg Timed Release Tablet", "Natural circadian hormone regulating sleep-wake cycles and combating jet lag.", False, "11.99"),
            ("L-Theanine 200mg + Suntheanine", "wellness", "60 Veg Capsules", "Promotes focused alpha-brain wave relaxation without causing drowsiness.", False, "18.50"),
            ("Valerian Root Standardized Extract", "wellness", "500mg Herbal Capsule", "Botanical calmative supporting restorative sleep quality and tension reduction.", False, "13.40"),

            # 8. Dermatology, Topicals & Skin Care - 10 items
            ("Hydrocortisone 1% Anti-Itch Cream", "otc", "28g Topical Cream", "Topical corticosteroid reducing pruritus, insect bite inflammation, and eczema flare-ups.", False, "6.99"),
            ("Tretinoin Retin-A Cream", "prescription", "0.05% 45g Tube", "Retinoid increasing epidermal turnover, treating comedonal acne and photodamage.", True, "48.00"),
            ("Clotrimazole 1% Antifungal Cream", "otc", "30g Cream", "Azole antifungal treating tinea pedis (athlete's foot), ringworm, and jock itch.", False, "8.50"),
            ("Mupirocin 2% Ointment", "prescription", "22g Tube", "Topical antibiotic clearing impetigo and localized secondary staphylococcal infections.", True, "29.90"),
            ("Ketoconazole 2% Therapeutic Shampoo", "prescription", "120mL Bottle", "Broad-spectrum antifungal shampoo eliminating Malassezia yeast and severe dandruff.", True, "24.50"),
            ("Benzoyl Peroxide 10% Acne Cleanser", "otc", "150mL Wash", "Antibacterial keratolytic wash unclogging pores and killing Cutibacterium acnes.", False, "11.20"),
            ("Clobetasol Propionate", "prescription", "0.05% 30g Ointment", "Super-high potency topical corticosteroid for recalcitrant psoriasis plaques.", True, "42.00"),
            ("Betamethasone Dipropionate", "prescription", "0.05% 45g Cream", "High-potency fluorinated corticosteroid treating severe corticosteroid-responsive dermatoses.", True, "34.00"),
            ("Silver Sulfadiazine 1% Burn Cream", "prescription", "50g Jar", "Bactericidal topical agent preventing infection in second- and third-degree burns.", True, "19.50"),
            ("Ceramide Barrier Repair Moisturizer", "personal_care", "250mL Pump", "Dermatologist-tested ceramide NP, AP, EOP complex restoring the skin moisture barrier.", False, "16.80"),

            # 9. Medical Devices, Monitoring & First Aid - 10 items
            ("Upper Arm Digital Blood Pressure Monitor", "devices", "Clinical Grade Unit", "Oscillometric automatic blood pressure monitor with irregular heartbeat detector and memory.", False, "49.99"),
            ("Fingertip Pulse Oximeter Pro", "devices", "OLED Sensor Unit", "Non-invasive SpO2 oxygen saturation and pulse rate monitor with multi-directional screen.", False, "28.00"),
            ("Infrared No-Touch Forehead Thermometer", "devices", "1-Second Read Device", "Medical-grade non-contact sensor measuring body temperature accurately in 1 second.", False, "26.50"),
            ("Portable Compressor Nebulizer Machine", "devices", "Complete Aerosol Kit", "Delivers aerosolized respiratory bronchodilator medication deep into bronchioles.", False, "45.00"),
            ("Sterile Gauze Pads & First Aid Roll", "devices", "100 Sterile Pads Box", "Hypoallergenic absorbent cotton pads for sterile wound dressing and exudate absorption.", False, "12.40"),
            ("Hospital Grade Chlorhexidine Antiseptic", "devices", "500mL Cleansing Bottle", "Pre-operative non-stinging antiseptic skin cleanser preventing surgical infections.", False, "8.75"),
            ("Adjustable Orthopedic Knee Brace", "devices", "Hinged Support Unit", "Stabilizes collateral ligaments and provides bilateral support for meniscus recovery.", False, "34.00"),
            ("Ergonomic Wrist Support Splint", "devices", "Removable Aluminum Splint", "Immobilizes the carpal tunnel relieving median nerve pressure during work and sleep.", False, "18.50"),
            ("Digital TENS EMS Muscle Stimulator", "devices", "Dual Channel 8 Pads", "Transcutaneous electrical nerve stimulator blocking pain signals and relaxing muscle knots.", False, "39.99"),
            ("Emergency CPR Resuscitation Face Shield", "devices", "10 Pack Pocket Kit", "One-way filter valve barrier shield preventing cross-contamination during rescue breaths.", False, "14.00"),

            # 10. Clinical Wellness, Vitamins & Supplements - 5 items
            ("Vitamin D3 5000 IU Immune Max", "wellness", "120 Liquid Softgels", "Bioactive cholecalciferol promoting calcium absorption, bone mineralization, and innate defense.", False, "21.99"),
            ("Omega-3 Wild Deep-Sea Fish Oil", "wellness", "1200mg 90 Softgels", "Triple molecularly distilled EPA/DHA concentrate for cardiovascular arterial elasticity.", False, "26.50"),
            ("Coenzyme Q10 (CoQ10) 200mg", "wellness", "60 Veggie Softgels", "Essential mitochondrial antioxidant supporting cellular ATP generation and statin users.", False, "29.99"),
            ("Magnesium Glycinate Chelate 400mg", "wellness", "120 Capsules", "Highly bioavailable non-laxative chelated magnesium relaxing muscle cramps and nervous system.", False, "23.50"),
            ("Multi-Strain Probiotic 50 Billion CFU", "wellness", "30 Delayed Capsules", "Acid-resistant probiotic supporting microbiome diversity, gut immunity, and regularity.", False, "28.00"),
        ]

        created_count = 0
        updated_count = 0

        for idx, item in enumerate(CATALOG_BLUEPRINTS, start=1):
            name, category, dosage, desc, req_rx, price_str = item
            price = Decimal(price_str)
            stock = random.randint(25, 200)
            manufacturer = random.choice(MANUFACTURERS)
            photo_id = CURATED_PHOTO_IDS[(idx - 1) % len(CURATED_PHOTO_IDS)]

            # High-resolution Unsplash medical image
            image_url = f"https://images.unsplash.com/photo-{photo_id}?w=800&auto=format&fit=crop&q=80"

            medicine, created = Medicine.objects.update_or_create(
                name=f"{name} {dosage}",
                defaults={
                    "category": category,
                    "price": price,
                    "stock": stock,
                    "description": desc,
                    "image_url": image_url,
                    "manufacturer": manufacturer,
                    "dosage": dosage,
                    "requires_prescription": req_rx,
                }
            )

            if created:
                created_count += 1
            else:
                updated_count += 1

        self.stdout.write(self.style.SUCCESS(
            f"[OK] Seeding complete! Processed {len(CATALOG_BLUEPRINTS)} medicines "
            f"({created_count} created, {updated_count} updated)."
        ))
        self.stdout.write(self.style.SUCCESS(
            f"==> Total Medicines currently in Database: {Medicine.objects.count()}."
        ))
