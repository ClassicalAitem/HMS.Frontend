import apiClient from './apiClient';

// Get metrics data
export const getMetrics = async () => {
  const response = await apiClient.get('/metrics');
  return response.data;
};

export const getOverallMetrics = getMetrics;

// Get staff metrics data
export const getStaffMetrics = async () => {
  const response = await apiClient.get('/metrics/getOverallStaff');
  return response.data;
};

export const getOverallStaff = getStaffMetrics;

export default {
  getMetrics,
  getOverallMetrics,
  getStaffMetrics,
  getOverallStaff,
};
