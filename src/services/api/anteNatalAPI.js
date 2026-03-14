import apiClient from './apiClient';

// Create a new antenatal record
export const createAnteNatalRecord = async (data) => {
  const response = await apiClient.post('/anteNatalRecord', data);
  return response.data;
};

// Get all antenatal records for a patient
export const getAnteNatalRecordByPatientId = async (patientId) => {
  const response = await apiClient.get('/anteNatalRecord', {
    params: { patientId },
  });
  const records = response.data?.data || response.data || [];
  return Array.isArray(records) ? records : [];
};

// Get a specific record by patientId + index
export const getAnteNatalRecord = async (patientId, index) => {
  const response = await apiClient.get(`/anteNatalRecord/${patientId}/${index}`, {
    timeout: 30000,
  });
  return response.data?.data || response.data;
};

// Update a specific record by patientId + index
export const updateAnteNatalRecord = async (patientId, index, data) => {
  const response = await apiClient.patch(
    `/anteNatalRecord/${patientId}/${index}`,
    data,
    { timeout: 30000 }
  );
  return response.data?.data || response.data;
};