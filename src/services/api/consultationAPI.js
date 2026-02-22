import apiClient from './apiClient';

export const getConsultations = async (params = {}) => {
  const response = await apiClient.get('/consultation', { params });
  return response.data;
};

export const getConsultationById = async (id) => {
  if (!id) throw new Error('Consultation ID is required');
  const response = await apiClient.get(`/consultation/${id}`);
  return response.data;
};

export const createConsultation = async (payload) => {
  const response = await apiClient.post('/consultation', payload);
  return response.data;
};

export const updateConsultation = async (id, payload) => {
  if (!id) throw new Error('Consultation ID is required');
  const response = await apiClient.patch(`/consultation/${id}`, payload);
  return response.data;
};

export default {
  getConsultations,
  getConsultationById,
  createConsultation,
  updateConsultation,
};