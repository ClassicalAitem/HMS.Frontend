import apiClient from './apiClient';
import { API_ENDPOINTS } from '../../config/env';

export const usersAPI = {
  // Get all users
  getUsers: async (params = {}) => {
    console.log('👥 UsersAPI: Starting getUsers request');
    console.log('📤 UsersAPI: Request params:', params);
    console.log('🌐 UsersAPI: API endpoint:', API_ENDPOINTS.USERS);
    
    try {
      const response = await apiClient.get(API_ENDPOINTS.USERS, { params });
      console.log('✅ UsersAPI: Users response received');
      console.log('📥 UsersAPI: Response status:', response.status);
      console.log('📥 UsersAPI: Response data:', response.data);
      return response;
    } catch (error) {
      console.error('❌ UsersAPI: Get users error occurred');
      console.error('📥 UsersAPI: Error response:', error.response);
      console.error('📥 UsersAPI: Error data:', error.response?.data);
      console.error('📥 UsersAPI: Error status:', error.response?.status);
      console.error('📥 UsersAPI: Error message:', error.message);
      throw error;
    }
  },

  // Get user by ID
  getUserById: async (userId) => {
    console.log('👤 UsersAPI: Starting getUserById request');
    console.log('📤 UsersAPI: User ID:', userId);
    
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.USERS}/${userId}`);
      console.log('✅ UsersAPI: User response received');
      console.log('📥 UsersAPI: Response data:', response.data);
      return response;
    } catch (error) {
      console.error('❌ UsersAPI: Get user by ID error occurred');
      console.error('📥 UsersAPI: Error response:', error.response);
      throw error;
    }
  },

  // Create new user
  createUser: async (userData) => {
    console.log('➕ UsersAPI: Starting createUser request');
    console.log('📤 UsersAPI: User data:', userData);
    
    try {
      const response = await apiClient.post(API_ENDPOINTS.CREATE_STAFF, userData);
      console.log('✅ UsersAPI: Create user response received');
      console.log('📥 UsersAPI: Response data:', response.data);
      return response;
    } catch (error) {
      console.error('❌ UsersAPI: Create user error occurred');
      console.error('📥 UsersAPI: Error response:', error.response);
      throw error;
    }
  },

  // Create admin user
  createAdmin: async (adminData) => {
    console.log('👑 UsersAPI: Starting createAdmin request');
    console.log('📤 UsersAPI: Admin data:', adminData);
    
    try {
      const response = await apiClient.post('/user/createAdmin', adminData);
      console.log('✅ UsersAPI: Create admin response received');
      console.log('📥 UsersAPI: Response data:', response.data);
      return response;
    } catch (error) {
      console.error('❌ UsersAPI: Create admin error occurred');
      console.error('📥 UsersAPI: Error response:', error.response);
      console.error('📥 UsersAPI: Error data:', error.response?.data);
      console.error('📥 UsersAPI: Error status:', error.response?.status);
      throw error;
    }
  },

  // Update user
  updateUser: async (userId, userData) => {
    console.log('✏️ UsersAPI: Starting updateUser request');
    console.log('📤 UsersAPI: User ID:', userId);
    console.log('📤 UsersAPI: User data:', userData);
    
    try {
      const response = await apiClient.put(`${API_ENDPOINTS.USERS}/${userId}`, userData);
      console.log('✅ UsersAPI: Update user response received');
      console.log('📥 UsersAPI: Response data:', response.data);
      return response;
    } catch (error) {
      console.error('❌ UsersAPI: Update user error occurred');
      console.error('📥 UsersAPI: Error response:', error.response);
      throw error;
    }
  },

  // Delete user
  deleteUser: async (userId) => {
    console.log('🗑️ UsersAPI: Starting deleteUser request');
    console.log('📤 UsersAPI: User ID:', userId);
    
    try {
      const response = await apiClient.delete(`${API_ENDPOINTS.USERS}/${userId}`);
      console.log('✅ UsersAPI: Delete user response received');
      console.log('📥 UsersAPI: Response data:', response.data);
      return response;
    } catch (error) {
      console.error('❌ UsersAPI: Delete user error occurred');
      console.error('📥 UsersAPI: Error response:', error.response);
      throw error;
    }
  },

  // Toggle user status (activate/deactivate)
  toggleUserStatus: async (userId, isActive) => {
    console.log('🔄 UsersAPI: Starting toggleUserStatus request');
    console.log('📤 UsersAPI: User ID:', userId);
    console.log('📤 UsersAPI: Is Active:', isActive);
    
    try {
      const response = await apiClient.patch(`${API_ENDPOINTS.USERS}/${userId}/status`, { isActive });
      console.log('✅ UsersAPI: Toggle status response received');
      console.log('📥 UsersAPI: Response data:', response.data);
      return response;
    } catch (error) {
      console.error('❌ UsersAPI: Toggle status error occurred');
      console.error('📥 UsersAPI: Error response:', error.response);
      throw error;
    }
  },
};
