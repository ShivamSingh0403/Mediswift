from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from apps.orders.models import Coupon

class Command(BaseCommand):
    help = "Seed promotional coupons for MediSwift checkout"

    def handle(self, *args, **kwargs):
        coupons_data = [
            {
                "code": "FIRSTMED20",
                "description": "20% OFF on first medical order up to ₹200 (Min. ₹499)",
                "discount_type": Coupon.DiscountType.PERCENTAGE,
                "discount_value": Decimal("20.00"),
                "min_order_amount": Decimal("499.00"),
                "max_discount_amount": Decimal("200.00"),
                "usage_limit": 5000,
                "is_active": True,
            },
            {
                "code": "SWIFT50",
                "description": "Flat ₹50 OFF on orders above ₹299",
                "discount_type": Coupon.DiscountType.FIXED,
                "discount_value": Decimal("50.00"),
                "min_order_amount": Decimal("299.00"),
                "max_discount_amount": None,
                "usage_limit": 10000,
                "is_active": True,
            },
            {
                "code": "HEALTH100",
                "description": "Flat ₹100 OFF on wellness & medicines above ₹999",
                "discount_type": Coupon.DiscountType.FIXED,
                "discount_value": Decimal("100.00"),
                "min_order_amount": Decimal("999.00"),
                "max_discount_amount": None,
                "usage_limit": 5000,
                "is_active": True,
            },
            {
                "code": "FREEDEL",
                "description": "Free standard delivery on orders above ₹249",
                "discount_type": Coupon.DiscountType.FIXED,
                "discount_value": Decimal("40.00"),
                "min_order_amount": Decimal("249.00"),
                "max_discount_amount": None,
                "usage_limit": 20000,
                "is_active": True,
            },
            {
                "code": "MEGA25",
                "description": "Mega 25% OFF up to ₹500 on large pharmacy orders (Min. ₹1499)",
                "discount_type": Coupon.DiscountType.PERCENTAGE,
                "discount_value": Decimal("25.00"),
                "min_order_amount": Decimal("1499.00"),
                "max_discount_amount": Decimal("500.00"),
                "usage_limit": 2000,
                "is_active": True,
            },
        ]

        now = timezone.now()
        future = now + timedelta(days=365)

        created_count = 0
        updated_count = 0

        for c_data in coupons_data:
            coupon, created = Coupon.objects.update_or_create(
                code=c_data["code"],
                defaults={
                    "description": c_data["description"],
                    "discount_type": c_data["discount_type"],
                    "discount_value": c_data["discount_value"],
                    "min_order_amount": c_data["min_order_amount"],
                    "max_discount_amount": c_data["max_discount_amount"],
                    "usage_limit": c_data["usage_limit"],
                    "valid_from": now,
                    "valid_to": future,
                    "is_active": True,
                }
            )
            if created:
                created_count += 1
            else:
                updated_count += 1

        self.stdout.write(self.style.SUCCESS(
            f"Successfully seeded coupons: {created_count} created, {updated_count} updated."
        ))
