import { apiClient } from '@/lib/api-client';
import { ApiResponse, Address } from '@/types';

export interface AddressPayload {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  landmark?: string;
  city: string;
  state: string;
  postal_code: string;
  address_type?: 'HOME' | 'WORK' | 'OTHER';
  is_default?: boolean;
}

export const addressService = {
  async getAddresses(): Promise<ApiResponse<Address[]>> {
    const response = await apiClient.get<ApiResponse<Address[]>>('/users/addresses/');
    return response.data;
  },

  async createAddress(payload: AddressPayload): Promise<ApiResponse<Address>> {
    const response = await apiClient.post<ApiResponse<Address>>('/users/addresses/', payload);
    return response.data;
  },

  async updateAddress(id: string, payload: Partial<AddressPayload>): Promise<ApiResponse<Address>> {
    const response = await apiClient.patch<ApiResponse<Address>>(`/users/addresses/${id}/`, payload);
    return response.data;
  },

  async deleteAddress(id: string): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<ApiResponse<null>>(`/users/addresses/${id}/`);
    return response.data;
  },

  async setDefaultAddress(id: string): Promise<ApiResponse<Address>> {
    const response = await apiClient.post<ApiResponse<Address>>(`/users/addresses/${id}/set-default/`);
    return response.data;
  },
};
