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
export const updateComplaint = async (id, payload) => {
  try {
    const response = await apiClient.patch(`/medicalRecord/${id}`, payload);
    return response.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// Delete a medical complaint
export const deleteComplaint = async (id) => {
  try {
    const response = await apiClient.delete(`/medicalRecord/${id}`);
    return response.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// Upload medical records from CSV
export const uploadMedicalRecordCSV = async (csvContent) => {
  try {
    const response = await apiClient.post('/medicalRecord/upload-csv', {
      csv: csvContent
    });
    return response.data?.data || response.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

export default {
  getAllComplaint,
  createMedicalRecord,
  updateComplaint,
  deleteComplaint,
  uploadMedicalRecordCSV,
};