import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

import zipfile
from pathlib import Path
from django.conf import settings
from django.core.management import call_command
from rest_framework.test import APIClient
from apps.products.models import Product, ProductImage, ProductImageCandidate

def run_tests():
    print("==================================================")
    print("STARTING IMAGE DISCOVERY & CANDIDATE SYSTEM SUITE")
    print("==================================================")

    # 1. Candidate model & status integrity
    print("\n--- 1. Testing ProductImageCandidate Model ---")
    prod = Product.objects.first()
    assert prod is not None, "Product catalog must not be empty"

    cand = ProductImageCandidate.objects.create(
        product=prod,
        sku=prod.sku,
        product_name=prod.name,
        candidate_image_url="https://dailymed.nlm.nih.gov/dailymed/test_photo.jpg",
        source_domain="dailymed.nlm.nih.gov",
        source_type="dailymed",
        matching_confidence=0.88,
        status=ProductImageCandidate.CandidateStatus.PENDING_REVIEW,
        rights_note="Public Domain (U.S. National Library of Medicine / NIH)"
    )
    assert cand.id is not None
    assert cand.status == 'PENDING_REVIEW'
    print(f"[PASS] Created candidate {cand.id} with confidence {cand.matching_confidence}")

    # 2. Test API Endpoints
    print("\n--- 2. Testing Candidate API Endpoints ---")
    client = APIClient()

    # Stats endpoint
    res_stats = client.get('/api/v1/products/candidates/stats/')
    assert res_stats.status_code == 200, f"Stats endpoint failed: {res_stats.status_code}"
    stats_data = res_stats.json()['data']
    assert 'total' in stats_data
    assert 'pending_review' in stats_data
    print(f"[PASS] Stats endpoint returned {stats_data['total']} total candidates")

    # List endpoint
    res_list = client.get('/api/v1/products/candidates/')
    assert res_list.status_code == 200, f"List endpoint failed: {res_list.status_code}"
    print(f"[PASS] Candidate list endpoint returned 200 OK")

    # Action: Approve for download
    res_act1 = client.post(f'/api/v1/products/candidates/{cand.id}/action/', {
        'action': 'approve_for_download'
    })
    assert res_act1.status_code == 200
    cand.refresh_from_db()
    assert cand.status == ProductImageCandidate.CandidateStatus.APPROVED_FOR_DOWNLOAD
    print(f"[PASS] Candidate action 'approve_for_download' succeeded -> status: {cand.status}")

    # Action: Flag rights unknown
    res_act2 = client.post(f'/api/v1/products/candidates/{cand.id}/action/', {
        'action': 'mark_rights_unknown'
    })
    assert res_act2.status_code == 200
    cand.refresh_from_db()
    assert cand.status == ProductImageCandidate.CandidateStatus.RIGHTS_UNKNOWN
    assert cand.rights_note == "Usage permission has not been confirmed."
    print(f"[PASS] Candidate action 'mark_rights_unknown' succeeded -> rights_note: '{cand.rights_note}'")

    # Action: Flag product mismatch
    res_act3 = client.post(f'/api/v1/products/candidates/{cand.id}/action/', {
        'action': 'mark_mismatch',
        'reason': 'Strength mismatch: Catalog is 650mg, candidate is 500mg'
    })
    assert res_act3.status_code == 200
    cand.refresh_from_db()
    assert cand.status == ProductImageCandidate.CandidateStatus.PRODUCT_MISMATCH
    print(f"[PASS] Candidate action 'mark_mismatch' succeeded -> reason: '{cand.review_reason}'")

    # Cleanup test candidate
    cand.delete()

    # 3. Test Export ZIP Command
    print("\n--- 3. Testing Export Data Package (export_product_image_data) ---")
    call_command('export_product_image_data')
    zip_file = Path(settings.BASE_DIR).parent / 'exports' / 'mediswift_product_image_data.zip'
    assert zip_file.exists(), "ZIP export file was not created"
    assert zip_file.stat().st_size > 10000, "ZIP export file is too small"

    with zipfile.ZipFile(zip_file, 'r') as zf:
        names = set(zf.namelist())
        expected_files = [
            'README.txt',
            'image_discovery_report.json',
            'audit_reports/all_products_image_audit.csv',
            'audit_reports/verified_images.csv',
            'audit_reports/pending_review_images.csv',
            'audit_reports/rejected_images.csv',
            'audit_reports/missing_images.csv',
            'audit_reports/discovered_candidates.csv',
            'audit_reports/rights_unknown_candidates.csv',
            'audit_reports/product_mismatch_candidates.csv',
            'audit_reports/duplicate_images.csv',
        ]
        for ef in expected_files:
            assert ef in names, f"Missing {ef} in zip package!"
            print(f" [OK] Verified zip entry: {ef}")

    print(f"[PASS] Export ZIP integrity verified: {zip_file.name} ({zip_file.stat().st_size / 1024:.1f} KB)")

    # 4. Test Validator Command
    print("\n--- 4. Testing validate_product_images Command ---")
    call_command('validate_product_images')
    print("[PASS] validate_product_images command passed with 0 unhandled errors")

    print("\n==================================================")
    print("ALL IMAGE DISCOVERY & CANDIDATE TESTS PASSED (100% GREEN)!")
    print("==================================================")

if __name__ == '__main__':
    run_tests()
