/* eslint-disable no-useless-catch */
// Create a new surgery
import apiClient from './apiClient';

export const createSurgery = async (arg1, arg2) => {
  try {
    let payload = arg1;
    // Support both createSurgery(payload) and legacy createSurgery(investigationRequestId, data)
    if (arg2 !== undefined && typeof arg1 === 'string') {
      payload = { ...arg2, investigationRequestId: arg1 };
    }
    const response = await apiClient.post('/surgery', payload);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSurgeryByPatientId = async (patientId) => {
  try {
    const response = await apiClient.get(`/surgery/patient/${patientId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get all surgeries
export const getAllSurgeries = async (params = {}) => {
  try {
    const response = await apiClient.get('/surgery', { params });
    return response.data;
  } catch (error) {
  throw error;
  }
};

// Get surgery by ID
export const getSurgeryById = async (surgeryId) => {
  try {

    const response = await apiClient.get(`/surgery/${surgeryId}`);
    return response.data;
  } catch (error) {
   throw error;
  }
};

export const deleteSurgery = async (surgeryId) => {
  try {

    const response = await apiClient.delete(`/surgery/${surgeryId}`);
    return response.data;
  } catch (error) {
   throw error;
  }
};

export const getSurgeryByInvestigationRequestId = async (investigationRequestId) =>
{
  try{
    const response  = await apiClient.get(`/surgery/investigation/${investigationRequestId}`);
    return response.data;
  } catch (error){
    throw error ;
  }
}

export const updateSurgery = async (id, data) => {
  try{
    const response = await apiClient.patch(`/surgery/${id}`, data);
    return response.data;
  } catch (error){
    throw error;
  }
} 


// export const deleteSurgery = (id) => api.delete(`/surgery/${id}`);

export default {
  getAllSurgeries,
  getSurgeryById,
  createSurgery,
  deleteSurgery,
  getSurgeryByInvestigationRequestId,
  getSurgeryByPatientId,
  updateSurgery
};