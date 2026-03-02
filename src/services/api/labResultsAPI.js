import apiClient from './apiClient';

export const getLabResults = async (params = {}) => {
  const response = await apiClient.get('/labResult', { params });
  return response.data;
};

export const getLabResultById = async (id) => {
  if (!id) throw new Error('Lab result ID is required');
  const response = await apiClient.get(`/labResult/${id}`);
  return response.data;
};

export const createLabResult = async (investigationRequestId, data) => {
  // Send the complete form data as JSON
  const payload = {
    patientId: data?.patientId,
    form: data?.form,
    remarks: data?.remarks,
  };
  
  const response = await apiClient.post(`/labResult/${investigationRequestId}`, payload);
  return response.data;
};

export const updateLabResult = async (id, payload) => {
  const response = await apiClient.patch(`/labResult/${id}`, payload);
  return response.data;
};

export default {
  getLabResults,
  getLabResultById,
  createLabResult,
  updateLabResult,
};
