import { apiClient } from '@/lib/api-client';
import { ApiResponse, User } from '@/types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  role?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
  user: User;
}

export const authService = {
  async login(payload: LoginPayload): Promise<ApiResponse<AuthTokens>> {
    const response = await apiClient.post<ApiResponse<AuthTokens>>('/auth/login/', payload);
    return response.data;
  },

  async register(payload: RegisterPayload): Promise<ApiResponse<User>> {
    const response = await apiClient.post<ApiResponse<User>>('/auth/register/', payload);
    return response.data;
  },

  async getProfile(): Promise<ApiResponse<User>> {
    const response = await apiClient.get<ApiResponse<User>>('/users/me/');
    return response.data;
  },

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    const response = await apiClient.patch<ApiResponse<User>>('/users/me/', data);
    return response.data;
  },
};
