import axios from 'axios';
import { config } from '../../config/env';
import { showErrorToast } from '../../utils/errorHandler';

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
    // Get token from localStorage
    const directToken = localStorage.getItem('token');
    const persistRoot = localStorage.getItem('persist:root');

    let token = directToken;

    // Fallback: try to get token from persist:root
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

      // Validate JWT format (should have 3 parts separated by dots)
      const jwtParts = cleanToken.split('.');
      if (jwtParts.length !== 3) {
        localStorage.removeItem('token');
      } else {
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

    if (error.response?.status === 401) {
      // Check if it's a genuine JWT expiration or invalid token error
      const errorMessage = String(error.response?.data?.message || error.response?.data?.error || '').toLowerCase();
      const isJwtExpired = errorMessage.includes('jwt expired') ||
                          errorMessage.includes('token expired') ||
                          errorMessage.includes('token has expired') ||
                          errorMessage.includes('jwt malformed') ||
                          errorMessage.includes('invalid token') ||
                          errorMessage.includes('no token provided');

      if (isJwtExpired) {
        // Clear all authentication data
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('persist:root');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');

        // Show user-friendly error message
        if (typeof window !== 'undefined' && window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('auth:token-expired', {
            detail: { message: 'Your session has expired. Please log in again.' }
          }));
        }

        // Redirect to login page
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);

        return Promise.reject(new Error('Session expired. Please log in again.'));
      }

      // For other 401 errors, try token refresh if available
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        try {
          // Try to refresh token (if refresh endpoint is implemented)
          const refreshToken = localStorage.getItem('refreshToken') ||
                             JSON.parse(localStorage.getItem('persist:root') || '{}')?.auth?.refreshToken?.replace(/"/g, '');

          if (refreshToken) {
            const response = await axios.post(`${config.API_BASE_URL}/user/refresh`, { refreshToken });
            const { token: newToken, refreshToken: newRefreshToken } = response.data;

            // Update tokens in localStorage
            localStorage.setItem('token', newToken);
            localStorage.setItem('refreshToken', newRefreshToken);

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, clear auth data and redirect
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('persist:root');
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');

          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);

          return Promise.reject(refreshError);
        }
      }
    }

    if (!error.config?.skipErrorToast && error.response?.status !== 401) {
      showErrorToast(error);
    }

    return Promise.reject(error);
  }
);

export default apiClient;

