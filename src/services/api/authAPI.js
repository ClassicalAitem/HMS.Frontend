import apiClient from './apiClient';
import { API_ENDPOINTS } from '../../config/env';

export const authAPI = {
  // Login user
  login: async (credentials) => {
    console.log('🔐 AuthAPI: Starting login request');
    console.log('📤 AuthAPI: Login credentials:', credentials);
    console.log('🌐 AuthAPI: API endpoint:', API_ENDPOINTS.LOGIN);
    console.log('🔗 AuthAPI: Full URL:', `${import.meta.env.VITE_API_BASE_URL}${API_ENDPOINTS.LOGIN}`);
    
    try {
      const response = await apiClient.post(API_ENDPOINTS.LOGIN, credentials);
      console.log('✅ AuthAPI: Login response received');
      console.log('📥 AuthAPI: Response status:', response.status);
      console.log('📥 AuthAPI: Response data:', response.data);
      return response;
    } catch (error) {
      console.error('❌ AuthAPI: Login error occurred');
      console.error('📥 AuthAPI: Error response:', error.response);
      console.error('📥 AuthAPI: Error data:', error.response?.data);
      console.error('📥 AuthAPI: Error status:', error.response?.status);
      console.error('📥 AuthAPI: Error message:', error.message);
      throw error;
    }
  },

  // Logout user
  logout: async (token) => {
    const response = await apiClient.post(API_ENDPOINTS.LOGOUT, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response;
  },

  // Refresh token
  refreshToken: async (refreshToken) => {
    const response = await apiClient.post(API_ENDPOINTS.REFRESH_TOKEN, {
      refreshToken,
    });
    return response;
  },

  // Change password
  changePassword: async (passwordData, userId) => {
    console.log('🔄 AuthAPI: Changing password for user:', userId);
    console.log('📤 AuthAPI: Password data:', passwordData);
    
    const response = await apiClient.patch(`/user/changePassword/${userId}`, passwordData);
    console.log('✅ AuthAPI: Change password response:', response);
    return response;
  },

  // Forgot password
  forgotPassword: async (email) => {
    const response = await apiClient.post(API_ENDPOINTS.FORGOT_PASSWORD, { email });
    return response;
  },

  // Reset password
  resetPassword: async (resetData) => {
    const response = await apiClient.post('/auth/reset-password', resetData);
    return response;
  },

  // Verify email
  verifyEmail: async (verificationData) => {
    const response = await apiClient.post('/auth/verify-email', verificationData);
    return response;
  },
};

