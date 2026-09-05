# MediSwift REST API Specification (`/api/v1/`)

## Response Envelope Standard
All JSON responses follow a predictable format:

```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": { ... },
  "errors": null
}
```

Paginated collections include standard pagination metadata:
```json
{
  "success": true,
  "message": "Items retrieved successfully.",
  "data": {
    "count": 120,
    "next": "http://api.mediswift.in/api/v1/products/?page=2",
    "previous": null,
    "results": [ ... ]
  },
  "errors": null
}
```

---

## Key Endpoints

### 1. Authentication & Users (`/api/v1/auth/` and `/api/v1/users/`)
- `POST /api/v1/auth/register/` — Register new user (email, password, role, name, phone)
- `POST /api/v1/auth/login/` — Authenticate and receive JWT access + refresh tokens
- `POST /api/v1/auth/token/refresh/` — Rotate access token using valid refresh token
- `GET  /api/v1/users/me/` — Retrieve authenticated user profile
- `PATCH /api/v1/users/me/` — Update profile & medical details
- `GET / POST /api/v1/users/addresses/` — Manage delivery addresses

### 2. Medicine Catalog (`/api/v1/products/`)
- `GET  /api/v1/products/` — Filter by category, prescription required, brand, search keyword
- `GET  /api/v1/products/{slug}/` — Single product details with salt info and images
- `GET  /api/v1/categories/` — Hierarchical category list

### 3. Prescriptions (`/api/v1/prescriptions/`)
- `GET  /api/v1/prescriptions/` — Current patient's prescription uploads
- `POST /api/v1/prescriptions/upload/` — Upload document (PDF/JPG/PNG, up to 10MB)
- `GET  /api/v1/prescriptions/{id}/` — Prescription details & pharmacist review status
- `PATCH /api/v1/prescriptions/{id}/verify/` — Pharmacist verification & product linkage

### 4. Doctors & Telehealth (`/api/v1/doctors/` and `/api/v1/appointments/`)
- `GET  /api/v1/doctors/` — List verified doctors with specialty filter and rating
- `GET  /api/v1/doctors/{id}/` — Doctor profile, fees, bio, and working slots
- `GET  /api/v1/appointments/` — Patient's or doctor's scheduled appointments
- `POST /api/v1/appointments/book/` — Book slot with consultation mode (Video / Clinic)
- `POST /api/v1/appointments/{id}/cancel/` — Cancel appointment

### 5. Cart & Orders (`/api/v1/cart/` and `/api/v1/orders/`)
- `GET  /api/v1/cart/` — Retrieve active cart, items, subtotals, discount calculations
- `POST /api/v1/cart/items/` — Add medicine/product to cart
- `PATCH /api/v1/cart/items/{id}/` — Update quantity
- `DELETE /api/v1/cart/items/{id}/` — Remove item
- `POST /api/v1/orders/checkout/` — Convert cart to order with shipping address and payment method
- `GET  /api/v1/orders/` — User order history
- `GET  /api/v1/orders/{id}/` — Order status, dispatch tracking, items, invoice summary

### 6. Analytics (`/api/v1/analytics/`)
- `GET  /api/v1/analytics/summary/` — Admin KPI overview (gross sales, orders, appointments)
