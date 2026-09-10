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
  image_url?: string;
  subcategories_count?: number;
  products_count?: number;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  logo_url?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  generic_name: string;
  composition?: string;
  ingredients?: string;
  category: string;
  category_name: string;
  category_slug?: string;
  brand?: string;
  brand_name?: string;
  dosage_form: string;
  strength?: string;
  pack_size: string;
  price: string;
  price_inr?: string;
  original_price_inr?: string;
  discount_percent: string;
  discount_percentage?: string;
  discounted_price: string;
  stock_quantity: number;
  in_stock: boolean;
  rating?: string;
  review_count?: number;
  prescription_required: boolean;
  requires_prescription?: boolean;
  featured?: boolean;
  trending?: boolean;
  bestseller?: boolean;
  primary_image?: string;
  image_url?: string;
  additional_images?: string[];
  gallery_images?: string[];
  short_description?: string;
  detailed_description?: string;
  description?: string;
  usage_instructions?: string;
  directions?: string;
  side_effects?: string;
  warnings?: string;
  storage_information?: string;
  tags?: string[];
  related_products?: Product[];
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
  slug: string;
  doctor_name: string;
  avatar?: string;
  avatar_url?: string;
  specialties: Specialty[];
  qualifications: string;
  experience_years: number;
  consultation_fee: string;
  languages: string;
  hospital_affiliation: string;
  clinic_address?: string;
  city?: string;
  bio?: string;
  rating: string;
  review_count: number;
  is_available_for_telehealth: boolean;
  is_available_for_in_person?: boolean;
  is_verified?: boolean;
}

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED' | 'NO_SHOW';

export interface Appointment {
  id: string;
  booking_reference: string;
  doctor: Doctor;
  patient: User;
  scheduled_at: string;
  appointment_date?: string;
  start_time?: string;
  end_time?: string;
  consultation_type: 'VIDEO' | 'IN_PERSON';
  consultation_type_display: string;
  status: AppointmentStatus;
  status_display: string;
  fee_amount: string;
  symptoms?: string;
  doctor_notes?: string;
  meeting_provider?: string;
  meeting_room_id?: string;
  meeting_url?: string;
  meeting_status?: string;
  cancellation_reason?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface TimeSlot {
  time: string;
  time_display: string;
  end_time: string;
  period: 'Morning' | 'Afternoon' | 'Evening';
  available: boolean;
  reason?: string | null;
}

export interface AvailableSlotsData {
  doctor_id: string;
  doctor_name: string;
  date: string;
  weekday: string;
  slot_duration_minutes: number;
  total_slots: number;
  available_count: number;
  slots: TimeSlot[];
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
