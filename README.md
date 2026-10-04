# MediSwift — Your Health, Delivered Smarter.

MediSwift is a full-stack Indian healthcare ecosystem uniting online medicine e-commerce, healthcare products, secure prescription uploads, doctor discovery, telehealth appointment booking, medicine order management, delivery tracking, and a comprehensive patient dashboard.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js (App Router, React 19)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS & Vanilla CSS Design Tokens
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **State Management**: Zustand (with persistent storage where appropriate)
- **Forms & Validation**: React Hook Form + Zod

### Backend
- **Framework**: Python 3.12+ & Django 5+
- **API**: Django REST Framework & SimpleJWT
- **Database**: PostgreSQL (with automatic zero-config SQLite development fallback)
- **Architecture**: Modular Django applications
- **Security**: Private prescription file isolation, custom role-based permissions, CORS, CSRF

---

## 📁 Repository Structure

```
mediswift/
├── frontend/                     # Next.js App Router frontend
│   ├── app/                      # Page routes (/medicines, /doctors, /cart, /prescriptions, etc.)
│   ├── components/               # UI design system & layout components
│   ├── features/                 # Domain-specific components
│   ├── hooks/                    # Reusable React hooks
│   ├── lib/                      # Axios client, utils, constants
│   ├── services/                 # API service layer
│   ├── store/                    # Zustand stores (auth, cart, wishlist, ui, etc.)
│   ├── types/                    # Domain TypeScript types
│   └── public/                   # Static assets
│
├── backend/                      # Django REST API backend
│   ├── config/                   # Django settings, URLs, WSGI, ASGI
│   ├── apps/
│   │   ├── common/               # Envelopes, pagination, base models
│   │   ├── users/                # Auth, JWT, roles, addresses
│   │   ├── products/             # Medicines, categories, inventory
│   │   ├── prescriptions/        # Secure upload & pharmacist verification
│   │   ├── doctors/              # Doctor profiles, specialties
│   │   ├── appointments/         # Telehealth slots & bookings
│   │   ├── cart/                 # Shopping cart & subtotal engine
│   │   ├── orders/               # Order processing & delivery tracking
│   │   ├── payments/             # Transactions & payment gateway abstraction
│   │   ├── notifications/        # User alerts
│   │   └── analytics/            # Operations & sales metrics
│   ├── requirements/             # Pip requirements
│   └── manage.py
│
├── docs/                         # Architecture & API specifications
├── docker/                       # Dockerfiles
├── .env.example                  # Environment configuration template
├── docker-compose.yml            # Docker orchestration
└── README.md                     # Documentation
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js v20+ & npm
- Python 3.12+
- (Optional) PostgreSQL 16 or Docker

### 2. Environment Setup
```bash
# Copy root environment variables
cp .env.example .env
```

### 3. Backend Setup
```bash
cd backend

# Create and activate Python virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
# source venv/bin/activate

# Install dependencies
pip install -r requirements/base.txt

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Start backend server
python manage.py runserver 8000
```
API will be available at `http://localhost:8000/api/v1/` and admin at `http://localhost:8000/admin/`.

### 4. Frontend Setup
```bash
cd frontend

# Install packages
npm install

# Start Next.js development server
npm run dev
```
Open `http://localhost:3000` in your browser.

### 5. Seeding Promotional Coupons
```bash
python manage.py seed_coupons
```
This seeds initial active promotional coupons:
- `FIRSTMED20`: 20% discount up to ₹200 (Min. order ₹499)
- `SWIFT50`: Flat ₹50 OFF (Min. order ₹299)
- `HEALTH100`: Flat ₹100 OFF (Min. order ₹999)
- `FREEDEL`: Free delivery discount (Min. order ₹249)
- `MEGA25`: 25% OFF up to ₹500 (Min. order ₹1,499)

### 6. Product Image Pipeline & Catalog Commands
```bash
# Validate integrity of product images across catalog
python manage.py validate_product_images

# Assign deterministic demo healthcare visuals to active products
python manage.py assign_demo_images
```

### 7. Running the Final Major Test Suite
```bash
python test_final_suite.py
python test_image_discovery_suite.py
```
Validates:
1. Indian Address CRUD and default setting.
2. Server-side coupon verification and percentage/flat discount calculation.
3. Regulated prescription verification gate on checkout.
4. Atomic inventory decrement and order creation with frozen address snapshots.
5. 8-stage delivery timeline checkpoints.
6. Authoritative payment verification with gateway simulation and status transitions.
7. In-app notification creation across categories.
8. One-click order reordering.
9. Deterministic product image discovery, verification statuses, and generic fallbacks.

### 8. Frontend Validation & Production Build
```bash
cd frontend
# Typecheck
npx tsc --noEmit
# Production build
npm run build
```

### 9. Running with Docker Compose
```bash
docker compose up --build
```

---

## 🛍 Marketplace 3.0 & Centralized Image System

- **Unified Image Resolution (`resolveProductImage(product)`)**:
  - Centralized in `frontend/lib/image-resolver.ts` and `frontend/components/ProductImage.tsx`.
  - Used uniformly by `ProductCard`, `ProductDetail`, `QuickView`, `Cart`, `Wishlist`, and `SearchOverlay`.
  - 4-tier priority: Verified uploaded image ➔ Approved local/manifest image ➔ Deterministic fictional demo visual (`AI_DEMO_ONLY`) ➔ Generic healthcare fallback (`fallback-generic.webp`).
  - No fabricated medicine packaging; strictly compliant healthcare visuals.
- **Search, Filtering & Responsive Grid**:
  - Debounced real-time product search with SKU, brand, and name indexing.
  - Sticky desktop filter sidebar & animated mobile drawer.
  - 2-column mobile (360px–430px), 3-column tablet (768px), 4-column desktop (1024px–1440px), 5-column wide (1920px).
  - Quick View modal with Escape key accessibility, focus trapping, and ARIA dialog roles.
  - Authentic INR (`₹`) formatting across all price displays and totals.

---

## 💳 Checkout & Payment Architecture

- **Multi-Step Checkout Flow**:
  - **Step 1: Cart Review** — Itemized medicines, pack sizes, quantities, and Rx requirement indicators.
  - **Step 2: Delivery Address** — Saved Indian addresses with default selector, addition, editing, and deletion.
  - **Step 3: Prescription Verification Gate** — Automatic detection of regulated medicines, attachment of approved doctor prescriptions or in-line upload.
  - **Step 4: Order Summary & Coupons** — Server-validated coupons, transparent INR pricing, standard Indian delivery fee waiver above ₹500, platform fee (₹5.00), and special delivery notes.
  - **Step 5: Multi-Provider Payment Gateway** — Razorpay, UPI Direct (GPay/PhonePe/Paytm), Cards, and Cash on Delivery (COD), with client-side simulation controls and server-side authoritative signature validation.

- **Authoritative Payment Verification (`POST /api/v1/payments/verify/`)**:
  - Server confirms transactions against the internal payment model and updates order status to `CONFIRMED`.
  - Maintains `internal_transaction_id` (`MS-TXN-...`) and external `provider_transaction_id`.
  - Dispatches categorized in-app notifications.

- **8-Stage Delivery Tracking**:
  - `PLACED` ➔ `CONFIRMED` ➔ `PROCESSING` ➔ `PACKED` ➔ `SHIPPED` ➔ `OUT_FOR_DELIVERY` ➔ `DELIVERED` (or `CANCELLED`).
  - Live courier tracking details, courier fleet identification, and invoice generator with print layout.
