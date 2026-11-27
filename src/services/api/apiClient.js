import axios from 'axios';
import toast from 'react-hot-toast';
import { config } from '../../config/env';
import { showErrorToast } from '../../utils/errorHandler';
import { recordFailedRequest } from '../../utils/diagnostics';
import { broadcastActivity } from '../../utils/authSync';

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
    // User activity heartbeat: every API request confirms the session is in active use
    try {
      broadcastActivity();
    } catch {}

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

let isRedirectingToLogin = false;

const handleExpiredSession = () => {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('persist:root');
  } catch {}

  if (!isRedirectingToLogin) {
    isRedirectingToLogin = true;
    toast.error('Your session has expired. Please log in again.', { id: 'session-expired' });
    if (window.location.pathname !== '/login') {
      setTimeout(() => {
        window.location.replace('/login');
      }, 300);
    } else {
      isRedirectingToLogin = false;
    }
  }
};

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Record diagnostics for failed requests (e.g. 4xx, 5xx)
    try {
      recordFailedRequest({
        method: error.config?.method,
        url: error.config?.url,
        status: error.response?.status,
        statusText: error.response?.statusText,
        requestData: error.config?.data,
        responseData: error.response?.data,
      });
    } catch {}

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
        handleExpiredSession();
        return Promise.reject(new Error('Session expired.'));
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
          handleExpiredSession();
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
