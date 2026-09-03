import apiClient from './apiClient';

// Get all service charges
export const getServiceCharges = async () => {
  const response = await apiClient.get('/serviceCharge');
  return response.data;
};

// Get service charge by ID
export const getServiceCharge = async (id) => {
  const response = await apiClient.get(`/serviceCharge/${id}`);
  return response.data;
};

// Create new service charge
export const createServiceCharge = async (payload) => {
  const response = await apiClient.post('/serviceCharge', payload);
  return response.data;
};

// Update service charge
export const updateServiceCharge = async (id, payload) => {
  const response = await apiClient.patch(`/serviceCharge/${id}`, payload);
  return response.data;
};

// Delete service charge
export const deleteServiceCharge = async (id) => {
  const response = await apiClient.delete(`/serviceCharge/${id}`);
  return response.data;
};

export default {
  getServiceCharges,
  getServiceCharge,
  createServiceCharge,
  updateServiceCharge,
  deleteServiceCharge,
};
