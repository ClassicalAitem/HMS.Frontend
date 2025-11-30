import apiClient from './apiClient';

export const getConsultations = async (params = {}) => {
  try {
    const response = await apiClient.get('/consultation', { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getConsultationById = async (id) => {
  if (!id) throw new Error('Consultation ID is required');
  try {
    const response = await apiClient.get(`/consultation/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createConsultation = async (payload) => {
  try {
    const response = await apiClient.post('/consultation', payload);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default {
  getConsultations,
  getConsultationById,
  createConsultation,
};