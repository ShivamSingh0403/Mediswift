import re
import time
import urllib.parse
import urllib.request
import json
import logging
from typing import Dict, Any, List, Optional, Tuple
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.products.models import Product, ProductImageCandidate

logger = logging.getLogger(__name__)

# Permitted domains and registries
PERMITTED_DOMAINS = {
    'dailymed.nlm.nih.gov': {
        'source_type': 'dailymed',
        'license': 'Public Domain (U.S. National Library of Medicine / NIH)',
        'license_url': 'https://dailymed.nlm.nih.gov/dailymed/about.cfm',
        'rights_note': 'U.S. Federal Government work; public domain.',
    },
    'openfoodfacts.org': {
        'source_type': 'openfoodfacts',
        'license': 'Open Database License (ODbL) / CC-BY-SA',
        'license_url': 'https://world.openfoodfacts.org/legal',
        'rights_note': 'Open Food Facts community contributed images under CC-BY-SA 4.0 / ODbL.',
    },
    'openbeautyfacts.org': {
        'source_type': 'openbeautyfacts',
        'license': 'Open Database License (ODbL) / CC-BY-SA',
        'license_url': 'https://world.openbeautyfacts.org/legal',
        'rights_note': 'Open Beauty Facts database under ODbL.',
    }
}

DISALLOWED_DOMAINS = {
    'google.com', 'images.google.com', 'googleusercontent.com',
    'bing.com', 'pinterest.com', 'shutterstock.com', 'gettyimages.com',
    'istockphoto.com', 'alamy.com', '123rf.com', 'dreamstime.com'
}

USER_AGENT = 'MediSwift-ImageDiscovery/2.0 (Medical Catalog Auditing; https://mediswift.org/compliance; contact: compliance@mediswift.org)'

def extract_strength(text: str) -> Optional[str]:
    """Extracts dosage strength like 650mg, 500 mg, 10ml, 1% etc."""
    if not text:
        return None
    match = re.search(r'(\d+(?:\.\d+)?\s*(?:mg|g|mcg|ml|iu|%|w/v|w/w))', text, re.IGNORECASE)
    if match:
        return re.sub(r'\s+', '', match.group(1).lower())
    return None

def extract_form(text: str) -> Optional[str]:
    """Extracts dosage form like tablet, capsule, syrup, gel, injection, strip."""
    if not text:
        return None
    forms = ['tablet', 'tablets', 'capsule', 'capsules', 'syrup', 'suspension', 'gel', 'cream', 'ointment', 'injection', 'drops', 'inhaler', 'strip']
    lower = text.lower()
    for f in forms:
        if re.search(r'\b' + f + r'\b', lower):
            return f.rstrip('s')
    return None

def compute_similarity(product: Product, candidate_name: str, candidate_brand: str = '') -> Tuple[float, List[str]]:
    """
    Computes strict matching confidence score (0.0 to 1.0) and lists mismatch flags.
    """
    p_name = product.name.lower()
    p_brand = (product.brand.name.lower() if product.brand else '')
    c_name = candidate_name.lower()
    c_brand = candidate_brand.lower() if candidate_brand else ''

    flags = []
    score = 0.0

    # 1. Product Title Matching (Core Active Ingredient or Brand Keyword)
    # Extract significant alphanumeric tokens (> 3 chars)
    p_tokens = set(re.findall(r'[a-z0-9]{3,}', p_name))
    c_tokens = set(re.findall(r'[a-z0-9]{3,}', c_name))

    if not p_tokens:
        return 0.0, ['NO_PRODUCT_TOKENS']

    overlap = p_tokens.intersection(c_tokens)
    overlap_ratio = len(overlap) / max(len(p_tokens), 1)

    if overlap_ratio > 0.6:
        score += 0.40
    elif overlap_ratio > 0.3:
        score += 0.20
    else:
        flags.append('LOW_NAME_SIMILARITY')

    # 2. Brand Matching
    if p_brand and c_brand:
        if p_brand in c_brand or c_brand in p_brand:
            score += 0.25
        else:
            flags.append('BRAND_MISMATCH')
    elif p_brand and p_brand in c_name:
        score += 0.20
    else:
        # Neutral if brand unspecified in external record
        score += 0.10

    # 3. Strength Check (Strict!)
    p_strength = extract_strength(product.name) or extract_strength(product.composition)
    c_strength = extract_strength(candidate_name)

    if p_strength and c_strength:
        if p_strength == c_strength:
            score += 0.25
        else:
            # Different strength is a medical mismatch!
            flags.append(f'STRENGTH_MISMATCH (Expected: {p_strength}, Found: {c_strength})')
            score -= 0.30
    elif p_strength and not c_strength:
        score += 0.10
    else:
        score += 0.15

    # 4. Form Check
    p_form = extract_form(product.name) or extract_form(product.dosage_form)
    c_form = extract_form(candidate_name)

    if p_form and c_form:
        if p_form == c_form:
            score += 0.15
        else:
            flags.append(f'FORM_MISMATCH (Expected: {p_form}, Found: {c_form})')
            score -= 0.20
    else:
        score += 0.10

    normalized_score = max(0.0, min(1.0, round(score, 2)))
    return normalized_score, flags


def search_dailymed(query: str) -> List[Dict[str, Any]]:
    """
    Queries DailyMed public REST API for drug package photos.
    https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json
    """
    clean_query = re.sub(r'[^a-zA-Z0-9 ]', '', query).strip().split()[0] if query else ''
    if not clean_query or len(clean_query) < 3:
        return []

    url = f"https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json?drug_name={urllib.parse.quote(clean_query)}&pagesize=5"
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})

    candidates = []
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode('utf-8'))
                spl_items = data.get('data', [])
                for item in spl_items[:3]:
                    setid = item.get('setid')
                    title = item.get('title', '')
                    if not setid:
                        continue
                    # Fetch media list for this SPL setid
                    media_url = f"https://dailymed.nlm.nih.gov/dailymed/services/v2/spls/{setid}/media.json"
                    time.sleep(0.3)
                    media_req = urllib.request.Request(media_url, headers={'User-Agent': USER_AGENT})
                    try:
                        with urllib.request.urlopen(media_req, timeout=6) as mresp:
                            if mresp.status == 200:
                                mdata = json.loads(mresp.read().decode('utf-8'))
                                media_list = mdata.get('data', {}).get('media', [])
                                for m in media_list:
                                    mime = m.get('mime_type', '')
                                    file_url = m.get('url', '')
                                    m_name = m.get('name', '')
                                    if 'image' in mime and file_url:
                                        candidates.append({
                                            'candidate_image_url': file_url,
                                            'source_page_url': f"https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid={setid}",
                                            'source_domain': 'dailymed.nlm.nih.gov',
                                            'source_type': 'dailymed',
                                            'image_title': m_name or title,
                                            'detected_alt_text': title,
                                            'license_url': PERMITTED_DOMAINS['dailymed.nlm.nih.gov']['license_url'],
                                            'rights_note': PERMITTED_DOMAINS['dailymed.nlm.nih.gov']['rights_note'],
                                            'external_title': title,
                                        })
                    except Exception:
                        pass
    except Exception as e:
        logger.debug(f"DailyMed query failed: {e}")

    return candidates


def search_openfoodfacts(query: str) -> List[Dict[str, Any]]:
    """
    Queries Open Food/Products Facts public API for licensed package photos.
    """
    clean_query = query.strip()
    if not clean_query:
        return []

    url = f"https://world.openfoodfacts.org/cgi/search.pl?search_terms={urllib.parse.quote(clean_query)}&search_simple=1&action=process&json=1&page_size=5"
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})

    candidates = []
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode('utf-8'))
                products = data.get('products', [])
                for prod in products:
                    pname = prod.get('product_name', '')
                    brand = prod.get('brands', '')
                    code = prod.get('code', '')
                    # Front image URL
                    img_url = prod.get('image_front_url') or prod.get('image_url')
                    if img_url:
                        candidates.append({
                            'candidate_image_url': img_url,
                            'source_page_url': f"https://world.openfoodfacts.org/product/{code}",
                            'source_domain': 'openfoodfacts.org',
                            'source_type': 'openfoodfacts',
                            'image_title': f"{pname} ({brand})",
                            'detected_alt_text': pname,
                            'license_url': PERMITTED_DOMAINS['openfoodfacts.org']['license_url'],
                            'rights_note': PERMITTED_DOMAINS['openfoodfacts.org']['rights_note'],
                            'external_title': f"{pname} {brand}",
                            'candidate_brand': brand,
                        })
    except Exception as e:
        logger.debug(f"OpenFoodFacts query failed: {e}")

    return candidates


class Command(BaseCommand):
    help = "Discovers real medicine package photographs from strictly permitted, legally auditable public sources."

    def add_arguments(self, parser):
        parser.add_argument('--sku', type=str, help="Run discovery for a specific product SKU only.")
        parser.add_argument('--limit', type=int, default=15, help="Number of products to search for (default: 15; 0 for all).")
        parser.add_argument('--source', type=str, default='all', choices=['all', 'dailymed', 'openfoodfacts'], help="Filter by registry source.")

    def handle(self, *args, **options):
        sku = options.get('sku')
        limit = options.get('limit')
        source_filter = options.get('source')

        self.stdout.write(self.style.MIGRATE_HEADING("\n=== MEDISWIFT WEB PRODUCT IMAGE DISCOVERY & MATCHING ENGINE ==="))
        self.stdout.write("Strict Legal & Compliance Rules:")
        self.stdout.write(" - AI-generated images prohibited.")
        self.stdout.write(" - Google Images scraping prohibited.")
        self.stdout.write(" - Only approved public registries (DailyMed, Open Food Facts) are queried.")
        self.stdout.write(" - Strict dosage/strength matching enforced.\n")

        products = Product.objects.all().order_by('id')
        if sku:
            products = products.filter(sku__iexact=sku.strip())
            if not products.exists():
                self.stderr.write(f"Error: Product with SKU '{sku}' not found.")
                return
        else:
            # Prioritize products currently MISSING images
            products = products.filter(image_status__in=['MISSING', 'REJECTED'])
            if limit > 0:
                products = products[:limit]

        total_products = products.count()
        self.stdout.write(f"Processing image discovery for {total_products} product(s)...\n")

        discovered_count = 0
        pending_review_count = 0
        rights_unknown_count = 0
        mismatch_count = 0
        blocked_count = 0
        new_candidates = 0

        for idx, product in enumerate(products, 1):
            self.stdout.write(f"[{idx}/{total_products}] Searching for {product.name} (SKU: {product.sku}, Brand: {product.brand.name if product.brand else 'N/A'})...")

            candidate_records = []

            # Determine queries: brand + name, active composition, primary brand
            q_terms = [product.name]
            if product.brand and product.brand.name.lower() not in product.name.lower():
                q_terms.append(f"{product.brand.name} {product.name}")
            if product.composition and product.composition != product.name:
                # Add primary ingredient
                ing = product.composition.split(',')[0].split('+')[0].strip()
                if len(ing) > 3:
                    q_terms.append(ing)

            # Query Permitted Registries
            for term in q_terms[:2]:
                if source_filter in ('all', 'dailymed'):
                    time.sleep(0.5)  # Rate limiting compliance
                    cand_dm = search_dailymed(term)
                    candidate_records.extend(cand_dm)

                if source_filter in ('all', 'openfoodfacts'):
                    time.sleep(0.5)  # Rate limiting compliance
                    cand_off = search_openfoodfacts(term)
                    candidate_records.extend(cand_off)

            if not candidate_records:
                self.stdout.write(f"   -> No candidates discovered on permitted registries.")
                continue

            # Process candidates with strict matching and rights evaluation
            seen_urls_in_batch = set()
            for cand in candidate_records:
                cand_url = cand['candidate_image_url']
                if cand_url in seen_urls_in_batch:
                    continue
                seen_urls_in_batch.add(cand_url)

                domain = cand.get('source_domain', '')

                # 1. Check prohibited domains
                if any(disallowed in domain for disallowed in DISALLOWED_DOMAINS):
                    blocked_count += 1
                    status = ProductImageCandidate.CandidateStatus.BLOCKED_SOURCE
                    reason = f"Prohibited source domain: {domain}"
                    confidence = 0.0
                else:
                    # 2. Compute similarity & check mismatches
                    confidence, mismatch_flags = compute_similarity(
                        product=product,
                        candidate_name=cand.get('external_title', cand.get('image_title', '')),
                        candidate_brand=cand.get('candidate_brand', '')
                    )

                    has_strength_or_form_mismatch = any('MISMATCH' in f for f in mismatch_flags)

                    # 3. Determine status and rights
                    if has_strength_or_form_mismatch:
                        mismatch_count += 1
                        status = ProductImageCandidate.CandidateStatus.PRODUCT_MISMATCH
                        reason = f"Catalog attribute mismatch: {'; '.join(mismatch_flags)}"
                    elif domain not in PERMITTED_DOMAINS:
                        rights_unknown_count += 1
                        status = ProductImageCandidate.CandidateStatus.RIGHTS_UNKNOWN
                        reason = "Source domain not in authorized registry list; usage permission unconfirmed."
                        cand['rights_note'] = "Usage permission has not been confirmed."
                    elif confidence >= 0.70:
                        pending_review_count += 1
                        status = ProductImageCandidate.CandidateStatus.PENDING_REVIEW
                        reason = f"High confidence match ({confidence * 100:.0f}%). Ready for admin review."
                    else:
                        discovered_count += 1
                        status = ProductImageCandidate.CandidateStatus.DISCOVERED
                        reason = f"Candidate discovered with confidence {confidence * 100:.0f}%. Requires manual review."

                # Save or update candidate
                candidate_obj, created = ProductImageCandidate.objects.update_or_create(
                    product=product,
                    candidate_image_url=cand_url,
                    defaults={
                        'sku': product.sku,
                        'product_name': product.name,
                        'brand': product.brand.name if product.brand else '',
                        'source_page_url': cand.get('source_page_url', ''),
                        'source_domain': domain,
                        'source_type': cand.get('source_type', 'public_registry'),
                        'image_title': cand.get('image_title', '')[:250],
                        'detected_alt_text': cand.get('detected_alt_text', '')[:500],
                        'rights_note': cand.get('rights_note', 'Usage permission has not been confirmed.'),
                        'license_url': cand.get('license_url', ''),
                        'matching_confidence': confidence,
                        'status': status,
                        'review_reason': reason,
                    }
                )

                if created:
                    new_candidates += 1

                self.stdout.write(f"   [Found {status}] Conf: {confidence:.2f} | {cand_url[:65]}...")

        self.stdout.write(self.style.SUCCESS("\n=== DISCOVERY RUN SUMMARY ==="))
        self.stdout.write(f"Total Products Evaluated: {total_products}")
        self.stdout.write(f"New Candidates Stored:    {new_candidates}")
        self.stdout.write(f"Pending Review:           {pending_review_count}")
        self.stdout.write(f"Discovered:               {discovered_count}")
        self.stdout.write(f"Product Mismatches:       {mismatch_count}")
        self.stdout.write(f"Rights Unknown:           {rights_unknown_count}")
        self.stdout.write(f"Blocked Sources:          {blocked_count}")
        self.stdout.write("=" * 30 + "\n")
