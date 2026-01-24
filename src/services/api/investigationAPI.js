import apiClient from './apiClient';

export const createInvestigation = async (consultationId, data) => {
  try{
    const response = await apiClient.post(`/investigation/${consultationId}`, data);
    return response.data ?? response;
  } catch (error) {
    console.error('investigationAPI: createInvestigation error', error);
    throw error;
  }
};

export const getInvestigations = async () => {
  try {
    const response = await apiClient.get('/investigation');
    return response.data ?? response;
  } catch (error) {
    console.error('investigationAPI: getInvestigations error', error);
    throw error;
  }
};

export const getInvestigationById = async (id) => {
  try {
    const response = await apiClient.get(`/investigation/${id}`);
    return response.data ?? response;
  } catch (error) {
    console.error('investigationAPI: getInvestigationById error', error);
    throw error;
  }
};

export const getInvestigationByPatientId = async (patientId) => {
  try {
    const response = await apiClient.get(`/investigation/getInvestigationRequestByPatientId/${patientId}`);
    return response.data ?? response;
  } catch (error) {
    console.error('investigationAPI: getInvestigationByPatientId error', error);
    throw error;
  }
};

export const getInvestigationByConsultationId = async (consultationId) => {
  try {
    const response = await apiClient.get(`/investigation?consultationId=${consultationId}`);
    return response.data ?? response;
  } catch (error) {
    console.error('investigationAPI: getInvestigationByConsultationId error', error);
    throw error;
  }
};

export const updateInvestigation = async (id, data) => {
  try {
    const response = await apiClient.patch(`/investigation/${id}`, data);
    return response.data ?? response;
  } catch (error) {
    console.error('investigationAPI: updateInvestigation error', error);
    throw error;
  }
};

export default {
  createInvestigation,
  getInvestigations,
  getInvestigationById,
  getInvestigationByPatientId,
  updateInvestigation,
};