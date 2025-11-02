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

// Get vitals by patientId
export const getPatientCurrentVitals = async (patientId) => {
  try {
    console.log('🩺 VitalsAPI: Fetching vitals for patientId:', patientId);
    // Use explicit patient history endpoint: /vital/getPatientVital/:patientId
    const response = await apiClient.get(`/vital/getPatientVital/${patientId}`);
    console.log('✅ VitalsAPI: Patient vitals fetched successfully');
    console.log('🩺 VitalsAPI: Response data:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ VitalsAPI: Get vitals by patient error occurred');
    console.error('📥 VitalsAPI: Error response:', error.response);
    console.error('📥 VitalsAPI: Error data:', error.response?.data);
    throw error;
  }
};

// Get vitals by patientId
export const getVitalsByPatient = async (patientId) => {
  try {
    console.log('🩺 VitalsAPI: Fetching vitals for patientId:', patientId);
    // Use explicit patient history endpoint: /vital/getPatientVital/:patientId
    const response = await apiClient.get(`/vital/getPatientVital/${patientId}`);
    console.log('✅ VitalsAPI: Patient vitals fetched successfully');
    console.log('🩺 VitalsAPI: Response data:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ VitalsAPI: Get vitals by patient error occurred');
    console.error('📥 VitalsAPI: Error response:', error.response);
    console.error('📥 VitalsAPI: Error data:', error.response?.data);
    throw error;
  }
};

// Create a new vital record
export const createVital = async (payload) => {
  try {
    console.log('📝 VitalsAPI: Creating vital with payload:', payload);
    const response = await apiClient.post('/vital', payload);
    console.log('✅ VitalsAPI: Vital created successfully');
    console.log('🩺 VitalsAPI: Create response data:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ VitalsAPI: Create vital error occurred');
    console.error('📥 VitalsAPI: Error response:', error.response);
    console.error('📥 VitalsAPI: Error data:', error.response?.data);
    throw error;
  }
};


export default {
  getVitalsByNurse,
  getVitalsByPatient,
  createVital,
};