import apiClient from './apiClient';

export const createExamination = async (payload) => {
  const response = await apiClient.post('/examinations', payload);
  return response.data;
};

export const getExaminationByConsultationId = async (consultationId) => {
  if (!consultationId) throw new Error('Consultation ID is required');
  const response = await apiClient.get(
    `/examinations/consultation/${consultationId}`
  );
  return response.data;
};

export const updateExamination = async (id, payload) => {
  if (!id) throw new Error('Examination ID is required');
  const response = await apiClient.patch(`/examinations/${id}`, payload);
  return response.data;
};

export const getExaminationTemplates = async (params = {}) => {
  const response = await apiClient.get('/examination-templates', { params });
  return response.data;
};

export default {
  createExamination,
  getExaminationByConsultationId,
  updateExamination,
  getExaminationTemplates,
};