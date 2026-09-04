from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.db import transaction
from decimal import Decimal
from datetime import datetime, date, timedelta, time
try:
    import stripe
except ImportError:
    stripe = None

from .models import User, Medicine, Doctor, Order, OrderItem, Appointment, Prescription, Availability
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    MedicineSerializer,
    DoctorSerializer,
    OrderSerializer,
    OrderItemSerializer,
    AppointmentSerializer,
    PrescriptionSerializer,
    AvailabilitySerializer,
)

class RegisterViewSet(viewsets.GenericViewSet):
    """
    User registration endpoint.
    """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                "message": "User registered successfully",
                "user": UserSerializer(user).data
            },
            status=status.HTTP_201_CREATED
        )


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """
    User profile viewing. Authenticated users can retrieve their own details.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)


class MedicineViewSet(viewsets.ModelViewSet):
    """
    CRUD ViewSet for Medicine inventory.
    Read: Public
    Write: Staff / Admin only
    """
    queryset = Medicine.objects.all()
    serializer_class = MedicineSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'category', 'manufacturer']
    ordering_fields = ['price', 'stock', 'created_at', 'name']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'categories', 'featured', 'substitutes']:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def get_queryset(self):
        queryset = Medicine.objects.all()
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        return queryset

    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Returns list of all distinct category choices."""
        categories = [
            {'id': key, 'name': label}
            for key, label in Medicine.CATEGORY_CHOICES
        ]
        return Response(categories)

    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Returns top in-stock featured medicines for the landing page."""
        featured_medicines = Medicine.objects.filter(stock__gt=0)[:8]
        serializer = self.get_serializer(featured_medicines, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def substitutes(self, request, pk=None):
        """
        Smart Substitute Algorithm:
        Calculates and returns cheaper generic alternatives with the identical
        active chemical composition / salt.
        Route: GET /api/medicines/<pk>/substitutes/
        """
        medicine = self.get_object()
        composition = (medicine.composition or '').strip()

        if not composition:
            # Fallback: look for other medicines in same category with cheaper price
            substitutes = Medicine.objects.filter(
                category=medicine.category
            ).exclude(id=medicine.id).order_by('price')[:6]
        else:
            # Clean primary active ingredient (e.g., 'Paracetamol (650mg)' -> 'Paracetamol')
            primary_salt = composition.split('+')[0].split('(')[0].strip()
            
            # Query medicines with identical composition or matching active salt
            exact_matches = Medicine.objects.filter(
                composition__iexact=composition
            ).exclude(id=medicine.id)

            salt_matches = Medicine.objects.filter(
                composition__icontains=primary_salt
            ).exclude(id=medicine.id).exclude(id__in=exact_matches.values_list('id', flat=True))

            # Prioritize identical composition, followed by salt match, ordered by price ASC
            substitutes = list(exact_matches.order_by('price')) + list(salt_matches.order_by('price'))
            # Deduplicate and cap at 10 items
            substitutes = substitutes[:10]

        substitutes_data = []
        for sub in substitutes:
            sub_serializer = self.get_serializer(sub)
            sub_dict = sub_serializer.data

            # Calculate savings
            savings = max(Decimal('0.00'), medicine.price - sub.price)
            savings_pct = 0.0
            if medicine.price > Decimal('0.00'):
                savings_pct = round(float((savings / medicine.price) * 100), 1)

            sub_dict['savings_amount'] = str(savings)
            sub_dict['savings_percentage'] = savings_pct
            sub_dict['is_cheaper'] = sub.price < medicine.price
            substitutes_data.append(sub_dict)

        return Response({
            "target_id": medicine.id,
            "target_name": medicine.name,
            "target_price": str(medicine.price),
            "composition": composition,
            "total_substitutes": len(substitutes_data),
            "cheaper_count": sum(1 for s in substitutes_data if s['is_cheaper']),
            "substitutes": substitutes_data
        }, status=status.HTTP_200_OK)


class DoctorViewSet(viewsets.ModelViewSet):
    """
    CRUD ViewSet for Doctors.
    Read: Public
    Write: Staff / Admin only
    """
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'specialty', 'bio']
    ordering_fields = ['fee', 'experience', 'rating', 'name']
    ordering = ['name']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def get_queryset(self):
        queryset = Doctor.objects.all()
        specialty = self.request.query_params.get('specialty')
        if specialty:
            queryset = queryset.filter(specialty__iexact=specialty)
        return queryset


class OrderViewSet(viewsets.ModelViewSet):
    """
    Order management and checkout processing.
    Authenticated users can view/create orders.
    """
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at', 'total_price', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Order.objects.all().prefetch_related('items__medicine')
        return Order.objects.filter(user=user).prefetch_related('items__medicine')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def cancel(self, request, pk=None):
        """Cancels an order if it is still PENDING."""
        order = self.get_object()
        if order.status != Order.OrderStatus.PENDING:
            return Response(
                {"error": f"Cannot cancel order with status '{order.status}'."},
                status=status.HTTP_400_BAD_REQUEST
            )
        order.status = Order.OrderStatus.CANCELLED
        order.save(update_fields=['status'])
        return Response({"message": "Order cancelled successfully.", "status": order.status})


class CreateStripeCheckoutSessionView(APIView):
    """
    Accepts cart items [{ medicine_id, quantity }] and shipping details.
    Calculates total securely from the database and creates a Stripe Checkout Session.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        stripe.api_key = settings.STRIPE_SECRET_KEY

        cart_items_data = request.data.get('items', [])
        shipping_address = request.data.get('shipping_address', '')
        contact_phone = request.data.get('contact_phone', '')

        if not cart_items_data:
            return Response(
                {"error": "Cart is empty. Please provide items to checkout."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():
                # 1. Create a pending order record
                order = Order.objects.create(
                    user=request.user,
                    status=Order.OrderStatus.PENDING,
                    shipping_address=shipping_address,
                    contact_phone=contact_phone,
                    total_price=0.00
                )

                calculated_total = 0
                stripe_line_items = []

                # 2. Verify stock, compute price, and create order items
                for item in cart_items_data:
                    med_id = item.get('medicine_id') or item.get('id')
                    qty = int(item.get('quantity', 1))

                    medicine = Medicine.objects.select_for_update().get(id=med_id)
                    if medicine.stock < qty:
                        return Response(
                            {"error": f"Insufficient stock for {medicine.name}. Available: {medicine.stock}"},
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    unit_price = medicine.price
                    item_total = unit_price * qty
                    calculated_total += item_total

                    OrderItem.objects.create(
                        order=order,
                        medicine=medicine,
                        quantity=qty,
                        unit_price=unit_price
                    )

                    # Build Stripe line item (Stripe expects unit_amount in cents)
                    stripe_line_items.append({
                        'price_data': {
                            'currency': 'usd',
                            'product_data': {
                                'name': medicine.name,
                                'description': medicine.description[:200] if medicine.description else '',
                                'images': [medicine.image_url] if medicine.image_url else [],
                            },
                            'unit_amount': int(unit_price * 100),
                        },
                        'quantity': qty,
                    })

                # Calculate shipping if subtotal < 50
                if calculated_total < 50:
                    shipping_cost = 5.00
                    calculated_total += shipping_cost
                    stripe_line_items.append({
                        'price_data': {
                            'currency': 'usd',
                            'product_data': {
                                'name': 'Standard Cold-Chain Delivery',
                            },
                            'unit_amount': 500,
                        },
                        'quantity': 1,
                    })

                order.total_price = calculated_total
                order.save(update_fields=['total_price'])

            # 3. Create Stripe Checkout Session
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000').rstrip('/')
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=stripe_line_items,
                mode='payment',
                success_url=f"{frontend_url}/checkout?success=true&session_id={{CHECKOUT_SESSION_ID}}&order_id={order.id}",
                cancel_url=f"{frontend_url}/checkout?cancelled=true&order_id={order.id}",
                client_reference_id=str(order.id),
                customer_email=request.user.email,
                metadata={
                    'order_id': str(order.id),
                    'user_id': str(request.user.id),
                }
            )

            return Response({
                'session_url': checkout_session.url,
                'session_id': checkout_session.id,
                'order_id': order.id,
                'total_price': str(order.total_price),
            }, status=status.HTTP_200_OK)

        except Medicine.DoesNotExist:
            return Response({"error": "One or more medicines in your cart do not exist."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(APIView):
    """
    Stripe Webhook listener that processes checkout.session.completed
    and updates Order status to PAID atomically.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')
        webhook_secret = getattr(settings, 'STRIPE_WEBHOOK_SECRET', '')

        try:
            if webhook_secret:
                event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
            else:
                # If secret not set in dev, parse payload directly
                import json
                event = json.loads(payload.decode('utf-8'))
        except ValueError:
            return Response({'error': 'Invalid payload'}, status=status.HTTP_400_BAD_REQUEST)
        except stripe.error.SignatureVerificationError:
            return Response({'error': 'Invalid signature'}, status=status.HTTP_400_BAD_REQUEST)

        # Handle successful checkout session
        if event.get('type') == 'checkout.session.completed':
            session = event['data']['object']
            order_id = session.get('client_reference_id') or session.get('metadata', {}).get('order_id')

            if order_id:
                try:
                    with transaction.atomic():
                        order = Order.objects.select_for_update().get(id=order_id)
                        if order.status != Order.OrderStatus.PAID:
                            order.status = Order.OrderStatus.PAID
                            order.payment_id = session.get('payment_intent', session.get('id', ''))
                            order.save(update_fields=['status', 'payment_id'])

                            # Deduct stock for medicines in order
                            for item in order.items.select_related('medicine').all():
                                medicine = item.medicine
                                medicine.stock = max(0, medicine.stock - item.quantity)
                                medicine.save(update_fields=['stock'])
                except Order.DoesNotExist:
                    pass

        return Response({'status': 'received'}, status=status.HTTP_200_OK)


class AppointmentViewSet(viewsets.ModelViewSet):
    """
    CRUD ViewSet for Doctor appointments with double-booking prevention.
    Patients can book appointments and view their bookings.
    """
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['patient_name', 'patient_email', 'doctor__name']
    ordering_fields = ['appointment_date', 'created_at']
    ordering = ['-appointment_date']

    def get_permissions(self):
        if self.action in ['create']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Appointment.objects.none()
        if user.is_staff or getattr(user, 'role', '') == 'DOCTOR':
            return Appointment.objects.all()
        return Appointment.objects.filter(user=user)

    def create(self, request, *args, **kwargs):
        doctor_id = request.data.get('doctor')
        appointment_date = request.data.get('appointment_date')
        time_slot = request.data.get('time_slot')

        # Prevent double-booking race conditions atomically
        with transaction.atomic():
            already_booked = Appointment.objects.filter(
                doctor_id=doctor_id,
                appointment_date=appointment_date,
                time_slot=time_slot
            ).exclude(status='CANCELLED').exists()

            if already_booked:
                return Response(
                    {"error": f"The time slot '{time_slot}' on {appointment_date} is already booked. Please select another slot."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            serializer.save()


class DoctorAvailableSlotsView(APIView):
    """
    Calculates and returns open and booked time slots for a specific doctor and date.
    Route: /api/doctors/available-slots/?doctor_id=...&date=YYYY-MM-DD
    """
    permission_classes = [AllowAny]

    def get(self, request):
        doctor_id = request.query_params.get('doctor_id')
        date_str = request.query_params.get('date')

        if not doctor_id:
            return Response({"error": "doctor_id query parameter is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            doctor = Doctor.objects.get(id=doctor_id)
        except Doctor.DoesNotExist:
            return Response({"error": "Doctor not found."}, status=status.HTTP_404_NOT_FOUND)

        if not date_str:
            # Default to tomorrow
            target_date = date.today() + timedelta(days=1)
        else:
            try:
                target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({"error": "Invalid date format. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        weekday = target_date.weekday()  # 0=Monday, ..., 6=Sunday

        # Look up doctor's specific schedule for this weekday
        availability = Availability.objects.filter(
            doctor=doctor,
            day_of_week=weekday,
            is_active=True
        ).first()

        # Fallback schedule if doctor doesn't have custom record
        if availability:
            start_t = availability.start_time
            end_t = availability.end_time
            duration_minutes = availability.slot_duration
        else:
            start_t = time(9, 0)
            end_t = time(17, 0)
            duration_minutes = 30

        # Generate all 30-min time slots
        current_dt = datetime.combine(target_date, start_t)
        end_dt = datetime.combine(target_date, end_t)

        all_slots = []
        while current_dt + timedelta(minutes=duration_minutes) <= end_dt:
            slot_end = current_dt + timedelta(minutes=duration_minutes)
            slot_label = f"{current_dt.strftime('%I:%M %p')} - {slot_end.strftime('%I:%M %p')}"
            all_slots.append(slot_label)
            current_dt = slot_end

        # Query existing non-cancelled bookings for this doctor on this date
        booked_slots = set(
            Appointment.objects.filter(
                doctor=doctor,
                appointment_date=target_date
            ).exclude(status='CANCELLED').values_list('time_slot', flat=True)
        )

        formatted_slots = [
            {
                "time_slot": slot,
                "is_available": slot not in booked_slots
            }
            for slot in all_slots
        ]

        available_count = sum(1 for s in formatted_slots if s["is_available"])

        return Response({
            "doctor_id": doctor.id,
            "doctor_name": doctor.name,
            "specialty": doctor.specialty,
            "fee": str(doctor.fee),
            "date": target_date.strftime('%Y-%m-%d'),
            "day_name": target_date.strftime('%A'),
            "total_slots": len(formatted_slots),
            "available_count": available_count,
            "slots": formatted_slots
        }, status=status.HTTP_200_OK)


class PrescriptionViewSet(viewsets.ModelViewSet):
    """
    CRUD and Upload endpoint for user prescriptions.
    Supports multipart/form-data.
    """
    queryset = Prescription.objects.all()
    serializer_class = PrescriptionSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    permission_classes = [AllowAny]
    filter_backends = [filters.OrderingFilter]
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Prescription.objects.none()
        if user.is_staff or getattr(user, 'role', '') in ['DOCTOR', 'PHARMACIST']:
            return Prescription.objects.all()
        return Prescription.objects.filter(user=user)

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload(self, request):
        """
        Dedicated endpoint for uploading a prescription file.
        Route: POST /api/prescriptions/upload/
        """
        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response({"error": "No file uploaded. Key 'file' is required."}, status=status.HTTP_400_BAD_REQUEST)

        # File size check (max 10MB)
        if uploaded_file.size > 10 * 1024 * 1024:
            return Response({"error": "File size exceeds maximum allowed limit of 10MB."}, status=status.HTTP_400_BAD_REQUEST)

        # Extension verification
        allowed_extensions = ['.jpg', '.jpeg', '.png', '.pdf', '.webp']
        import os
        ext = os.path.splitext(uploaded_file.name)[1].lower()
        if ext not in allowed_extensions:
            return Response(
                {"error": f"Invalid file type '{ext}'. Allowed: {', '.join(allowed_extensions)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        patient_name = request.data.get('patient_name', '')
        doctor_notes = request.data.get('doctor_notes', '')

        prescription = Prescription.objects.create(
            user=request.user if request.user.is_authenticated else None,
            file=uploaded_file,
            patient_name=patient_name,
            doctor_notes=doctor_notes,
            status=Prescription.PrescriptionStatus.PENDING
        )

        serializer = self.get_serializer(prescription, context={'request': request})
        return Response(
            {
                "message": "Prescription uploaded successfully and queued for clinical review.",
                "prescription": serializer.data
            },
            status=status.HTTP_201_CREATED
        )
