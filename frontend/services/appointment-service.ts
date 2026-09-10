import { apiClient } from '@/lib/api-client';
import { ApiResponse, PaginatedResponse, Appointment, AvailableSlotsData } from '@/types';

export interface BookAppointmentPayload {
  doctor: string;
  scheduled_at: string;
  consultation_type: 'VIDEO' | 'IN_PERSON';
  symptoms?: string;
}

export interface AppointmentFilterParams {
  filter?: 'upcoming' | 'completed' | 'cancelled';
  status?: string;
  page?: number;
}

export const appointmentService = {
  async getAvailableSlots(
    doctorId: string,
    date: string,
    consultationType: 'VIDEO' | 'IN_PERSON' = 'VIDEO'
  ): Promise<ApiResponse<AvailableSlotsData>> {
    const response = await apiClient.get<ApiResponse<AvailableSlotsData>>(
      '/appointments/available-slots/',
      {
        params: {
          doctor_id: doctorId,
          date,
          consultation_type: consultationType,
        },
      }
    );
    return response.data;
  },

  async bookAppointment(payload: BookAppointmentPayload): Promise<ApiResponse<Appointment>> {
    const response = await apiClient.post<ApiResponse<Appointment>>(
      '/appointments/',
      payload
    );
    return response.data;
  },

  async getAppointments(params?: AppointmentFilterParams): Promise<ApiResponse<PaginatedResponse<Appointment>>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Appointment>>>(
      '/appointments/',
      { params }
    );
    return response.data;
  },

  async getAppointmentById(id: string): Promise<ApiResponse<Appointment>> {
    const response = await apiClient.get<ApiResponse<Appointment>>(`/appointments/${id}/`);
    return response.data;
  },

  async rescheduleAppointment(
    id: string,
    newScheduledAt: string,
    reason?: string
  ): Promise<ApiResponse<Appointment>> {
    const response = await apiClient.post<ApiResponse<Appointment>>(
      `/appointments/${id}/reschedule/`,
      {
        new_scheduled_at: newScheduledAt,
        reason,
      }
    );
    return response.data;
  },

  async cancelAppointment(id: string, reason?: string): Promise<ApiResponse<Appointment>> {
    const response = await apiClient.post<ApiResponse<Appointment>>(
      `/appointments/${id}/cancel/`,
      { reason }
    );
    return response.data;
  },
};
