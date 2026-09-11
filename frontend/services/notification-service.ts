import { apiClient } from '@/lib/api-client';
import { ApiResponse, PaginatedResponse, NotificationItem } from '@/types';

export const notificationService = {
  async getNotifications(): Promise<ApiResponse<PaginatedResponse<NotificationItem> | NotificationItem[]>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<NotificationItem> | NotificationItem[]>>('/notifications/');
    return response.data;
  },

  async markAsRead(id: string): Promise<ApiResponse<null>> {
    const response = await apiClient.post<ApiResponse<null>>(`/notifications/${id}/mark_read/`);
    return response.data;
  },

  async markAllAsRead(): Promise<ApiResponse<null>> {
    const response = await apiClient.post<ApiResponse<null>>('/notifications/mark_all_read/');
    return response.data;
  },
};
