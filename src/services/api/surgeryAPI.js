/* eslint-disable no-useless-catch */
// Create a new surgery
import apiClient from './apiClient';

export const createSurgery = async (investigationRequestId, data) => {
  try {
    const requiredFields = ['procedureName', 'scheduleDate'];
    for (const field of requiredFields) {
      if (!data?.[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    const response = await apiClient.post(`/surgery/${investigationRequestId}`, data);

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

export default {
  getAllSurgeries,
  getSurgeryById,
  createSurgery
};