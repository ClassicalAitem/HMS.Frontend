import apiClient from './apiClient';

// Get all vitals (general endpoint)
export const getVitals = async () => {
  const response = await apiClient.get('/vital');
  return response.data;
};

// Get vitals activity for a nurse
export const getVitalsByNurse = async (nurseId) => {
  const response = await apiClient.get('/vital', { params: { nurseId } });
  return response.data;
};

// Get vitals by patientId
export const getPatientCurrentVitals = async (patientId) => {
  const response = await apiClient.get(`/vital/getPatientVital/${patientId}`);
  return response.data;
};

// Get vitals by patientId
export const getVitalsByPatient = async (patientId) => {
  const response = await apiClient.get(`/vital/getPatientVital/${patientId}`);
  return response.data;
};

// Create a new vital record
export const createVital = async (payload) => {
  const response = await apiClient.post('/vital', payload);
  return response.data;
};

export const normalizeVitalsResponse = (response) => {
  try {
    const raw = response?.data ?? response ?? [];
    if (Array.isArray(raw)) return raw;
    if (raw?.data && Array.isArray(raw.data)) return raw.data;
    return [];
  } catch {
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

// Update an existing vital record
export const updateVital = async (id, payload) => {
  const response = await apiClient.patch(`/vital/${id}`, payload);
  return response.data ?? response;
};

export default {
  getVitals,
  getVitalsByNurse,
  getVitalsByPatient,
  getPatientCurrentVitals,
  createVital,
  normalizeVitalsResponse,
  getLatestVital,
  sortVitalsByTime,
  updateVital,
};