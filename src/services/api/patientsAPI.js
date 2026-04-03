import apiClient from './apiClient';

/**
 * Normalize patient status to a single string (backend now uses single status string).
 * If an array is provided, we take the latest (last) item.
 */
const normalizePatientStatus = (status) => {
  if (Array.isArray(status)) {
    const list = status.filter((s) => typeof s === 'string' && s.trim());
    return list.length ? list[list.length - 1] : '';
  }
  return typeof status === 'string' ? status : '';
};

export const addPatientStatus = async (patient, newStatus) => {
  // Backwards compatible helper; treats status as a single-valued field now.
  const normalizedStatus = normalizePatientStatus(newStatus);
  return updatePatientStatus(patient.id, normalizedStatus);
};

// Get all patients
export const getPatients = async () => {
  try {
    const response = await apiClient.get('/patient');

    const patients = Array.isArray(response.data?.data)
      ? response.data.data.map((p) => ({
          ...p,
          status: normalizePatientStatus(p.status)
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

export const updatePatientStatus = async (patientId, statusOrOptions) => {
  try {
    if (!patientId) throw new Error('Patient ID is required');

    // ✅ Handle string, array, or object
    let payload;
    if (typeof statusOrOptions === 'string') {
      payload = { status: statusOrOptions };
    } else if (Array.isArray(statusOrOptions)) {
      payload = { status: statusOrOptions };
    } else {
      payload = statusOrOptions; // already { status: "..." } or { addStatus, removeStatus }
    }

    const response = await apiClient.patch(
      `/patient/patientStatus/${patientId}`,
      payload
    );
    return response.data;
  } catch (error) {
    console.error('❌ PatientsAPI: Update patient status error', error);
    throw error;
  }
};

// Get patient by ID
export const getPatientById = async (patientId) => {
  try {
    const response = await apiClient.get(`/patient/${patientId}`);

    const patient = response.data?.data;

    if (patient) {
      patient.status = normalizePatientStatus(patient.status);
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
