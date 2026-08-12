import apiClient from './apiClient';

export const getQueueCount = async (role) => {
  const response = await apiClient.get(`/patient/queue-count/${role}`);
  return response.data;
};