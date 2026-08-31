import apiClient from './apiClient';
import { API_ENDPOINTS } from '../../config/env';

export const authAPI = {
  // Login user
  login: async (credentials) => {
    return apiClient.post(API_ENDPOINTS.LOGIN, credentials);
  },

  // Logout user
  logout: async () => {
    return apiClient.post('/user/logout');
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
    return apiClient.patch(`/user/changePassword/${userId}`, passwordData);
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

