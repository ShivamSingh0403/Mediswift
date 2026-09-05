# MediSwift Architecture Documentation

## 1. System Vision & Domain
MediSwift ("Your Health, Delivered Smarter.") is an enterprise-grade healthcare platform tailored for the Indian healthcare ecosystem, unifying:
- E-Commerce Pharmacy (Medicines, OTC, Healthcare essentials)
- Prescription Upload, Verification, and Controlled Dispensation
- Telehealth Doctor Discovery and Slot-based Appointment Booking
- Order Lifecycle Management with Pincode and Real-time Tracking
- Secure User Authentication and Multi-role Access Control

---

## 2. High-Level Architecture

```
[ Next.js 15+ App Router Client ]
         |
         |  REST API / JSON / JWT (Bearer)
         v
[ Django + DRF Backend (/api/v1/) ]
    ├── Authentication & Users (JWT / Roles)
    ├── E-Commerce (Products, Inventory, Cart, Orders)
    ├── Clinical & Telehealth (Prescriptions, Doctors, Appointments)
    ├── Operations & Auditing (Payments, Notifications, Analytics)
    └── Private Storage Engine (Prescription KYC & Documents)
         |
         v
[ PostgreSQL 16 Relational DB ]
```

---

## 3. Django App Breakdown

| App | Key Responsibilities | Primary Models |
|---|---|---|
| `common` | Core abstract models, uniform JSON envelopes, pagination, exceptions | `TimeStampedModel` |
| `users` | Multi-role auth, addresses, KYC, profile details | `User`, `UserProfile`, `Address` |
| `products` | Medicine catalog, categories, salt composition, pricing, stock | `Category`, `Brand`, `Product`, `ProductImage` |
| `prescriptions` | Private file upload, validation, pharmacist approval workflow | `Prescription`, `PrescriptionItem` |
| `doctors` | Specialties, clinical qualifications, hospital affiliations, rates | `Specialty`, `DoctorProfile` |
| `appointments` | Doctor schedule slots, video/in-person telehealth bookings | `DoctorAvailability`, `Appointment` |
| `cart` | Session and authenticated cart, pricing engine, prescription checks | `Cart`, `CartItem` |
| `orders` | Placed orders, tracking statuses, addresses, invoice metadata | `Order`, `OrderItem`, `OrderStatusHistory` |
| `payments` | Gateway abstraction (Razorpay/Stripe/COD), transaction logging | `Payment` |
| `notifications` | Cross-domain user alerts (orders, appointments, Rx verification) | `Notification` |
| `analytics` | Aggregation queries for admin dashboards and reports | Read-only aggregation views |

---

## 4. Security & Compliance Architecture
1. **Prescription Confidentiality**: Prescriptions are saved in a protected non-public filesystem or private S3 bucket. Access requires an authenticated session with either owner permissions or verified pharmacist/doctor role.
2. **JWT Lifecycle**: Short-lived access tokens (60 mins) and secure refresh tokens (7 days).
3. **Role-Based Permissions**: Customers cannot verify prescriptions, modify doctor slots, or access administrative analytics. Custom DRF permission classes enforce role boundaries.
