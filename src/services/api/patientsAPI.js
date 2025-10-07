import apiClient from './apiClient';

// Get all patients
export const getPatients = async () => {
  try {
    console.log('📥 PatientsAPI: Fetching all patients');
    const response = await apiClient.get('/patient');
    console.log('✅ PatientsAPI: Patients fetched successfully');
    console.log('📊 PatientsAPI: Response data:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ PatientsAPI: Get patients error occurred');
    console.error('📥 PatientsAPI: Error response:', error.response);
    console.error('📥 PatientsAPI: Error data:', error.response?.data);
    throw error;
  }
};

// Get patient by ID
export const getPatientById = async (patientId) => {
  try {
    console.log('📥 PatientsAPI: Fetching patient by ID:', patientId);
    const response = await apiClient.get(`/patient/${patientId}`);
    console.log('✅ PatientsAPI: Patient fetched successfully');
    console.log('📊 PatientsAPI: Response data:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ PatientsAPI: Get patient by ID error occurred');
    console.error('📥 PatientsAPI: Error response:', error.response);
    console.error('📥 PatientsAPI: Error data:', error.response?.data);
    throw error;
  }
};

// Create new patient
export const createPatient = async (patientData) => {
  try {
    console.log('📤 PatientsAPI: Creating new patient');
    console.log('📊 PatientsAPI: Patient data:', patientData);
    const response = await apiClient.post('/patient', patientData);
    console.log('✅ PatientsAPI: Patient created successfully');
    console.log('📊 PatientsAPI: Response data:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ PatientsAPI: Create patient error occurred');
    console.error('📥 PatientsAPI: Error response:', error.response);
    console.error('📥 PatientsAPI: Error data:', error.response?.data);
    throw error;
  }
};

// Update patient
export const updatePatient = async (patientId, updateData) => {
  try {
    console.log('📤 PatientsAPI: Updating patient:', patientId);
    console.log('📊 PatientsAPI: Update data:', updateData);
    const response = await apiClient.patch(`/patient/${patientId}`, updateData);
    console.log('✅ PatientsAPI: Patient updated successfully');
    console.log('📊 PatientsAPI: Response data:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ PatientsAPI: Update patient error occurred');
    console.error('📥 PatientsAPI: Error response:', error.response);
    console.error('📥 PatientsAPI: Error data:', error.response?.data);
    throw error;
  }
};

// Delete patient (if endpoint exists)
export const deletePatient = async (patientId) => {
  try {
    console.log('🗑️ PatientsAPI: Deleting patient:', patientId);
    const response = await apiClient.delete(`/patient/${patientId}`);
    console.log('✅ PatientsAPI: Patient deleted successfully');
    console.log('📊 PatientsAPI: Response data:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ PatientsAPI: Delete patient error occurred');
    console.error('📥 PatientsAPI: Error response:', error.response);
    console.error('📥 PatientsAPI: Error data:', error.response?.data);
    throw error;
  }
};
