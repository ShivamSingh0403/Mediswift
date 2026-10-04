"""
MediSwift Security & Authorization Test Suite
Verifies strict isolation:
1. User A cannot view User B's order by UUID or order_number.
2. User A cannot reorder User B's order.
3. User A cannot view, edit, or delete User B's address.
4. User A cannot access User B's private prescriptions.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIClient
from rest_framework import status
from apps.users.models import User, Address
from apps.products.models import Product
from apps.orders.models import Order, OrderItem
from apps.prescriptions.models import Prescription
from django.core.files.uploadedfile import SimpleUploadedFile

def run_security_tests():
    print("=" * 50)
    print("STARTING MEDISWIFT SECURITY & AUTHORIZATION TESTS")
    print("=" * 50)

    # 1. Setup two distinct users
    user_a, _ = User.objects.get_or_create(
        email="user_a@mediswift.in",
        defaults={"first_name": "User", "last_name": "A", "role": "CUSTOMER"}
    )
    user_a.set_password("SecurePasswordA123!")
    user_a.save()

    user_b, _ = User.objects.get_or_create(
        email="user_b@mediswift.in",
        defaults={"first_name": "User", "last_name": "B", "role": "CUSTOMER"}
    )
    user_b.set_password("SecurePasswordB123!")
    user_b.save()

    client_a = APIClient()
    client_a.force_authenticate(user=user_a)

    client_b = APIClient()
    client_b.force_authenticate(user=user_b)

    # 2. User B creates an Address
    addr_b = Address.objects.create(
        user=user_b,
        full_name="User B Confidential",
        phone="9876543210",
        address_line1="123 Secret Lane",
        city="Mumbai",
        state="Maharashtra",
        postal_code="400001",
        is_default=True
    )

    # 3. User B creates an Order
    product = Product.objects.filter(is_active=True).first()
    order_b = Order.objects.create(
        user=user_b,
        shipping_address=addr_b,
        shipping_address_snapshot={"full_name": addr_b.full_name, "city": addr_b.city},
        subtotal=product.price_inr,
        total_amount=product.price_inr,
        status=Order.Status.CONFIRMED
    )
    OrderItem.objects.create(
        order=order_b,
        product=product,
        product_name=product.name,
        unit_price=product.price_inr,
        quantity=1,
        total_price=product.price_inr
    )

    # 4. User B creates a Prescription
    fake_file = SimpleUploadedFile("rx_b.pdf", b"%PDF-1.4 test prescription content", content_type="application/pdf")
    rx_b = Prescription.objects.create(
        patient=user_b,
        document=fake_file,
        patient_notes="User B Confidential Medical Notes",
        status=Prescription.Status.PENDING
    )

    # --- TEST 1: User A accessing User B's Order by ID ---
    resp = client_a.get(f"/api/v1/orders/{order_b.id}/")
    assert resp.status_code == status.HTTP_404_NOT_FOUND, f"User A should get 404 for User B order, got {resp.status_code}"
    print("[PASS] User A cannot access User B's order by UUID (Returns 404 Not Found).")

    # --- TEST 2: User A accessing User B's Order by Order Number ---
    resp_num = client_a.get(f"/api/v1/orders/{order_b.order_number}/")
    assert resp_num.status_code == status.HTTP_404_NOT_FOUND, f"User A should get 404 for User B order_number, got {resp_num.status_code}"
    print("[PASS] User A cannot access User B's order by order_number (Returns 404 Not Found).")

    # --- TEST 3: User A attempting to reorder User B's Order ---
    resp_reorder = client_a.post(f"/api/v1/orders/{order_b.id}/reorder/")
    assert resp_reorder.status_code == status.HTTP_404_NOT_FOUND, f"User A should not be able to reorder User B's order, got {resp_reorder.status_code}"
    print("[PASS] User A cannot trigger reorder of User B's order (Returns 404 Not Found).")

    # --- TEST 4: User A accessing User B's Address by ID ---
    resp_addr = client_a.get(f"/api/v1/users/addresses/{addr_b.id}/")
    assert resp_addr.status_code == status.HTTP_404_NOT_FOUND, f"User A should get 404 for User B address, got {resp_addr.status_code}"
    print("[PASS] User A cannot view User B's address (Returns 404 Not Found).")

    # --- TEST 5: User A attempting to edit User B's Address ---
    resp_edit = client_a.patch(f"/api/v1/users/addresses/{addr_b.id}/", {"city": "Hacked"})
    assert resp_edit.status_code == status.HTTP_404_NOT_FOUND, f"User A should not edit User B's address, got {resp_edit.status_code}"
    print("[PASS] User A cannot modify User B's address (Returns 404 Not Found).")

    # --- TEST 6: User A attempting to delete User B's Address ---
    resp_del = client_a.delete(f"/api/v1/users/addresses/{addr_b.id}/")
    assert resp_del.status_code == status.HTTP_404_NOT_FOUND, f"User A should not delete User B's address, got {resp_del.status_code}"
    print("[PASS] User A cannot delete User B's address (Returns 404 Not Found).")

    # --- TEST 7: User A attempting to view User B's Prescription ---
    resp_rx = client_a.get(f"/api/v1/prescriptions/{rx_b.id}/")
    assert resp_rx.status_code in (status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN), f"User A should not view User B's prescription, got {resp_rx.status_code}"
    print("[PASS] User A cannot access User B's private prescription (Returns 404/403).")

    # --- TEST 8: Address URL alias /api/v1/addresses/ test ---
    resp_alias = client_b.get(f"/api/v1/addresses/{addr_b.id}/")
    assert resp_alias.status_code == status.HTTP_200_OK, f"User B should access own address via /addresses/ alias, got {resp_alias.status_code}"
    print("[PASS] User B can access own address via both /api/v1/addresses/ and /api/v1/users/addresses/.")

    print("=" * 50)
    print("ALL SECURITY & AUTHORIZATION TESTS PASSED (100% GREEN)!")
    print("=" * 50)

if __name__ == '__main__':
    run_security_tests()
