import apiClient from './apiClient';

// Get all complaints
export const getAllComplaint = async () => {
  try {
    const response = await apiClient.get('/medicalRecord');
    console.log('complaintAPI: getAllComplaint response', response.data);
    // Return the actual array of complaints
    return response.data?.data || [];
  } catch (error) {
    console.error('complaintAPI: getAllComplaint error', error);
    throw error?.response?.data || error;
  }
};

// Create a new medical record
export const createMedicalRecord = async (payload) => {
  try {
    const response = await apiClient.post('/medicalRecord', payload);
    return response.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};


// Update a medical complaint
export const updateComplaint = async (complaintId, payload) => {
  try {
    const response = await apiClient.put(`/medicalRecord/${complaintId}`, payload);
    return response.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// Delete a medical complaint
export const deleteComplaint = async (complaintId) => {
  try {
    const response = await apiClient.delete(`/medicalRecord/${complaintId}`);
    return response.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};


export default {
  getAllComplaint,
  createMedicalRecord,
  updateComplaint,
  deleteComplaint,
};