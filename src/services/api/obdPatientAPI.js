import apiClient from './apiClient';

// Create a new OBD patient
export const createObdPatient = async (data) => {
  try {
    const response = await apiClient.post('/obdPatient', data);
    return response.data ?? response;
  } catch (error) {
    console.error('obdPatientAPI: createObdPatient error', error);
    throw error;
  }
};

// Get all OBD patients
export const getAllObdPatients = async () => {
  try {
    const response = await apiClient.get('/obdPatient');
    return response.data ?? response;
  } catch (error) {
    console.error('obdPatientAPI: getAllObdPatients error', error);
    throw error;
  }
};

// Get OBD patient by ID
export const getObdPatientById = async (id) => {
  try {
    const response = await apiClient.get(`/obdPatient/${id}`);
    return response.data ?? response;
  } catch (error) {
    console.error('obdPatientAPI: getObdPatientById error', error);
    throw error;
  }
};

// Update OBD patient
export const updateObdPatient = async (id, data) => {
  try {
    const response = await apiClient.patch(`/obdPatient/${id}`, data);
    return response.data ?? response;
  } catch (error) {
    console.error('obdPatientAPI: updateObdPatient error', error);
    throw error;
  }
};

// Delete OBD patient
export const deleteObdPatient = async (id) => {
  try {
    const response = await apiClient.delete(`/obdPatient/${id}`);
    return response.data ?? response;
  } catch (error) {
    console.error('obdPatientAPI: deleteObdPatient error', error);
    throw error;
  }
};
