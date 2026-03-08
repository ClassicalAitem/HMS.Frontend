import apiClient from './apiClient';



export const addPatientStatus = async (patient, newStatus) => {
  const merged = Array.from(
    new Set([...(patient?.status || []), newStatus])
  );

  return updatePatientStatus(patient.id, merged);
};

// Get all patients
export const getPatients = async () => {
  try {
    const response = await apiClient.get('/patient');

    const patients = Array.isArray(response.data?.data)
      ? response.data.data.map((p) => ({
          ...p,
          status: Array.isArray(p.status) ? p.status : []
        }))
      : [];

    return {
      ...response.data,
      data: patients
    };
  } catch (error) {
    console.error('Get patients error', error);
    throw error;
  }
};

// Update patient status
export const updatePatientStatus = async (patientId, status) => {
  try {
    if (!patientId) throw new Error('Patient ID is required');
    if (!status) throw new Error('Status is required');
    console.log('📤 PatientsAPI: Updating patient status', { patientId, status });
    const response = await apiClient.patch(`/patient/patientStatus/${patientId}`, { status });
    console.log('✅ PatientsAPI: Patient status updated successfully');
    console.log('📊 PatientsAPI: Response data:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ PatientsAPI: Update patient status error occurred');
    console.error('📥 PatientsAPI: Error response:', error.response);
    console.error('📥 PatientsAPI: Error data:', error.response?.data);
    throw error;
  }
};

// Get patient by ID
export const getPatientById = async (patientId) => {
  try {
    const response = await apiClient.get(`/patient/${patientId}`);

    const patient = response.data?.data;

    if (patient) {
      patient.status = Array.isArray(patient.status) ? patient.status : [];
    }

    return response.data;
  } catch (error) {
    console.error('Get patient by ID error', error);
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
