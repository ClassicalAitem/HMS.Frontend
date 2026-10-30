import apiClient from './apiClient';

export const supportAPI = {
  // Query Winston logs with search, level, aroundTime
  getLogs: async (params = {}) => {
    const response = await apiClient.get('/support/logs', { params });
    return response.data;
  },

  // Get log file statistics
  getLogStats: async () => {
    const response = await apiClient.get('/support/logs/stats');
    return response.data;
  },

  // Get system health metrics
  getHealth: async () => {
    const response = await apiClient.get('/support/health');
    return response.data;
  },

  // Setup / promote initial developer
  initDeveloper: async (data) => {
    const response = await apiClient.post('/support/init-developer', data);
    return response.data;
  },
};

export default supportAPI;

