import { apiClient } from '@/lib/api-client';
import { ApiResponse, PaginatedResponse, Prescription } from '@/types';

export const prescriptionService = {
  async uploadPrescription(formData: FormData): Promise<ApiResponse<Prescription>> {
    const response = await apiClient.post<ApiResponse<Prescription>>('/prescriptions/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getPrescriptions(): Promise<ApiResponse<PaginatedResponse<Prescription>>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Prescription>>>('/prescriptions/');
    return response.data;
  },

  async getPrescriptionById(id: string): Promise<ApiResponse<Prescription>> {
    const response = await apiClient.get<ApiResponse<Prescription>>(`/prescriptions/${id}/`);
    return response.data;
  },
};
