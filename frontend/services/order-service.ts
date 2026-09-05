import { apiClient } from '@/lib/api-client';
import { ApiResponse, PaginatedResponse, Order } from '@/types';

export interface CheckoutPayload {
  shipping_address_id: string;
  prescription_id?: string;
  delivery_notes?: string;
}

export const orderService = {
  async checkout(payload: CheckoutPayload): Promise<ApiResponse<Order>> {
    const response = await apiClient.post<ApiResponse<Order>>('/orders/checkout/', payload);
    return response.data;
  },

  async getOrders(): Promise<ApiResponse<PaginatedResponse<Order>>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Order>>>('/orders/');
    return response.data;
  },

  async getOrderById(id: string): Promise<ApiResponse<Order>> {
    const response = await apiClient.get<ApiResponse<Order>>(`/orders/${id}/`);
    return response.data;
  },
};
