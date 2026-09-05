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

### 5. Running with Docker Compose
```bash
docker compose up --build
```
