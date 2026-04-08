import apiClient from './apiClient';

// Create a new OPD patient (backend still uses /opdPatient endpoint)
export const createOpdPatient = async (data) => {
  try {
    const response = await apiClient.post('/opdPatient', data);
    return response.data ?? response;
  } catch (error) {
    console.error('opdPatientAPI: createOpdPatient error', error);
    throw error;
  }
};

// Get all OPD patients
export const getAllOpdPatients = async () => {
  try {
    const response = await apiClient.get('/opdPatient');
    return response.data ?? response;
  } catch (error) {
    console.error('opdPatientAPI: getAllOpdPatients error', error);
    throw error;
  }
};

// Get OPD patient by ID
export const getOpdPatientById = async (id) => {
  try {
    const response = await apiClient.get(`/opdPatient/${id}`);
    return response.data ?? response;
  } catch (error) {
    console.error('opdPatientAPI: getOpdPatientById error', error);
    throw error;
  }
};

// Update OPD patient
export const updateOpdPatient = async (id, data) => {
  try {
    const response = await apiClient.patch(`/opdPatient/${id}`, data);
    return response.data ?? response;
  } catch (error) {
    console.error('opdPatientAPI: updateOpdPatient error', error);
    throw error;
  }
};

// Delete OPD patient
export const deleteOpdPatient = async (id) => {
  try {
    const response = await apiClient.delete(`/opdPatient/${id}`);
    return response.data ?? response;
  } catch (error) {
    console.error('opdPatientAPI: deleteOpdPatient error', error);
    throw error;
  }
};
