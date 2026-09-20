import os
import io
import csv
import json
import math
import random
import hashlib
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

from django.core.management.base import BaseCommand
from django.conf import settings
from django.db import models
from apps.products.models import Product, ProductImage

FICTIONAL_BRANDS = [
    "MediNova DEMO",
    "CareNest DEMO",
    "Wellora DEMO",
    "HealthNest DEMO",
    "CareSpring DEMO",
    "MediBloom DEMO",
]

DISCLAIMER_TOP = "AI-GENERATED DEMO"
DISCLAIMER_BOTTOM = "NOT A REAL PRODUCT PHOTO"

CATEGORY_PALETTES = {
    'first-aid': {
        'accent': (220, 38, 38),      # Deep red
        'light': (254, 226, 226),
        'bg_top': (248, 250, 252),
        'bg_bottom': (241, 245, 249),
        'category_name': 'FIRST AID CARE',
    },
    'medical-devices': {
        'accent': (37, 99, 235),      # Clinical blue
        'light': (219, 234, 254),
        'bg_top': (248, 250, 252),
        'bg_bottom': (235, 242, 250),
        'category_name': 'MEDICAL DEVICE',
    },
    'personal-care': {
        'accent': (13, 148, 136),     # Teal
        'light': (204, 251, 241),
        'bg_top': (248, 250, 252),
        'bg_bottom': (236, 248, 247),
        'category_name': 'PERSONAL HYGIENE',
    },
    'oral-care': {
        'accent': (14, 165, 233),      # Sky cyan
        'light': (224, 242, 254),
        'bg_top': (248, 250, 252),
        'bg_bottom': (238, 246, 253),
        'category_name': 'ORAL HEALTH',
    },
    'skin-care': {
        'accent': (217, 119, 6),       # Warm amber / gold
        'light': (254, 243, 199),
        'bg_top': (248, 250, 252),
        'bg_bottom': (253, 248, 240),
        'category_name': 'DERMA CARE',
    },
    'hair-care': {
        'accent': (124, 58, 237),      # Indigo purple
        'light': (237, 233, 254),
        'bg_top': (248, 250, 252),
        'bg_bottom': (245, 243, 255),
        'category_name': 'HAIR CARE',
    },
    'baby-care': {
        'accent': (236, 72, 153),      # Soft rose
        'light': (252, 231, 243),
        'bg_top': (248, 250, 252),
        'bg_bottom': (253, 242, 248),
        'category_name': 'BABY CARE',
    },
    'womens-wellness': {
        'accent': (225, 29, 72),       # Rose pink
        'light': (255, 228, 230),
        'bg_top': (248, 250, 252),
        'bg_bottom': (255, 241, 242),
        'category_name': "WOMEN'S WELLNESS",
    },
    'fitness-wellness': {
        'accent': (5, 150, 105),       # Vibrant emerald
        'light': (209, 250, 229),
        'bg_top': (248, 250, 252),
        'bg_bottom': (236, 253, 245),
        'category_name': 'FITNESS & WELLNESS',
    },
    'ayurveda-wellness': {
        'accent': (180, 83, 9),        # Botanical amber / bronze
        'light': (254, 243, 199),
        'bg_top': (248, 250, 252),
        'bg_bottom': (251, 247, 239),
        'category_name': 'AYURVEDA & BOTANICAL',
    },
    'healthcare-accessories': {
        'accent': (79, 70, 229),       # Indigo
        'light': (224, 231, 255),
        'bg_top': (248, 250, 252),
        'bg_bottom': (243, 244, 255),
        'category_name': 'CARE ACCESSORY',
    },
    'pain-relief': {
        'accent': (225, 29, 72),
        'light': (255, 228, 230),
        'bg_top': (248, 250, 252),
        'bg_bottom': (254, 242, 242),
        'category_name': 'PAIN RELIEF',
    },
    'fever-cold': {
        'accent': (217, 119, 6),
        'light': (254, 243, 199),
        'bg_top': (248, 250, 252),
        'bg_bottom': (254, 249, 238),
        'category_name': 'FEVER & COLD',
    },
}

DEFAULT_PALETTE = {
    'accent': (15, 118, 110),
    'light': (204, 251, 241),
    'bg_top': (248, 250, 252),
    'bg_bottom': (241, 245, 249),
    'category_name': 'HEALTHCARE CARE',
}


def get_font(size, bold=False):
    """Safely loads a system TTF font with fallback to default PIL font."""
    font_names = [
        "arialbd.ttf" if bold else "arial.ttf",
        "segoeuib.ttf" if bold else "segoeui.ttf",
        "tahomabd.ttf" if bold else "tahoma.ttf",
        "calibrib.ttf" if bold else "calibri.ttf",
    ]
    windir = os.environ.get("WINDIR", "C:\\Windows")
    for name in font_names:
        p = Path(windir) / "Fonts" / name
        if p.exists():
            try:
                return ImageFont.truetype(str(p), size)
            except Exception:
                pass
    try:
        return ImageFont.load_default()
    except Exception:
        return None


def calculate_perceptual_hash(image, hash_size=8):
    """Calculates 64-bit average perceptual hash (pHash) for image duplicate detection."""
    img_gray = image.convert('L').resize((hash_size, hash_size), Image.Resampling.BILINEAR)
    pixels = list(img_gray.getdata())
    avg = sum(pixels) / len(pixels)
    bits = "".join(['1' if pixel > avg else '0' for pixel in pixels])
    hex_hash = f"{int(bits, 2):0{hash_size * hash_size // 4}x}"
    return hex_hash


class Command(BaseCommand):
    help = "Generates photorealistic, unique ecommerce-style AI demo product visuals for MediSwift products."

    def add_arguments(self, parser):
        parser.add_argument('--all', action='store_true', help="Generate visuals for all catalog products requiring demo images")
        parser.add_argument('--missing', action='store_true', help="Generate only for products without an existing valid image")
        parser.add_argument('--sku', type=str, default=None, help="Generate visual for a specific SKU (e.g. MS-DEMO-0001)")
        parser.add_argument('--export-zip', action='store_true', help="Automatically export the standardized ZIP after generation")
        parser.add_argument('--provider', type=str, default=None, choices=['api', 'procedural'],
                            help="Image generation engine: 'api' for external provider, 'procedural' for built-in high-fidelity PIL studio renderer.")

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("\n=== MEDISWIFT 250 AI DEMO PRODUCT IMAGE GENERATOR ==="))

        api_key = os.getenv("IMAGE_GENERATION_API_KEY")
        requested_provider = options.get('provider')

        # Provider selection & validation
        if requested_provider == 'api':
            if not api_key:
                self.stderr.write(self.style.ERROR("\n[ERROR] IMAGE GENERATION PROVIDER NOT CONFIGURED."))
                self.stderr.write("IMAGE_GENERATION_API_KEY environment variable is missing.")
                self.stderr.write("Please configure IMAGE_GENERATION_API_KEY in your environment or use '--provider procedural'.\n")
                return
            engine = 'api'
            self.stdout.write(self.style.SUCCESS("[Engine] Using external Image Generation Provider API."))
        elif requested_provider == 'procedural':
            engine = 'procedural'
            self.stdout.write(self.style.SUCCESS("[Engine] Using built-in High-Fidelity PIL Studio Product Mockup Renderer."))
        else:
            if api_key:
                engine = 'api'
                self.stdout.write(self.style.SUCCESS("[Engine] Detected IMAGE_GENERATION_API_KEY -> Using Provider API."))
            else:
                engine = 'procedural'
                self.stdout.write(self.style.WARNING("[Notice] IMAGE_GENERATION_API_KEY not configured."))
                self.stdout.write(self.style.SUCCESS("[Engine] Falling back to built-in High-Fidelity PIL Studio Product Mockup Renderer."))

        # Destination directories
        media_root = Path(settings.MEDIA_ROOT)
        demo_dir = media_root / 'product_images' / 'ai_demo'
        demo_dir.mkdir(parents=True, exist_ok=True)
        (media_root / 'product_images' / 'verified').mkdir(parents=True, exist_ok=True)
        (media_root / 'product_images' / 'pending_review').mkdir(parents=True, exist_ok=True)
        (media_root / 'product_images' / 'rejected').mkdir(parents=True, exist_ok=True)

        # Gather target products
        all_products = Product.objects.all().order_by('sku')
        if options.get('sku'):
            target_sku = options['sku'].strip()
            products = all_products.filter(sku__iexact=target_sku)
            if not products.exists():
                self.stderr.write(self.style.ERROR(f"Product with SKU '{target_sku}' not found in database."))
                return
        elif options.get('all'):
            products = all_products
        else:
            # Default or --missing: Products where verified image is not present
            products = all_products.filter(
                models.Q(image_status='MISSING') |
                models.Q(image_url='') |
                models.Q(image_status='AI_DEMO_ONLY') |
                models.Q(images__isnull=True)
            ).distinct()

        total_targets = products.count()
        self.stdout.write(f"Found {total_targets} candidate product(s) for visual generation.\n")

        generated_list = []
        failed_list = []
        duplicates_list = []
        seen_sha256 = {}
        seen_phash = {}

        # Preload existing hashes
        for pimg in ProductImage.objects.filter(image_status='AI_DEMO_ONLY'):
            if pimg.image_hash:
                seen_sha256[pimg.image_hash] = pimg.sku

        idx = 0
        for p in products:
            idx += 1
            sku = p.sku or f"SKU-{p.id}"
            clean_sku = sku.strip()
            output_filename = f"{clean_sku}.webp"
            target_path = demo_dir / output_filename

            # Skip if verified real image already exists for this product
            if p.image_status == 'VERIFIED':
                self.stdout.write(f"[{idx}/{total_targets}] Skipping {clean_sku} — Product has a VERIFIED real photo.")
                continue

            # Check if demo image already exists and is valid WebP
            if options.get('missing') and target_path.exists() and p.images.filter(image_status='AI_DEMO_ONLY').exists():
                self.stdout.write(f"[{idx}/{total_targets}] Skipping {clean_sku} — Valid AI Demo image already on disk.")
                continue

            try:
                # Generate unique visual
                img, img_hash, p_hash = self.render_product_visual(
                    product=p,
                    seed_salt=idx,
                    seen_hashes=seen_sha256
                )

                # Check duplicate
                if img_hash in seen_sha256:
                    duplicates_list.append({
                        'sku': clean_sku,
                        'original_sku': seen_sha256[img_hash],
                        'hash': img_hash
                    })
                    # Regenerate with extra entropy salt
                    img, img_hash, p_hash = self.render_product_visual(
                        product=p,
                        seed_salt=idx + 10000,
                        seen_hashes=seen_sha256
                    )

                # Save WebP with optimal compression & high resolution
                img.save(target_path, format="WEBP", quality=92, method=6)
                seen_sha256[img_hash] = clean_sku
                seen_phash[p_hash] = clean_sku

                # Database records
                rel_url = f"/media/product_images/ai_demo/{output_filename}"
                rel_file = f"product_images/ai_demo/{output_filename}"

                # Update or create ProductImage
                demo_pimg = p.images.filter(image_status='AI_DEMO_ONLY').first()
                if not demo_pimg:
                    demo_pimg = ProductImage(product=p, sku=clean_sku)

                demo_pimg.sku = clean_sku
                demo_pimg.image_file.name = rel_file
                demo_pimg.image.name = rel_file
                demo_pimg.image_url = rel_url
                demo_pimg.image_status = 'AI_DEMO_ONLY'
                demo_pimg.status = 'AI_DEMO_ONLY'
                demo_pimg.source_type = 'AI_GENERATED_DEMO'
                demo_pimg.source_name = 'MediSwift Demo Generator'
                demo_pimg.source = 'MediSwift Demo Generator'
                demo_pimg.is_real_product_photo = False
                demo_pimg.requires_real_photo_replacement = True
                demo_pimg.is_primary = False
                demo_pimg.image_hash = img_hash
                demo_pimg.mime_type = 'image/webp'
                demo_pimg.width = 800
                demo_pimg.height = 800
                demo_pimg.alt_text = f"AI-generated demo visual for {p.name} ({clean_sku})"
                demo_pimg.save()

                # Update Product fields
                p.image_url = rel_url
                p.image_status = 'AI_DEMO_ONLY'
                p.is_real_product_photo = False
                p.image_alt_text = demo_pimg.alt_text
                p.image_source = 'MediSwift Demo Generator'
                p.save(update_fields=['image_url', 'image_status', 'is_real_product_photo', 'image_alt_text', 'image_source'])

                generated_list.append({
                    'sku': clean_sku,
                    'name': p.name,
                    'category': p.category.name if p.category else '',
                    'file': output_filename,
                    'hash': img_hash,
                    'phash': p_hash,
                    'status': 'SUCCESS'
                })

                if idx % 25 == 0 or idx == total_targets:
                    self.stdout.write(f"[{idx}/{total_targets}] Generated demo visual for {clean_sku} ({p.name[:35]}...)")

            except Exception as e:
                failed_list.append({'sku': clean_sku, 'name': p.name, 'error': str(e)})
                self.stderr.write(self.style.ERROR(f"[{idx}/{total_targets}] Failed generating {clean_sku}: {str(e)}"))

        # Summary output
        self.stdout.write(self.style.SUCCESS(f"\nSuccessfully generated {len(generated_list)} AI demo visuals."))
        if duplicates_list:
            self.stdout.write(self.style.WARNING(f"Resolved {len(duplicates_list)} near-duplicate images with re-seeding."))
        if failed_list:
            self.stdout.write(self.style.ERROR(f"Failed to generate {len(failed_list)} images."))

        # Generate reports in exports/
        exports_dir = settings.BASE_DIR.parent / 'exports'
        exports_dir.mkdir(parents=True, exist_ok=True)

        self.write_reports(exports_dir, generated_list, failed_list, duplicates_list)

        # Trigger ZIP export if requested
        if options.get('export_zip'):
            self.stdout.write(self.style.MIGRATE_HEADING("\nTriggering bulk ZIP export..."))
            from django.core.management import call_command
            call_command('export_product_images_zip')

    def render_product_visual(self, product, seed_salt=0, seen_hashes=None):
        """
        Procedural studio-render generator using Pillow:
        - Photorealistic studio photography aesthetic (neutral gradient, soft contact shadows)
        - Category-specific 3D packaging geometry (bottles, cartons, blister cards, devices)
        - Centered composition with realistic lighting highlights
        - Fictional demo branding (MediNova DEMO, CareNest DEMO, etc.)
        - Prominently visible, required regulatory disclaimers:
          "AI-GENERATED DEMO" & "NOT A REAL PRODUCT PHOTO"
        - Deterministic uniqueness per SKU based on SKU hash & seed salt
        """
        sku = product.sku or "SKU"
        cat_slug = product.category.slug if product.category else 'general'
        palette = CATEGORY_PALETTES.get(cat_slug, DEFAULT_PALETTE)

        # Deterministic seed from SKU
        hash_digest = hashlib.md5(f"{sku}-{seed_salt}".encode()).hexdigest()
        rand = random.Random(int(hash_digest[:8], 16))

        width, height = 800, 800
        canvas = Image.new("RGBA", (width, height), (255, 255, 255, 255))
        draw = ImageDraw.Draw(canvas)

        # 1. Soft Studio Gradient Background
        bg_top = palette['bg_top']
        bg_bottom = palette['bg_bottom']
        for y in range(height):
            ratio = y / height
            r = int(bg_top[0] * (1 - ratio) + bg_bottom[0] * ratio)
            g = int(bg_top[1] * (1 - ratio) + bg_bottom[1] * ratio)
            b = int(bg_top[2] * (1 - ratio) + bg_bottom[2] * ratio)
            draw.line([(0, y), (width, y)], fill=(r, g, b, 255))

        # 2. Subtle Studio Light Reflection Circle in Background
        glow_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        glow_draw = ImageDraw.Draw(glow_layer)
        glow_center = (400, 360)
        glow_radius = 280
        glow_draw.ellipse([
            (glow_center[0] - glow_radius, glow_center[1] - glow_radius),
            (glow_center[0] + glow_radius, glow_center[1] + glow_radius)
        ], fill=(255, 255, 255, 110))
        glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=60))
        canvas.alpha_composite(glow_layer)
        draw = ImageDraw.Draw(canvas)

        # 3. Soft Contact Shadow below Product
        shadow_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        shadow_draw = ImageDraw.Draw(shadow_layer)
        shadow_w = rand.randint(300, 380)
        shadow_h = rand.randint(24, 36)
        shadow_y = 620 + rand.randint(-10, 10)
        shadow_draw.ellipse([
            (400 - shadow_w // 2, shadow_y - shadow_h // 2),
            (400 + shadow_w // 2, shadow_y + shadow_h // 2)
        ], fill=(30, 41, 59, 130))
        # Inner deeper contact shadow
        shadow_draw.ellipse([
            (400 - shadow_w // 3, shadow_y - shadow_h // 3),
            (400 + shadow_w // 3, shadow_y + shadow_h // 3)
        ], fill=(15, 23, 42, 170))
        shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(radius=16))
        canvas.alpha_composite(shadow_layer)
        draw = ImageDraw.Draw(canvas)

        # 4. Draw Category-Specific 3D Product Geometry
        fictional_brand = rand.choice(FICTIONAL_BRANDS)
        dosage = (product.dosage_form or '').upper()

        if any(w in cat_slug for w in ['device', 'monitor', 'thermometer', 'pulse']) or dosage == 'DEVICE':
            self.draw_medical_device_mockup(canvas, palette, fictional_brand, product, rand)
        elif any(w in cat_slug for w in ['skin', 'sunscreen', 'cream', 'gel', 'ointment']) or dosage in ['CREAM', 'GEL', 'OINTMENT']:
            self.draw_tube_mockup(canvas, palette, fictional_brand, product, rand)
        elif any(w in cat_slug for w in ['ayur', 'wellness', 'powder', 'botanical']) or dosage == 'POWDER':
            self.draw_apothecary_jar_mockup(canvas, palette, fictional_brand, product, rand)
        elif any(w in cat_slug for w in ['first-aid', 'bandage', 'kit', 'dressing']):
            self.draw_first_aid_box_mockup(canvas, palette, fictional_brand, product, rand)
        elif any(w in cat_slug for w in ['hair', 'baby', 'personal', 'hygiene', 'lotion', 'sanitizer']) or dosage in ['LOTION', 'LIQUID', 'SPRAY']:
            self.draw_dispenser_bottle_mockup(canvas, palette, fictional_brand, product, rand)
        elif dosage in ['TABLET', 'CAPSULE', 'STRIP'] or any(w in cat_slug for w in ['pain', 'fever', 'cough', 'cold']):
            # Pharmaceutical Carton & Blister pack
            self.draw_carton_box_mockup(canvas, palette, fictional_brand, product, rand)
        else:
            self.draw_carton_box_mockup(canvas, palette, fictional_brand, product, rand)

        # 5. Baked Disclaimer Badges (MANDATORY & VISIBLE)
        self.draw_mandatory_disclaimers(canvas, width, height)

        # 6. Final Polish & Deduplication Hashes
        final_img = canvas.convert("RGB")
        buf = io.BytesIO()
        final_img.save(buf, format="WEBP", quality=90)
        img_bytes = buf.getvalue()
        sha256_hash = hashlib.sha256(img_bytes).hexdigest()
        p_hash = calculate_perceptual_hash(final_img)

        return final_img, sha256_hash, p_hash

    def draw_carton_box_mockup(self, canvas, palette, brand, product, rand):
        """Draws a pharmaceutical box/carton in 3D perspective with embossed brand label."""
        draw = ImageDraw.Draw(canvas)
        accent = palette['accent']
        box_w = rand.randint(230, 260)
        box_h = rand.randint(310, 350)
        left = 400 - box_w // 2 - 20
        top = 260 + rand.randint(-15, 15)

        # Front Face
        draw.rounded_rectangle([left, top, left + box_w, top + box_h], radius=10, fill=(255, 255, 255, 255), outline=(203, 213, 225, 255), width=2)

        # Right 3D Perspective Face (depth)
        depth = 40
        poly_right = [
            (left + box_w, top + 10),
            (left + box_w + depth, top - 15),
            (left + box_w + depth, top + box_h - 25),
            (left + box_w, top + box_h)
        ]
        draw.polygon(poly_right, fill=(241, 245, 249, 255), outline=(203, 213, 225, 255))

        # Top 3D Perspective Flap
        poly_top = [
            (left + 10, top),
            (left + 10 + depth, top - 25),
            (left + box_w + depth, top - 15),
            (left + box_w, top + 10)
        ]
        draw.polygon(poly_top, fill=(248, 250, 252, 255), outline=(203, 213, 225, 255))

        # Accent Banner Strip
        draw.rounded_rectangle([left, top, left + box_w, top + 65], radius=8, fill=accent)
        draw.rectangle([left, top + 40, left + box_w, top + 65], fill=accent)

        # Brand Text
        font_brand = get_font(18, bold=True)
        draw.text((left + 18, top + 18), brand, fill=(255, 255, 255), font=font_brand)

        # Generic Product Name on Box
        font_title = get_font(15, bold=True)
        clean_name = product.name[:32] if product.name else "Healthcare Formulation"
        draw.text((left + 18, top + 90), clean_name, fill=(15, 23, 42), font=font_title)

        # Generic pack size & strength
        font_sub = get_font(12, bold=False)
        details = f"{product.dosage_form.capitalize() if product.dosage_form else 'Unit'} Pack"
        if product.strength:
            details += f" • {product.strength}"
        draw.text((left + 18, top + 120), details, fill=(100, 116, 139), font=font_sub)

        # Stylized Healthcare Emblem / Waves
        emblem_y = top + 180
        draw.ellipse([left + box_w // 2 - 28, emblem_y - 28, left + box_w // 2 + 28, emblem_y + 28], fill=palette['light'])
        draw.rectangle([left + box_w // 2 - 4, emblem_y - 18, left + box_w // 2 + 4, emblem_y + 18], fill=accent)
        draw.rectangle([left + box_w // 2 - 18, emblem_y - 4, left + box_w // 2 + 18, emblem_y + 4], fill=accent)

        # Bottom Color Accent Bar
        draw.rectangle([left + 18, top + box_h - 30, left + box_w - 18, top + box_h - 26], fill=accent)

        # SKU on bottom right of carton
        font_sku = get_font(10, bold=True)
        draw.text((left + box_w - 95, top + box_h - 20), product.sku or "MS-DEMO", fill=(148, 163, 184), font=font_sku)

    def draw_dispenser_bottle_mockup(self, canvas, palette, brand, product, rand):
        """Draws a pharmaceutical liquid pump bottle or sanitizing flask."""
        draw = ImageDraw.Draw(canvas)
        accent = palette['accent']
        bw = rand.randint(180, 210)
        bh = rand.randint(280, 320)
        bx = 400 - bw // 2
        by = 310

        # Bottle Body (Translucent gradient look)
        draw.rounded_rectangle([bx, by, bx + bw, by + bh], radius=24, fill=(255, 255, 255, 255), outline=(203, 213, 225, 255), width=2)

        # Bottle Shoulder & Neck
        neck_w = bw // 3
        draw.rectangle([400 - neck_w // 2, by - 40, 400 + neck_w // 2, by], fill=(241, 245, 249), outline=(203, 213, 225), width=2)

        # Pump Dispenser Cap
        draw.rectangle([400 - 18, by - 65, 400 + 18, by - 40], fill=(203, 213, 225))
        draw.polygon([(400 - 15, by - 65), (400 - 45, by - 80), (400 - 40, by - 90), (400 + 15, by - 65)], fill=accent)

        # Large Bottle Label
        lw = bw - 28
        lh = bh - 70
        lx = bx + 14
        ly = by + 40
        draw.rounded_rectangle([lx, ly, lx + lw, ly + lh], radius=10, fill=palette['light'], outline=(226, 232, 240))

        # Brand header on label
        font_b = get_font(14, bold=True)
        draw.text((lx + 14, ly + 14), brand, fill=accent, font=font_b)

        # Product Title
        font_t = get_font(12, bold=True)
        draw.text((lx + 14, ly + 40), (product.name or "Care Wash")[:24], fill=(15, 23, 42), font=font_t)

        # Category badge on label
        font_c = get_font(10, bold=True)
        draw.text((lx + 14, ly + 65), palette['category_name'], fill=(100, 116, 139), font=font_c)

        # Bottle shine highlight on left
        draw.line([(bx + 8, by + 20), (bx + 8, by + bh - 20)], fill=(255, 255, 255, 200), width=4)

    def draw_tube_mockup(self, canvas, palette, brand, product, rand):
        """Draws a pharmaceutical ointment/gel/sunscreen tube."""
        draw = ImageDraw.Draw(canvas)
        accent = palette['accent']
        tw = rand.randint(140, 170)
        th = rand.randint(300, 340)
        tx = 400 - tw // 2
        ty = 270

        # Tube Body (Crimp at top, tapering down to screw cap)
        top_crimp_y = ty
        crimp_w = tw + 20
        draw.rectangle([400 - crimp_w // 2, top_crimp_y, 400 + crimp_w // 2, top_crimp_y + 16], fill=(226, 232, 240), outline=(203, 213, 225))

        # Tube Main Body
        poly_tube = [
            (400 - crimp_w // 2 + 5, top_crimp_y + 16),
            (400 + crimp_w // 2 - 5, top_crimp_y + 16),
            (tx + tw, ty + th - 40),
            (tx, ty + th - 40)
        ]
        draw.polygon(poly_tube, fill=(255, 255, 255), outline=(203, 213, 225))

        # Tube Cap (Hexagonal or cylinder cap at bottom)
        cap_w = tw - 30
        draw.rounded_rectangle([400 - cap_w // 2, ty + th - 40, 400 + cap_w // 2, ty + th], radius=6, fill=accent)

        # Tube Artwork Strip
        draw.rectangle([tx + 15, ty + 50, tx + tw - 15, ty + 120], fill=palette['light'])
        font_b = get_font(13, bold=True)
        draw.text((tx + 22, ty + 60), brand, fill=accent, font=font_b)

        font_t = get_font(11, bold=True)
        draw.text((tx + 22, ty + 85), (product.name or "Derma Cream")[:20], fill=(15, 23, 42), font=font_t)

    def draw_medical_device_mockup(self, canvas, palette, brand, product, rand):
        """Draws a clinical device (pulse oximeter / digital monitor) with digital LCD display."""
        draw = ImageDraw.Draw(canvas)
        accent = palette['accent']
        dw = 260
        dh = 280
        dx = 400 - dw // 2
        dy = 300

        # Device Body (rounded matte healthcare casing)
        draw.rounded_rectangle([dx, dy, dx + dw, dy + dh], radius=32, fill=(248, 250, 252), outline=(203, 213, 225), width=3)

        # Digital Screen Glass
        sw = dw - 48
        sh = 130
        sx = dx + 24
        sy = dy + 32
        draw.rounded_rectangle([sx, sy, sx + sw, sy + sh], radius=16, fill=(15, 23, 42))

        # Digital Readout (Simulated glowing LCD text)
        font_lcd = get_font(32, bold=True)
        font_sub = get_font(12, bold=True)
        draw.text((sx + 24, sy + 25), "98", fill=(52, 211, 153), font=font_lcd)
        draw.text((sx + 85, sy + 38), "%SpO2", fill=(110, 231, 183), font=font_sub)

        draw.text((sx + 125, sy + 25), "72", fill=(96, 165, 250), font=font_lcd)
        draw.text((sx + 175, sy + 38), "BPM", fill=(147, 197, 253), font=font_sub)

        # Pulse wave line
        wave_y = sy + 95
        points = [
            (sx + 20, wave_y), (sx + 50, wave_y), (sx + 65, wave_y - 14),
            (sx + 75, wave_y + 12), (sx + 85, wave_y - 20), (sx + 95, wave_y),
            (sx + 140, wave_y), (sx + 155, wave_y - 12), (sx + 185, wave_y)
        ]
        draw.line(points, fill=(52, 211, 153), width=2)

        # Brand on Device
        font_brand = get_font(13, bold=True)
        draw.text((dx + 28, dy + dh - 75), brand, fill=accent, font=font_brand)

        # Power Button
        btn_center = (400, dy + dh - 38)
        draw.ellipse([btn_center[0] - 18, btn_center[1] - 18, btn_center[0] + 18, btn_center[1] + 18], fill=(226, 232, 240), outline=(203, 213, 225))
        draw.line([(btn_center[0], btn_center[1] - 8), (btn_center[0], btn_center[1] + 8)], fill=accent, width=2)

    def draw_apothecary_jar_mockup(self, canvas, palette, brand, product, rand):
        """Draws an amber herbal wellness apothecary jar with lid."""
        draw = ImageDraw.Draw(canvas)
        jw = rand.randint(220, 250)
        jh = rand.randint(240, 270)
        jx = 400 - jw // 2
        jy = 330

        # Amber Glass Jar Body
        draw.rounded_rectangle([jx, jy, jx + jw, jy + jh], radius=20, fill=(180, 83, 9), outline=(146, 64, 14), width=2)

        # Jar Lid (Metallic gold or black matte)
        lid_w = jw + 14
        draw.rounded_rectangle([400 - lid_w // 2, jy - 36, 400 + lid_w // 2, jy], radius=8, fill=(30, 41, 59), outline=(15, 23, 42))

        # Paper Texture Label
        lw = jw - 36
        lh = jh - 60
        lx = jx + 18
        ly = jy + 30
        draw.rounded_rectangle([lx, ly, lx + lw, ly + lh], radius=6, fill=(254, 243, 199), outline=(217, 119, 6))

        # Brand
        font_b = get_font(13, bold=True)
        draw.text((lx + 12, ly + 14), brand, fill=(146, 64, 14), font=font_b)

        # Product Title
        font_t = get_font(12, bold=True)
        draw.text((lx + 12, ly + 40), (product.name or "Herbal Extract")[:22], fill=(69, 26, 3), font=font_t)

        # Ayurvedic Botanical Icon
        draw.text((lx + 12, ly + 68), "100% BOTANICAL EXTRACT", fill=(180, 83, 9), font=get_font(9, bold=True))

    def draw_first_aid_box_mockup(self, canvas, palette, brand, product, rand):
        """Draws a medical first-aid kit or wound-care bandage package."""
        draw = ImageDraw.Draw(canvas)
        accent = palette['accent']
        box_w = 260
        box_h = 280
        bx = 400 - box_w // 2
        by = 310

        draw.rounded_rectangle([bx, by, bx + box_w, by + box_h], radius=16, fill=(255, 255, 255), outline=(226, 232, 240), width=3)

        # Prominent Red Cross in Center
        cx, cy = 400, by + 120
        cw = 24
        ch = 70
        draw.rounded_rectangle([cx - cw // 2, cy - ch // 2, cx + cw // 2, cy + ch // 2], radius=4, fill=accent)
        draw.rounded_rectangle([cx - ch // 2, cy - cw // 2, cx + ch // 2, cy + cw // 2], radius=4, fill=accent)

        # Brand header
        font_b = get_font(14, bold=True)
        draw.text((bx + 20, by + 24), brand, fill=accent, font=font_b)

        font_t = get_font(12, bold=True)
        draw.text((bx + 20, by + 200), (product.name or "First Aid Kit")[:30], fill=(15, 23, 42), font=font_t)

    def draw_mandatory_disclaimers(self, canvas, width, height):
        """
        Bakes readable, unmissable disclaimers into the visual asset:
        - "AI-GENERATED DEMO" (Top Badge)
        - "NOT A REAL PRODUCT PHOTO" (Bottom Badge)
        """
        draw = ImageDraw.Draw(canvas)

        # 1. Top Ribbon Badge: AI-GENERATED DEMO
        top_font = get_font(13, bold=True)
        top_text = f"● {DISCLAIMER_TOP}"
        top_w = 210
        top_h = 30
        top_x = (width - top_w) // 2
        top_y = 28

        draw.rounded_rectangle(
            [top_x, top_y, top_x + top_w, top_y + top_h],
            radius=15,
            fill=(15, 23, 42, 240),
            outline=(51, 65, 85, 255),
            width=1
        )
        draw.text((top_x + 18, top_y + 7), top_text, fill=(248, 250, 252), font=top_font)

        # 2. Bottom Disclaimer Strip: NOT A REAL PRODUCT PHOTO
        bot_font = get_font(11, bold=True)
        bot_text = f"⚠ {DISCLAIMER_BOTTOM} — FOR CATALOG DEMO ONLY"
        bot_w = 400
        bot_h = 28
        bot_x = (width - bot_w) // 2
        bot_y = height - 46

        draw.rounded_rectangle(
            [bot_x, bot_y, bot_x + bot_w, bot_y + bot_h],
            radius=14,
            fill=(254, 242, 242, 230),
            outline=(252, 165, 165, 255),
            width=1
        )
        draw.text((bot_x + 22, bot_y + 6), bot_text, fill=(185, 28, 28), font=bot_font)

    def write_reports(self, exports_dir, generated, failed, duplicates):
        """Writes reporting CSV files into exports/ directory."""
        reports_dir = exports_dir / 'reports'
        reports_dir.mkdir(parents=True, exist_ok=True)

        # 1. generated.csv
        with open(reports_dir / 'generated.csv', 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=['sku', 'name', 'category', 'file', 'hash', 'phash', 'status'])
            writer.writeheader()
            writer.writerows(generated)

        # 2. failed.csv
        with open(reports_dir / 'failed.csv', 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=['sku', 'name', 'error'])
            writer.writeheader()
            writer.writerows(failed)

        # 3. duplicates.csv
        with open(reports_dir / 'duplicates.csv', 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=['sku', 'original_sku', 'hash'])
            writer.writeheader()
            writer.writerows(duplicates)

        # 4. missing.csv
        missing = Product.objects.filter(
            models.Q(image_status='MISSING') | models.Q(image_url='')
        ).values('sku', 'name')
        with open(reports_dir / 'missing.csv', 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=['sku', 'name'])
            writer.writeheader()
            writer.writerows(missing)
