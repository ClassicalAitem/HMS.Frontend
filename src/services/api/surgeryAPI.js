import apiClient from './apiClient';

// Get all surgeries
export const getAllSurgeries = async (params = {}) => {
  try {
    console.log('🏥 SurgeryAPI: Fetching all surgeries', { params });
    const response = await apiClient.get('/surgery', { params });
    console.log('✅ SurgeryAPI: Surgeries fetched successfully');
    console.log('🏥 SurgeryAPI: Response data:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ SurgeryAPI: Get surgeries error occurred');
    console.error('📥 SurgeryAPI: Error response:', error.response);
    console.error('📥 SurgeryAPI: Error data:', error.response?.data);
    throw error;
  }
};

// Get surgery by ID
export const getSurgeryById = async (surgeryId) => {
  try {
    console.log('🏥 SurgeryAPI: Fetching surgery by ID:', surgeryId);
    const response = await apiClient.get(`/surgery/${surgeryId}`);
    console.log('✅ SurgeryAPI: Surgery fetched successfully');
    console.log('🏥 SurgeryAPI: Response data:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ SurgeryAPI: Get surgery by ID error occurred');
    console.error('📥 SurgeryAPI: Error response:', error.response);
    console.error('📥 SurgeryAPI: Error data:', error.response?.data);
    throw error;
  }
};

export default {
  getAllSurgeries,
  getSurgeryById
};