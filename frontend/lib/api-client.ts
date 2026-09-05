import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request Interceptor: Attach Access Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const authData = localStorage.getItem('mediswift_auth');
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          if (parsed?.state?.accessToken) {
            config.headers.Authorization = `Bearer ${parsed.state.accessToken}`;
          }
        } catch {
          // Ignore json parse error
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Refresh Token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest?._retry) {
      if (typeof window === 'undefined') return Promise.reject(error);

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const authData = localStorage.getItem('mediswift_auth');
      const refreshToken = authData ? JSON.parse(authData)?.state?.refreshToken : null;

      if (!refreshToken) {
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        const newAccessToken = data.access;

        // Update local storage
        if (authData) {
          const parsed = JSON.parse(authData);
          parsed.state.accessToken = newAccessToken;
          localStorage.setItem('mediswift_auth', JSON.stringify(parsed));
        }

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        processQueue(null, newAccessToken);
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem('mediswift_auth');
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
