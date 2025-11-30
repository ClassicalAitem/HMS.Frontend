import apiClient from './apiClient';

// Get metrics data
export const getMetrics = async () => {
  try {
    console.log('📊 MetricsAPI: Fetching metrics data');
    const response = await apiClient.get('/metrics');
    console.log('✅ MetricsAPI: Metrics fetched successfully');
    console.log('📊 MetricsAPI: Response data:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ MetricsAPI: Get metrics error occurred');
    console.error('📥 MetricsAPI: Error response:', error.response);
    console.error('📥 MetricsAPI: Error data:', error.response?.data);
    throw error;
  }
};

// Get staff metrics data
export const getStaffMetrics = async () => {
  try {
    console.log('📊 MetricsAPI: Fetching staff metrics data');
    const response = await apiClient.get('/metrics/getOverallStaff');
    console.log('✅ MetricsAPI: Staff metrics fetched successfully');
    console.log('📊 MetricsAPI: Staff response data:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ MetricsAPI: Get staff metrics error occurred');
    console.error('📥 MetricsAPI: Error response:', error.response);
    console.error('📥 MetricsAPI: Error data:', error.response?.data);
    throw error;
  }
};

export default {
  getMetrics,
  getStaffMetrics
};