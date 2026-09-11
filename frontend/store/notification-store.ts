import { create } from 'zustand';
import { NotificationItem } from '@/types';
import { notificationService } from '@/services/notification-service';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
}

interface NotificationStore {
  toasts: ToastItem[];
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  toasts: [],
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4500);
  },

  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  fetchNotifications: async () => {
    try {
      set({ isLoading: true });
      const res = await notificationService.getNotifications();
      let list: NotificationItem[] = [];
      if (res && res.data) {
        if (Array.isArray(res.data)) {
          list = res.data;
        } else if ('results' in res.data && Array.isArray(res.data.results)) {
          list = res.data.results;
        }
      }
      const unread = list.filter((n) => !n.is_read).length;
      set({ notifications: list, unreadCount: unread, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  markAsRead: async (id: string) => {
    const current = get().notifications;
    const updated = current.map((n) => (n.id === id ? { ...n, is_read: true } : n));
    const unread = updated.filter((n) => !n.is_read).length;
    set({ notifications: updated, unreadCount: unread });
    try {
      await notificationService.markAsRead(id);
    } catch {
      // rollback or silent ignore
    }
  },

  markAllAsRead: async () => {
    const current = get().notifications;
    const updated = current.map((n) => ({ ...n, is_read: true }));
    set({ notifications: updated, unreadCount: 0 });
    try {
      await notificationService.markAllAsRead();
    } catch {
      // ignore
    }
  },
}));
