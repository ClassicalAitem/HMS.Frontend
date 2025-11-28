import apiClient from './apiClient';

export const getLabResults = async (params = {}) => {
  try {
    const response = await apiClient.get('/labResult', { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getLabResultById = async (id) => {
  if (!id) throw new Error('Lab result ID is required');
  try {
    const response = await apiClient.get(`/labResult/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createLabResult = async (investigationRequestId, data) => {
  try {
    const form = new FormData();
    if (data?.patientId) form.append('patientId', data.patientId);
    if (data?.tests) form.append('tests', typeof data.tests === 'string' ? data.tests : JSON.stringify(data.tests));
    if (data?.remarks) form.append('remarks', data.remarks);
    const uploads = Array.isArray(data?.uploads) ? data.uploads : (data?.upload ? [data.upload] : []);
    uploads.forEach((file) => { if (file) form.append('upload', file); });
    const response = await apiClient.post(`/labResult/${investigationRequestId}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateLabResult = async (id, payload) => {
  try {
    const response = await apiClient.patch(`/labResult/${id}`, payload);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default {
  getLabResults,
  getLabResultById,
  createLabResult,
  updateLabResult,
};
