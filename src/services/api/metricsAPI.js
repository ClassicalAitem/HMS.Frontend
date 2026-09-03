import apiClient from './apiClient';

// Get metrics data
export const getMetrics = async () => {
  const response = await apiClient.get('/metrics');
  return response.data;
};

// Get staff metrics data
export const getStaffMetrics = async () => {
  const response = await apiClient.get('/metrics/getOverallStaff');
  return response.data;
};

export default {
  getMetrics,
  getStaffMetrics,
};