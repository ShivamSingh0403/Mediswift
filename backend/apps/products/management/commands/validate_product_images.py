import os
import sys
import hashlib
from pathlib import Path
from PIL import Image
from django.core.management.base import BaseCommand
from django.conf import settings
from apps.products.models import Product, ProductImage

VALID_IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.avif', '.svg'}

class Command(BaseCommand):
    help = "Validates the health, completeness, and regulatory compliance of MediSwift product images."

    def add_arguments(self, parser):
        parser.add_argument(
            '--json',
            action='store_true',
            help="Output metrics as JSON."
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("\n=== MEDISWIFT PRODUCT IMAGE AUDIT & COMPLIANCE VALIDATOR ==="))

        # Directory references
        media_root = Path(settings.MEDIA_ROOT)
        dirs_to_check = [
            media_root / 'product_images' / 'verified',
            media_root / 'product_images' / 'pending_review',
            media_root / 'product_images' / 'rejected',
            media_root / 'products' / 'packshots',
        ]
        for d in dirs_to_check:
            d.mkdir(parents=True, exist_ok=True)

        all_products = Product.objects.all().prefetch_related('images')
        total_products = all_products.count()

        # SKU lookup for exact matching
        all_skus = set(all_products.values_list('sku', flat=True))
        sku_lookup = {sku.strip().upper(): sku for sku in all_skus if sku}

        # 1. Missing Images & Statuses
        verified_count = 0
        missing_count = 0
        pending_review_count = 0
        rejected_count = 0
        broken_count = 0
        duplicate_status_count = 0

        # Audit lists
        broken_files = []
        invalid_formats = []
        duplicate_hashes = []
        duplicate_urls = []
        unmatched_skus = []
        missing_alt_text = []
        missing_source_url = []
        missing_license_note = []
        products_without_primary = []
        incorrectly_marked_verified = []

        seen_sha256 = {}
        seen_urls = {}

        for p in all_products:
            pimg = p.images.filter(is_primary=True).first() or p.images.first()

            # Determine effective image
            has_image = bool(p.image_url) or (pimg and bool(pimg.image_file or pimg.image))

            if not has_image or p.image_status == 'MISSING':
                missing_count += 1
            elif p.image_status == 'VERIFIED' or (pimg and pimg.image_status == 'VERIFIED'):
                verified_count += 1
            elif p.image_status in ('PENDING_REVIEW', 'DOWNLOADED') or (pimg and pimg.image_status in ('PENDING_REVIEW', 'DOWNLOADED')):
                pending_review_count += 1
            elif p.image_status == 'REJECTED' or (pimg and pimg.image_status == 'REJECTED'):
                rejected_count += 1
            elif p.image_status == 'BROKEN' or (pimg and pimg.image_status == 'BROKEN'):
                broken_count += 1
            elif p.image_status == 'DUPLICATE' or (pimg and pimg.image_status == 'DUPLICATE'):
                duplicate_status_count += 1

            # Primary image check
            if not has_image:
                products_without_primary.append(p.sku)

            # Metadata checks if product has image
            if has_image:
                # Alt text check
                alt = p.image_alt_text or (pimg.alt_text if pimg else '')
                if not alt.strip():
                    missing_alt_text.append(p.sku)

                # Source URL check
                src_url = p.source_url or (pimg.source_url if pimg else '')
                if not src_url.strip():
                    missing_source_url.append(p.sku)

                # License note check
                lic = p.image_license or (pimg.license_note if pimg else '') or (pimg.license if pimg else '')
                if not lic.strip():
                    missing_license_note.append(p.sku)

                # Duplicate URL check
                active_url = p.image_url or (pimg.image_url if pimg else '')
                if active_url:
                    if active_url in seen_urls:
                        duplicate_urls.append((p.sku, seen_urls[active_url], active_url))
                    else:
                        seen_urls[active_url] = p.sku

                # Broken file check
                file_field = (pimg.image_file or pimg.image) if pimg else None
                if file_field and file_field.name:
                    disk_path = media_root / file_field.name
                    if not disk_path.exists():
                        broken_files.append((p.sku, str(file_field.name), "Local media file not found on disk"))
                    else:
                        # Verify integrity with Pillow
                        try:
                            with Image.open(disk_path) as im:
                                im.verify()
                        except Exception as e:
                            invalid_formats.append((p.sku, disk_path.name, f"Corrupted image: {e}"))

                        # Compute SHA-256
                        try:
                            with open(disk_path, 'rb') as f_h:
                                sha = hashlib.sha256(f_h.read()).hexdigest()
                                if sha in seen_sha256:
                                    duplicate_hashes.append((p.sku, seen_sha256[sha], disk_path.name))
                                else:
                                    seen_sha256[sha] = p.sku
                        except Exception:
                            pass

                # Incorrectly marked VERIFIED check
                if p.image_status == 'VERIFIED' or (pimg and pimg.image_status == 'VERIFIED'):
                    ver_by = p.verified_by or (pimg.verified_by if pimg else '')
                    if not ver_by.strip():
                        incorrectly_marked_verified.append((p.sku, "Status is VERIFIED but 'verified_by' is blank"))
                    elif file_field and file_field.name:
                        if 'verified' not in file_field.name.lower():
                            incorrectly_marked_verified.append((p.sku, f"Status is VERIFIED but file is in unverified path: {file_field.name}"))

        # Scan filesystem folders for unmatched or invalid files
        for search_dir in dirs_to_check:
            if search_dir.exists():
                for item in search_dir.iterdir():
                    if item.is_file():
                        ext = item.suffix.lower()
                        if ext not in VALID_IMAGE_EXTENSIONS:
                            invalid_formats.append(('N/A', item.name, f"Invalid image extension: '{ext}'"))
                            continue

                        stem = item.stem.strip().upper()
                        stem_prefix = stem.split('_')[0]
                        if stem not in sku_lookup and stem_prefix not in sku_lookup:
                            unmatched_skus.append(item.name)


        # Unique counts
        from apps.products.models import ProductImageCandidate
        candidates = ProductImageCandidate.objects.all()
        cand_total = candidates.count()
        cand_rights_unknown = candidates.filter(status=ProductImageCandidate.CandidateStatus.RIGHTS_UNKNOWN).count()
        cand_mismatch = candidates.filter(status=ProductImageCandidate.CandidateStatus.PRODUCT_MISMATCH).count()
        cand_pending = candidates.filter(status=ProductImageCandidate.CandidateStatus.PENDING_REVIEW).count()
        cand_downloaded = candidates.filter(status=ProductImageCandidate.CandidateStatus.DOWNLOADED).count()
        cand_blocked = candidates.filter(status=ProductImageCandidate.CandidateStatus.BLOCKED_SOURCE).count()

        report = {
            "total_products": total_products,
            "verified_images": verified_count,
            "missing_product_images": missing_count,
            "pending_review_images": pending_review_count,
            "broken_files": len(broken_files) + broken_count,
            "invalid_formats": len(invalid_formats),
            "duplicate_hashes": len(duplicate_hashes) + duplicate_status_count,
            "duplicate_urls": len(duplicate_urls),
            "unmatched_skus": len(unmatched_skus),
            "missing_alt_text": len(missing_alt_text),
            "missing_source_url": len(missing_source_url),
            "missing_license_note": len(missing_license_note),
            "products_without_primary_images": len(products_without_primary),
            "images_incorrectly_marked_verified": len(incorrectly_marked_verified),
            "discovered_candidates_total": cand_total,
            "candidates_pending_review": cand_pending,
            "candidates_downloaded": cand_downloaded,
            "candidates_rights_unknown": cand_rights_unknown,
            "candidates_product_mismatch": cand_mismatch,
            "candidates_blocked_source": cand_blocked,
        }

        if options['json']:
            import json
            self.stdout.write(json.dumps(report, indent=2))
            return

        self.stdout.write("-------------------------------------------------------")
        self.stdout.write(f"1.  Total products in catalog:         {total_products:>6}")
        self.stdout.write(f"2.  Verified authentic packaging:      {verified_count:>6}")
        self.stdout.write(f"3.  Missing product images:            {missing_count:>6}")
        self.stdout.write(f"4.  Pending-review images:             {pending_review_count:>6}")
        self.stdout.write(f"5.  Broken files:                      {len(broken_files) + broken_count:>6}")
        self.stdout.write(f"6.  Invalid formats:                   {len(invalid_formats):>6}")
        self.stdout.write(f"7.  Duplicate SHA-256 hashes:          {len(duplicate_hashes) + duplicate_status_count:>6}")
        self.stdout.write(f"8.  Duplicate URLs:                    {len(duplicate_urls):>6}")
        self.stdout.write(f"9.  Unmatched image SKUs:              {len(unmatched_skus):>6}")
        self.stdout.write(f"10. Missing alt text:                  {len(missing_alt_text):>6}")
        self.stdout.write(f"11. Missing source URL:                {len(missing_source_url):>6}")
        self.stdout.write(f"12. Missing license note:              {len(missing_license_note):>6}")
        self.stdout.write(f"13. Products without primary images:   {len(products_without_primary):>6}")
        self.stdout.write(f"14. Incorrectly marked VERIFIED:       {len(incorrectly_marked_verified):>6}")
        self.stdout.write("-------------------------------------------------------")
        self.stdout.write("WEB DISCOVERY & CANDIDATE AUDIT:")
        self.stdout.write(f"15. Total discovered candidates:       {cand_total:>6}")
        self.stdout.write(f"16. Candidates pending review:         {cand_pending:>6}")
        self.stdout.write(f"17. Candidates downloaded:             {cand_downloaded:>6}")
        self.stdout.write(f"18. Rights unknown warnings:           {cand_rights_unknown:>6}")
        self.stdout.write(f"19. Product mismatches flagged:        {cand_mismatch:>6}")
        self.stdout.write(f"20. Prohibited/blocked sources:        {cand_blocked:>6}")
        self.stdout.write("-------------------------------------------------------")

        if incorrectly_marked_verified:
            self.stdout.write(self.style.ERROR(f"\n[!] Images Incorrectly Marked VERIFIED ({len(incorrectly_marked_verified)}):"))
            for sku, reason in incorrectly_marked_verified[:10]:
                self.stdout.write(f"  - SKU {sku}: {reason}")

        if broken_files:
            self.stdout.write(self.style.ERROR(f"\n[!] Broken Files Detected ({len(broken_files)}):"))
            for sku, fn, reason in broken_files[:10]:
                self.stdout.write(f"  - SKU {sku}: {fn} ({reason})")

        if duplicate_hashes:
            self.stdout.write(self.style.WARNING(f"\n[!] Duplicate SHA-256 Hashes ({len(duplicate_hashes)}):"))
            for sku, orig_sku, fn in duplicate_hashes[:10]:
                self.stdout.write(f"  - SKU {sku} duplicates SKU {orig_sku} (file: {fn})")

        if unmatched_skus:
            self.stdout.write(self.style.WARNING(f"\n[!] Unmatched Image Filenames ({len(unmatched_skus)}):"))
            for fn in unmatched_skus[:10]:
                self.stdout.write(f"  - {fn}")

        self.stdout.write(self.style.SUCCESS("\n[OK] Validation and discovery audit complete.\n"))

