import { apiClient } from '@/lib/api-client';
import { ApiResponse, PaginatedResponse, Order, Coupon, PaymentProvider } from '@/types';

export interface CheckoutPayload {
  shipping_address_id: string;
  prescription_id?: string;
  coupon_code?: string;
  delivery_notes?: string;
  payment_method?: PaymentProvider;
}

export interface CheckoutResult {
  order: Order;
  payment: {
    id: string;
    internal_transaction_id: string;
    provider: string;
    amount: string;
    status: string;
    gateway_order_id?: string;
  };
}

export interface CouponValidationResult {
  coupon: Coupon;
  discount_amount: string;
  subtotal: string;
  final_amount: string;
}

export interface ReorderResult {
  added_items: Array<{ product_id: string; name: string; quantity: number }>;
  unavailable_items: string[];
  cart_total_items: number;
}

export const orderService = {
  async checkout(payload: CheckoutPayload): Promise<ApiResponse<CheckoutResult | Order>> {
    const response = await apiClient.post<ApiResponse<CheckoutResult | Order>>('/orders/checkout/', payload);
    return response.data;
  },

  async getOrders(): Promise<ApiResponse<PaginatedResponse<Order> | Order[]>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Order> | Order[]>>('/orders/');
    return response.data;
  },

  async getOrderById(id: string): Promise<ApiResponse<Order>> {
    const response = await apiClient.get<ApiResponse<Order>>(`/orders/${id}/`);
    return response.data;
  },

  async validateCoupon(code: string, subtotal?: number): Promise<ApiResponse<CouponValidationResult>> {
    const response = await apiClient.post<ApiResponse<CouponValidationResult>>('/orders/validate-coupon/', {
      code,
      subtotal,
    });
    return response.data;
  },

  async getAvailableCoupons(): Promise<ApiResponse<Coupon[]>> {
    const response = await apiClient.get<ApiResponse<Coupon[]>>('/orders/available-coupons/');
    return response.data;
  },

  async reorder(orderId: string): Promise<ApiResponse<ReorderResult>> {
    const response = await apiClient.post<ApiResponse<ReorderResult>>(`/orders/${orderId}/reorder/`);
    return response.data;
  },
};
