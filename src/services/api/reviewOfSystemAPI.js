import apiClient from './apiClient';

export const createReviewOfSystems = async (payload) => {
  const response = await apiClient.post('/reviewOfSystems', payload);
  return response.data;
};

export const getAllReviewOfSystems = async (params = {}) => {
  const response = await apiClient.get('/reviewOfSystems', { params });
  return response.data;
};

export const getReviewOfSystemsByConsultationId = async (consultationId) => {
  if (!consultationId) throw new Error('Consultation ID is required');
  const response = await apiClient.get(
    `/reviewOfSystems/consultation/${consultationId}`
  );
  return response.data;
};

export const getReviewOfSystemsTemplates = async (params = {}) => {
  const response = await apiClient.get('/review-of-systems-templates', {
    params,
  });
  return response.data;
};

export const getReviewOfSystems = async (id) => {
  const response = await apiClient.get(`/reviewOfSystems/${id}`);
  return response.data;
};

export const updateReviewOfSystems = async (id, payload) => {
  const response = await apiClient.patch(`/reviewOfSystems/${id}`, payload);
  return response.data;
};

export default {
  createReviewOfSystems,
  getAllReviewOfSystems,
  getReviewOfSystemsByConsultationId,
  getReviewOfSystemsTemplates,
  getReviewOfSystems,
  updateReviewOfSystems,
};