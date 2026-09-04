import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '@/lib/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Initialize auth from localStorage on page mount
      initializeAuth: async () => {
        if (typeof window === 'undefined') return;
        const access = localStorage.getItem('mediswift_access_token');
        const refresh = localStorage.getItem('mediswift_refresh_token');

        if (access) {
          set({ accessToken: access, refreshToken: refresh, isAuthenticated: true });
          try {
            const res = await api.get('/users/me/');
            set({ user: res.data, isAuthenticated: true, error: null });
          } catch (err) {
            // Token might be expired, api interceptor handles refresh, but if failed:
            if (!localStorage.getItem('mediswift_access_token')) {
              set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
            }
          }
        }
      },

      // Login Action
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const res = await api.post('/token/', { email, password });
          const { access, refresh } = res.data;

          if (typeof window !== 'undefined') {
            localStorage.setItem('mediswift_access_token', access);
            localStorage.setItem('mediswift_refresh_token', refresh);
          }

          // Fetch current user details
          const userRes = await api.get('/users/me/');
          set({
            user: userRes.data,
            accessToken: access,
            refreshToken: refresh,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          return { success: true };
        } catch (err) {
          const msg =
            err.response?.data?.detail ||
            err.response?.data?.non_field_errors?.[0] ||
            'Invalid email or password. Please try again.';
          set({ error: msg, isLoading: false });
          return { success: false, error: msg };
        }
      },

      // Registration Action
      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          // Send to Django register endpoint
          await api.post('/register/', userData);

          // Automatically log the newly registered user in
          const loginRes = await get().login(userData.email, userData.password);
          set({ isLoading: false });
          return loginRes;
        } catch (err) {
          const errData = err.response?.data;
          let msg = 'Registration failed. Please check your details.';
          if (errData) {
            if (typeof errData === 'string') msg = errData;
            else if (errData.message) msg = errData.message;
            else {
              const firstKey = Object.keys(errData)[0];
              msg = Array.isArray(errData[firstKey]) ? `${firstKey}: ${errData[firstKey][0]}` : String(errData[firstKey]);
            }
          }
          set({ error: msg, isLoading: false });
          return { success: false, error: msg };
        }
      },

      // Logout Action
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('mediswift_access_token');
          localStorage.removeItem('mediswift_refresh_token');
        }
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'mediswift-auth-storage',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : null)),
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
