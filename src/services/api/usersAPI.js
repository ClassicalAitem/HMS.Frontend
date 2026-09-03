import apiClient from './apiClient';
import { API_ENDPOINTS } from '../../config/env';

export const usersAPI = {
  // Get all users
  getUsers: async (params = {}) => {
    const response = await apiClient.get(API_ENDPOINTS.USERS, { params });
    return response;
  },

  // Get user by ID
  getUserById: async (userId) => {
    const response = await apiClient.get(`${API_ENDPOINTS.USERS}/${userId}`);
    return response;
  },

  // Create new user
  createUser: async (userData) => {
    const requiredFields = ['firstName', 'lastName', 'email', 'password', 'role'];
    for (const field of requiredFields) {
      if (!userData?.[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    const response = await apiClient.post(API_ENDPOINTS.CREATE_STAFF, userData);
    return response;
  },

  // Create admin user
  createAdmin: async (adminData) => {
    const response = await apiClient.post('/user/createAdmin', adminData);
    return response;
  },

  // Update user
  updateUser: async (userId, userData) => {
    const response = await apiClient.patch(`${API_ENDPOINTS.UPDATE_USER}/${userId}`, userData);
    return response;
  },

  // Disable user account
  disableUserAccount: async (userId, userData) => {
    const response = await apiClient.patch(`${API_ENDPOINTS.DISABLE_ACCOUNT}/${userId}`, userData);
    return response;
  },

  // Reset password
  resetUserPassword: async (userData) => {
    const response = await apiClient.patch(`${API_ENDPOINTS.RESET_PASSWORD}`, userData);
    return response;
  },

  deleteUser: async (userId) => {
    const response = await apiClient.patch(`${API_ENDPOINTS.DELETE_USER}/${userId}`);
    return response;
  },

  // Toggle user status (activate/deactivate)
  toggleUserStatus: async (userId, isDisabled) => {
    const response = await apiClient.patch(`${API_ENDPOINTS.DISABLE_ENABLE_ACCOUNT}/${userId}`, { isDisabled });
    return response;
  },
};

export default usersAPI;
