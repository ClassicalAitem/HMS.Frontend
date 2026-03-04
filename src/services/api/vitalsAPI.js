import apiClient from './apiClient';

// Get all vitals (general endpoint)
export const getVitals = async () => {
  try {
    console.log('🩺 VitalsAPI: Fetching all vitals');
    const response = await apiClient.get('/vital');
    console.log('✅ VitalsAPI: All vitals fetched successfully');
    console.log('🩺 VitalsAPI: Response data:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ VitalsAPI: Get all vitals error occurred');
    console.error('📥 VitalsAPI: Error response:', error.response);
    console.error('📥 VitalsAPI: Error data:', error.response?.data);
    throw error;
  }
};

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

export const normalizeVitalsResponse = (response) => {
  try {
    const raw = response?.data ?? response ?? [];
    if (Array.isArray(raw)) return raw;
    if (raw?.data && Array.isArray(raw.data)) return raw.data;
    return [];
  } catch (e) {
    console.error('VitalsAPI: Error normalizing vitals response:', e);
    return [];
  }
};

export const getLatestVital = (vitals) => {
  if (!Array.isArray(vitals) || vitals.length === 0) return null;
  return vitals.reduce((acc, v) => {
    const accTime = new Date(acc?.createdAt || 0).getTime();
    const vTime = new Date(v?.createdAt || 0).getTime();
    return vTime > accTime ? v : acc;
  }, vitals[0]);
};

export const sortVitalsByTime = (vitals) => {
  if (!Array.isArray(vitals)) return [];
  return [...vitals].sort((a, b) => {
    const aTime = new Date(a?.createdAt || 0).getTime();
    const bTime = new Date(b?.createdAt || 0).getTime();
    return bTime - aTime;
  });
};

export default {
  getVitals,
  getVitalsByNurse,
  getVitalsByPatient,
  createVital,
  normalizeVitalsResponse,
  getLatestVital,
  sortVitalsByTime,
};