import axios from 'axios';
import { config } from '../../config/env';

// Create axios instance
const apiClient = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: 50000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    console.log('🚀 API Client: Making request to:', config.url);
    console.log('🚀 API Client: Request method:', config.method);
    console.log('🚀 API Client: Request data:', config.data);
    
    // Get token from localStorage
    const directToken = localStorage.getItem('token');
    const persistRoot = localStorage.getItem('persist:root');
    
    console.log('🔍 API Client: Direct token from localStorage:', directToken ? 'Present' : 'Missing');
    console.log('🔍 API Client: persist:root exists:', persistRoot ? 'Yes' : 'No');
    
    let token = directToken;
    
    // Fallback: try to get token from persist:root
    if (!token && persistRoot) {
      try {
        const parsedRoot = JSON.parse(persistRoot);
        const authToken = parsedRoot?.auth?.token;
        if (authToken) {
          token = authToken.replace(/"/g, ''); // Remove quotes if present
          console.log('🔍 API Client: Token extracted from persist:root');
        }
      } catch (error) {
        console.error('❌ API Client: Error parsing persist:root:', error);
      }
    }
    
    if (token) {
      // Clean the token - remove any extra quotes or whitespace
      const cleanToken = token.replace(/^["']|["']$/g, '').trim();
      
      // Validate JWT format (should have 3 parts separated by dots)
      const jwtParts = cleanToken.split('.');
      if (jwtParts.length !== 3) {
        console.error('❌ API Client: Invalid JWT format - expected 3 parts, got:', jwtParts.length);
        console.error('❌ API Client: Token parts:', jwtParts);
        console.error('❌ API Client: Raw token:', token);
        console.error('❌ API Client: Clean token:', cleanToken);
      } else {
        config.headers.Authorization = `Bearer ${cleanToken}`;
        console.log('🔑 API Client: Token added to request');
        console.log('🔑 API Client: Token preview:', cleanToken.substring(0, 20) + '...');
        console.log('🔑 API Client: JWT parts count:', jwtParts.length);
      }
    } else {
      console.log('🔑 API Client: No token found in any location');
      console.log('🔍 API Client: Available localStorage keys:', Object.keys(localStorage));
    }
    
    return config;
  },
  (error) => {
    console.error('❌ API Client: Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Client: Response received');
    console.log('📥 API Client: Response status:', response.status);
    console.log('📥 API Client: Response data:', response.data);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (unauthorized) - JWT expired or invalid
    if (error.response?.status === 401) {
      console.log('🚨 API Client: 401 Unauthorized error detected');
      console.log('🚨 API Client: Error message:', error.response?.data?.message);
      
      // Check if it's a JWT expiration error
      const errorMessage = error.response?.data?.message?.toLowerCase();
      const isJwtExpired = errorMessage?.includes('jwt expired') || 
                          errorMessage?.includes('token expired') ||
                          errorMessage?.includes('jwt malformed');
      
      if (isJwtExpired) {
        console.log('⏰ API Client: JWT token has expired');
        console.log('🔄 API Client: Clearing authentication data and redirecting to login');
        
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
            console.log('🔄 API Client: Attempting token refresh');
            const response = await axios.post(`${config.API_BASE_URL}/user/refresh`, {
              refreshToken,
            });

            const { token: newToken, refreshToken: newRefreshToken } = response.data;
            
            // Update tokens in localStorage
            localStorage.setItem('token', newToken);
            localStorage.setItem('refreshToken', newRefreshToken);
            
            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          console.log('❌ API Client: Token refresh failed');
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

    console.log('❌ API Client: Request failed');
    console.log('❌ API Client: Error status:', error.response?.status);
    console.log('❌ API Client: Error message:', error.response?.data?.message);
    
    return Promise.reject(error);
  }
);

export default apiClient;

