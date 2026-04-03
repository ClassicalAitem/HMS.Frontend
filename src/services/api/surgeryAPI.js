// Create a new surgery
export const createSurgery = async (investigationRequestId, data) => {
  try {
    const response = await apiClient.post(`/surgery/${investigationRequestId}`, data);
   
    return response.data;
  } catch (error) {
    throw error;
  }
};
import apiClient from './apiClient';

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

export default {
  getAllSurgeries,
  getSurgeryById,
  createSurgery
};