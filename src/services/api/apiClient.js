import axios from 'axios';
import { config } from '../../config/env';

// Create axios instance
const apiClient = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: 30000, 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const directToken = localStorage.getItem('token');
    const persistRoot = localStorage.getItem('persist:root');
    let token = directToken;

    if (!token && persistRoot) {
      try {
        const parsedRoot = JSON.parse(persistRoot);
        const authToken = parsedRoot?.auth?.token;
        if (authToken) token = authToken.replace(/"/g, '');
      } catch {
        // malformed persist:root, skip
      }
    }

    if (token) {
      const cleanToken = token.replace(/^["']|["']$/g, '').trim();
      if (cleanToken.split('.').length === 3) {
        config.headers.Authorization = `Bearer ${cleanToken}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const errorMessage = error.response?.data?.message?.toLowerCase() ?? '';

    if (error.response?.status === 401) {
      const isAuthError =
        errorMessage.includes('jwt expired') ||
        errorMessage.includes('token expired') ||
        errorMessage.includes('jwt malformed') ||
        errorMessage.includes('please log in') ||
        errorMessage.includes('unauthorized') ||
        errorMessage.includes('no token provided') ||
        errorMessage.includes('access denied');

      if (isAuthError) {
        ['token', 'refreshToken', 'persist:root', 'authToken', 'user'].forEach(k =>
          localStorage.removeItem(k)
        );
        window.dispatchEvent(new CustomEvent('auth:token-expired', {
          detail: { message: 'Your session has expired. Please log in again.' }
        }));
        setTimeout(() => { window.location.href = '/login'; }, 1000);
        return Promise.reject(new Error('Session expired. Please log in again.'));
      }

      if (!originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const refreshToken =
            localStorage.getItem('refreshToken') ||
            JSON.parse(localStorage.getItem('persist:root') || '{}')?.auth?.refreshToken?.replace(/"/g, '');

          if (refreshToken) {
            const response = await axios.post(`${config.API_BASE_URL}/user/refresh`, { refreshToken });
            const { token: newToken, refreshToken: newRefreshToken } = response.data;
            localStorage.setItem('token', newToken);
            localStorage.setItem('refreshToken', newRefreshToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return apiClient(originalRequest);
          }
        } catch {
          ['token', 'refreshToken', 'persist:root', 'authToken', 'user'].forEach(k =>
            localStorage.removeItem(k)
          );
          setTimeout(() => { window.location.href = '/login'; }, 1000);
          return Promise.reject(error);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

