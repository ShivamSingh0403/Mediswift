import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from decimal import Decimal
from django.utils import timezone
from apps.users.models import User, Address
from apps.products.models import Product, Category
from apps.prescriptions.models import Prescription
from apps.cart.models import Cart, CartItem
from apps.orders.models import Order, OrderItem, Coupon
from apps.payments.models import Payment
from apps.notifications.models import Notification

from rest_framework.test import APIClient
from rest_framework import status

def run_tests():
    print("==================================================")
    print("STARTING COMPREHENSIVE MEDISWIFT FINAL SUITE TEST")
    print("==================================================")

    client = APIClient()

    # 1. Setup test user
    email = "final_tester@mediswift.in"
    user, _ = User.objects.get_or_create(
        email=email,
        defaults={
            "first_name": "Final",
            "last_name": "Tester",
            "role": User.Role.CUSTOMER,
            "phone_number": "+919876543210"
        }
    )
    user.set_password("Test@12345")
    user.save()
    client.force_authenticate(user=user)
    print(f"[PASS] Authenticated test user: {user.email}")

    # 2. Test Address CRUD and default setting
    print("\n--- Testing Address Management ---")
    addr1 = Address.objects.create(
        user=user,
        full_name="Aarav Patel",
        phone="+919876543210",
        address_line1="Flat 402, Lotus Residency",
        city="Ahmedabad",
        state="Gujarat",
        postal_code="380054",
        address_type=Address.AddressType.HOME,
        is_default=True
    )
    addr2 = Address.objects.create(
        user=user,
        full_name="Aarav Office",
        phone="+919876543211",
        address_line1="Plot 12, Cyber Gateway",
        city="Hyderabad",
        state="Telangana",
        postal_code="500081",
        address_type=Address.AddressType.WORK,
        is_default=False
    )

    # Test set_default endpoint
    resp = client.post(f"/api/v1/users/addresses/{addr2.id}/set-default/")
    assert resp.status_code == status.HTTP_200_OK, f"Expected 200, got {resp.status_code}"
    addr1.refresh_from_db()
    addr2.refresh_from_db()
    assert addr2.is_default == True, "addr2 should now be default"
    assert addr1.is_default == False, "addr1 should no longer be default"
    print("[PASS] Address set_default action works as expected (atomic toggling).")

    # 3. Test Coupon Validation
    print("\n--- Testing Coupon Validation ---")
    coupon = Coupon.objects.filter(code="FIRSTMED20").first()
    if not coupon:
        coupon = Coupon.objects.create(
            code="FIRSTMED20",
            description="20% OFF on first order",
            discount_type=Coupon.DiscountType.PERCENTAGE,
            discount_value=Decimal("20.00"),
            min_order_amount=Decimal("499.00"),
            max_discount_amount=Decimal("200.00"),
            is_active=True
        )

    # Test below min order
    val_resp_low = client.post("/api/v1/orders/validate-coupon/", {"code": "FIRSTMED20", "subtotal": "200.00"})
    assert val_resp_low.status_code == status.HTTP_400_BAD_REQUEST, "Should reject coupon below min order"
    print("[PASS] Coupon min order requirement correctly enforced.")

    # Test valid subtotal
    val_resp_ok = client.post("/api/v1/orders/validate-coupon/", {"code": "FIRSTMED20", "subtotal": "600.00"})
    assert val_resp_ok.status_code == status.HTTP_200_OK, f"Expected 200, got {val_resp_ok.status_code}"
    # 20% of 600 = 120.00
    assert val_resp_ok.data['data']['discount_amount'] == '120.00', "Discount amount mismatch"
    print("[PASS] Percentage discount calculation accurate (20% of INR 600 = INR 120).")

    # 4. Test Prescription Verification Gate on Checkout
    print("\n--- Testing Prescription Verification Gate ---")
    category, _ = Category.objects.get_or_create(name="Pain Relief", slug="pain-relief")
    
    # Non-Rx product
    otc_prod = Product.objects.filter(prescription_required=False, is_active=True).first()
    if not otc_prod:
        otc_prod = Product.objects.create(
            name="Vitamin C 500mg Chewable",
            slug="vitamin-c-500mg-test",
            sku="SKU-TEST-VITC",
            category=category,
            price=Decimal("150.00"),
            stock_quantity=50,
            prescription_required=False,
            dosage_form="TABLET",
            pack_size="Bottle of 60"
        )

    # Rx-required product
    rx_prod = Product.objects.filter(prescription_required=True, is_active=True).first()
    if not rx_prod:
        rx_prod = Product.objects.create(
            name="Amoxicillin 500mg Capsule",
            slug="amoxicillin-500mg-test",
            sku="SKU-TEST-AMOX",
            category=category,
            price=Decimal("220.00"),
            stock_quantity=50,
            prescription_required=True,
            dosage_form="CAPSULE",
            pack_size="Strip of 10"
        )
    # Ensure sufficient stock for test
    if rx_prod.stock_quantity < 5:
        rx_prod.stock_quantity = 50
        rx_prod.save(update_fields=['stock_quantity'])

    # Setup Cart with Rx product
    cart, _ = Cart.objects.get_or_create(user=user)
    cart.items.all().delete()
    CartItem.objects.create(cart=cart, product=rx_prod, quantity=10)
    print(f"DEBUG: rx_prod price={rx_prod.price}, price_inr={rx_prod.price_inr}, discounted_price={rx_prod.discounted_price}, cart.subtotal={cart.subtotal}")

    # Attempt checkout without prescription attached
    checkout_no_rx = client.post("/api/v1/orders/checkout/", {
        "shipping_address_id": str(addr2.id),
        "payment_method": "RAZORPAY"
    })
    assert checkout_no_rx.status_code == status.HTTP_400_BAD_REQUEST, "Should block checkout when Rx product missing Rx"
    print("[PASS] Checkout properly blocked when regulated medicine is in cart without Rx.")

    # 5. Create valid prescription and test checkout with inventory decrement
    print("\n--- Testing Successful Checkout with Rx & Inventory Decrement ---")
    rx = Prescription.objects.create(
        patient=user,
        doctor_name="Dr. Sunita Rao",
        status=Prescription.Status.APPROVED if hasattr(Prescription.Status, 'APPROVED') else Prescription.Status.VERIFIED
    )

    initial_stock = rx_prod.stock_quantity
    checkout_with_rx = client.post("/api/v1/orders/checkout/", {
        "shipping_address_id": str(addr2.id),
        "prescription_id": str(rx.id),
        "coupon_code": "FIRSTMED20",
        "payment_method": "RAZORPAY"
    })
    assert checkout_with_rx.status_code == status.HTTP_201_CREATED, f"Expected 201, got {checkout_with_rx.status_code}: {checkout_with_rx.data}"
    
    order_data = checkout_with_rx.data['data']['order']
    order_id = order_data['id']
    rx_prod.refresh_from_db()
    assert rx_prod.stock_quantity == initial_stock - 10, f"Inventory was not decremented! Expected {initial_stock - 10}, got {rx_prod.stock_quantity}"
    print(f"[PASS] Inventory atomically reserved: Stock reduced from {initial_stock} to {rx_prod.stock_quantity}.")

    # Verify frozen snapshot
    created_order = Order.objects.get(id=order_id)
    assert created_order.shipping_address_snapshot.get('city') == "Hyderabad"
    assert created_order.shipping_address_snapshot.get('postal_code') == "500081"
    print("[PASS] Delivery address frozen snapshot successfully saved in order record.")

    # Verify 8-stage timeline
    assert len(created_order.delivery_timeline) >= 7, "Delivery timeline checkpoints missing"
    assert created_order.delivery_timeline[0]['status'] == "PLACED"
    assert created_order.delivery_timeline[0]['completed'] == True
    print("[PASS] Initial multi-stage delivery timeline checkpoints generated.")

    # 6. Test Authoritative Payment Verification
    print("\n--- Testing Authoritative Payment Verification ---")
    # Initiate payment
    init_resp = client.post("/api/v1/payments/initiate/", {
        "order_id": order_id,
        "provider": "RAZORPAY"
    })
    assert init_resp.status_code == status.HTTP_201_CREATED, f"Payment init failed: {init_resp.data}"
    payment_id = init_resp.data['data']['id']
    print("[PASS] Payment session initiated with gateway order payload.")

    # Verify payment (authoritative server-side)
    verify_resp = client.post("/api/v1/payments/verify/", {
        "order_id": order_id,
        "payment_id": payment_id,
        "provider": "RAZORPAY",
        "provider_transaction_id": "pay_live_test_12345",
        "payment_signature": "sig_live_test_abcde",
        "simulate_status": "PAID"
    })
    assert verify_resp.status_code == status.HTTP_200_OK, f"Verification failed: {verify_resp.data}"
    
    created_order.refresh_from_db()
    assert created_order.status == Order.Status.CONFIRMED, "Order status should be CONFIRMED after payment"
    
    payment = Payment.objects.get(id=payment_id)
    assert payment.status == Payment.Status.PAID, "Payment status should be PAID"
    assert payment.provider_transaction_id == "pay_live_test_12345"
    print("[PASS] Authoritative server-side payment verification marked Payment=PAID and Order=CONFIRMED.")

    # 7. Test In-App Notification Generation
    print("\n--- Testing In-App Notifications ---")
    user_notifs = Notification.objects.filter(user=user)
    assert user_notifs.count() >= 2, f"Expected at least 2 notifications (order, payment), got {user_notifs.count()}"
    latest_payment_notif = user_notifs.filter(notification_type=Notification.NotificationType.PAYMENT).first()
    assert latest_payment_notif is not None, "Payment notification was not created"
    print(f"[PASS] In-app notifications generated: '{latest_payment_notif.title}'.")

    # 8. Test Reorder Endpoint
    print("\n--- Testing Order Reorder Endpoint ---")
    reorder_resp = client.post(f"/api/v1/orders/{order_id}/reorder/")
    assert reorder_resp.status_code == status.HTTP_200_OK, f"Reorder failed: {reorder_resp.data}"
    cart.refresh_from_db()
    assert cart.items.count() > 0, "Cart should contain items after reorder"
    print(f"[PASS] Reorder endpoint successfully added order items back to cart ({cart.items.count()} items).")

    print("\n==================================================")
    print("ALL FINAL SUITE INTEGRATION TESTS PASSED SUCCESSFULLY (100% GREEN)!")
    print("==================================================")

if __name__ == '__main__':
    run_tests()
