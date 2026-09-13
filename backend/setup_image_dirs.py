import os
from pathlib import Path
from PIL import Image, ImageDraw

base_dir = Path(r'C:\Users\user\Downloads\Mediswift')

dirs = [
    base_dir / 'backend' / 'media' / 'product_images' / 'verified',
    base_dir / 'backend' / 'media' / 'product_images' / 'pending_review',
    base_dir / 'backend' / 'media' / 'product_images' / 'rejected',
    base_dir / 'backend' / 'media' / 'product_images' / 'placeholders',
    base_dir / 'frontend' / 'public' / 'product-images',
    base_dir / 'exports' / 'product-images',
]

for d in dirs:
    d.mkdir(parents=True, exist_ok=True)
    print(f"Directory created/verified: {d}")

svg_content = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F0FDFA" />
      <stop offset="50%" stop-color="#F8FAFC" />
      <stop offset="100%" stop-color="#E2E8F0" />
    </linearGradient>
  </defs>
  <rect width="600" height="600" fill="url(#bg)" rx="32" stroke="#99F6E4" stroke-width="4" />
  
  <g transform="translate(50, 45)">
    <rect width="200" height="36" rx="18" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" />
    <text x="100" y="23" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#334155" text-anchor="middle">CLINICAL SPECIFICATION</text>
  </g>
  <g transform="translate(360, 45)">
    <rect width="190" height="36" rx="18" fill="#FEF3C7" stroke="#FDE68A" stroke-width="1.5" />
    <text x="95" y="23" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#92400E" text-anchor="middle">IMAGE UNDER REVIEW</text>
  </g>

  <circle cx="300" cy="270" r="85" fill="#CCFBF1" stroke="#5EEAD4" stroke-width="4" />
  <circle cx="300" cy="270" r="70" fill="#00A896" />
  <path d="M282 225 h36 v27 h27 v36 h-27 v27 h-36 v-27 h-27 v-36 h27 z" fill="#FFFFFF" />

  <text x="300" y="410" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#0F172A" text-anchor="middle">Product image under verification</text>
  <text x="300" y="440" font-family="Arial, sans-serif" font-size="14" fill="#64748B" text-anchor="middle">Official packaging photo will be displayed once authenticated</text>
  
  <line x1="80" y1="510" x2="520" y2="510" stroke="#CBD5E1" stroke-width="1" stroke-dasharray="4 4" />
  <text x="300" y="545" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#00A896" text-anchor="middle">MediSwift Verified Healthcare Network</text>
</svg>"""

svg_path_backend = base_dir / 'backend' / 'media' / 'product_images' / 'placeholders' / 'placeholder.svg'
svg_path_frontend = base_dir / 'frontend' / 'public' / 'product-images' / 'placeholder.svg'

svg_path_backend.write_text(svg_content, encoding='utf-8')
svg_path_frontend.write_text(svg_content, encoding='utf-8')
print("Generated placeholder.svg in backend and frontend public.")

img = Image.new('RGBA', (600, 600), (240, 253, 250, 255))
draw = ImageDraw.Draw(img)
draw.rounded_rectangle([10, 10, 590, 590], radius=32, outline=(153, 246, 228, 255), width=4, fill=(248, 250, 252, 255))
draw.ellipse([215, 185, 385, 355], fill=(204, 251, 241, 255), outline=(94, 234, 212, 255), width=3)
draw.ellipse([230, 200, 370, 340], fill=(0, 168, 150, 255))
draw.rectangle([282, 225, 318, 315], fill=(255, 255, 255, 255))
draw.rectangle([255, 252, 345, 288], fill=(255, 255, 255, 255))

png_path_backend = base_dir / 'backend' / 'media' / 'product_images' / 'placeholders' / 'placeholder.png'
png_path_frontend = base_dir / 'frontend' / 'public' / 'product-images' / 'placeholder.png'
img.save(png_path_backend)
img.save(png_path_frontend)
print("Generated placeholder.png in backend and frontend public.")
