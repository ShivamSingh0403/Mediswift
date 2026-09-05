export type UserRole = 'CUSTOMER' | 'DOCTOR' | 'PHARMACIST' | 'ADMIN' | 'DELIVERY_MANAGER';

export interface UserProfile {
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  emergency_contact?: string;
  avatar?: string;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone_number?: string;
  is_kyc_verified: boolean;
  profile?: UserProfile;
  created_at: string;
}

export interface Address {
  id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  landmark?: string;
  city: string;
  state: string;
  postal_code: string;
  address_type: 'HOME' | 'WORK' | 'OTHER';
  is_default: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  subcategories_count?: number;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  generic_name: string;
  composition?: string;
  category: string;
  category_name: string;
  brand?: string;
  brand_name?: string;
  dosage_form: string;
  pack_size: string;
  price: string;
  discount_percent: string;
  discounted_price: string;
  stock_quantity: number;
  in_stock: boolean;
  prescription_required: boolean;
  primary_image?: string;
  description?: string;
  usage_instructions?: string;
  side_effects?: string;
  manufacturer?: string;
}

export type PrescriptionStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface Prescription {
  id: string;
  original_filename: string;
  doctor_name?: string;
  patient_notes?: string;
  status: PrescriptionStatus;
  status_display: string;
  pharmacist_notes?: string;
  verified_by_name?: string;
  verified_at?: string;
  document?: string;
  created_at: string;
}

export interface Specialty {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

export interface Doctor {
  id: string;
  doctor_name: string;
  avatar?: string;
  specialties: Specialty[];
  qualifications: string;
  experience_years: number;
  consultation_fee: string;
  languages: string;
  hospital_affiliation: string;
  clinic_address?: string;
  bio?: string;
  rating: string;
  review_count: number;
  is_available_for_telehealth: boolean;
}

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';

export interface Appointment {
  id: string;
  doctor: Doctor;
  patient: User;
  scheduled_at: string;
  consultation_type: 'VIDEO' | 'IN_PERSON';
  consultation_type_display: string;
  status: AppointmentStatus;
  status_display: string;
  fee_amount: string;
  symptoms?: string;
  meeting_link?: string;
  created_at: string;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  unit_price: string;
  total_price: string;
}

export interface Cart {
  id: string;
  items: CartItem[];
  total_items: number;
  subtotal: string;
  requires_prescription: boolean;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'DISPATCHED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';

export interface OrderItem {
  id: string;
  product: string;
  product_name: string;
  unit_price: string;
  quantity: number;
  total_price: string;
}

export interface Order {
  id: string;
  order_number: string;
  status: OrderStatus;
  status_display: string;
  subtotal: string;
  discount_amount: string;
  delivery_fee: string;
  total_amount: string;
  shipping_address: Address;
  prescription?: string;
  tracking_number?: string;
  estimated_delivery?: string;
  items: OrderItem[];
  created_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[] | string> | null;
}

export interface PaginatedResponse<T> {
  count: number;
  total_pages: number;
  current_page: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
