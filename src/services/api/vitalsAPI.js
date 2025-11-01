import apiClient from './apiClient';

// Get vitals activity for a nurse
export const getVitalsByNurse = async (nurseId) => {
  try {
    console.log('🩺 VitalsAPI: Fetching vitals for nurseId:', nurseId);
    const response = await apiClient.get('/vital', { params: { nurseId } });
    console.log('✅ VitalsAPI: Vitals fetched successfully');
    console.log('🩺 VitalsAPI: Response data:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ VitalsAPI: Get vitals error occurred');
    console.error('📥 VitalsAPI: Error response:', error.response);
    console.error('📥 VitalsAPI: Error data:', error.response?.data);
    throw error;
  }
};

export default {
  getVitalsByNurse,
};