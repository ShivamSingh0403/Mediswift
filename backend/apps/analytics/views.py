from decimal import Decimal
from django.db.models import Sum, Count, F
from rest_framework.views import APIView
from rest_framework import permissions
from apps.common.responses import api_response
from apps.common.permissions import IsAdminRole
from apps.orders.models import Order, OrderItem
from apps.products.models import Product
from apps.appointments.models import Appointment
from apps.users.models import User
from apps.prescriptions.models import Prescription

class AnalyticsSummaryView(APIView):
    permission_classes = (IsAdminRole,)

    def get(self, request):
        total_sales = Order.objects.filter(status__in=[
            Order.Status.CONFIRMED, Order.Status.PROCESSING,
            Order.Status.DISPATCHED, Order.Status.OUT_FOR_DELIVERY,
            Order.Status.DELIVERED
        ]).aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')

        total_orders = Order.objects.count()
        total_customers = User.objects.filter(role=User.Role.CUSTOMER).count()
        total_doctors = User.objects.filter(role=User.Role.DOCTOR).count()
        total_appointments = Appointment.objects.count()
        pending_prescriptions = Prescription.objects.filter(status=Prescription.Status.PENDING).count()

        popular_products = (
            OrderItem.objects.values('product__id', 'product__name', 'product__price')
            .annotate(total_sold=Sum('quantity'), revenue=Sum('total_price'))
            .order_by('-total_sold')[:5]
        )

        return api_response(
            data={
                "metrics": {
                    "total_sales_inr": total_sales,
                    "total_orders": total_orders,
                    "total_customers": total_customers,
                    "total_doctors": total_doctors,
                    "total_appointments": total_appointments,
                    "pending_prescriptions": pending_prescriptions,
                },
                "popular_products": list(popular_products),
            },
            message="Analytics overview retrieved."
        )
