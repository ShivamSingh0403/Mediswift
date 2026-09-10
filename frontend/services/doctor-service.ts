import { apiClient } from '@/lib/api-client';
import { ApiResponse, PaginatedResponse, Doctor, Specialty } from '@/types';

export interface DoctorQueryParams {
  page?: number;
  search?: string;
  specialty?: string;
  telehealth_only?: boolean;
  in_person_only?: boolean;
  min_rating?: number;
  min_fee?: number;
  max_fee?: number;
  min_experience?: number;
  max_experience?: number;
  language?: string;
  city?: string;
  ordering?: string;
}

export const doctorService = {
  async getDoctors(params?: DoctorQueryParams): Promise<ApiResponse<PaginatedResponse<Doctor>>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Doctor>>>('/doctors/', { params });
    return response.data;
  },

  async getDoctorById(id: string): Promise<ApiResponse<Doctor>> {
    const response = await apiClient.get<ApiResponse<Doctor>>(`/doctors/${id}/`);
    return response.data;
  },

  async getDoctorBySlug(slug: string): Promise<ApiResponse<Doctor>> {
    const response = await apiClient.get<ApiResponse<Doctor>>(`/doctors/${slug}/`);
    return response.data;
  },

  async getSpecialties(): Promise<ApiResponse<PaginatedResponse<Specialty>>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Specialty>>>('/doctors/specialties/');
    return response.data;
  },
};

