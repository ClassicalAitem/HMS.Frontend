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
  if (!patient?.id) throw new Error('Patient ID is required');
  if (!newStatus || typeof newStatus !== 'string') throw new Error('New status must be a non-empty string');
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
    throw error;
  }
};

// Create new patient
export const createPatient = async (patientData) => {
  try {
    const data = patientData?.hmo?.[0] || [];
    const requiredFields = ['firstName', 'lastName', 'phone', 'dob', 'gender'];
    for (const field of requiredFields) {
      if (!patientData?.[field] && !data?.[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    const response = await apiClient.post('/patient', patientData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update patient
export const updatePatient = async (patientId, updateData) => {
  try {
    const response = await apiClient.patch(`/patient/${patientId}`, updateData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete patient (if endpoint exists)
export const deletePatient = async (patientId) => {
  try {
    const response = await apiClient.delete(`/patient/${patientId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};


// Get unique family names
export const getUniqueFamilyNames = async () => {
  try {
    const response = await getPatients();
    const patients = Array.isArray(response?.data) ? response.data : [];

    const familyNames = patients
      .filter(p => p.cardType === 'family' && p.familyName)
      .map(p => p.familyName)
      .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates
      .sort();

    return familyNames;
  } catch (error) {
    return [];
  }
};

// Get unique company names
export const getUniqueCompanyNames = async () => {
  try {
    const response = await getPatients();
    const patients = Array.isArray(response?.data) ? response.data : [];

    const companyNames = patients
      .filter(p => p.cardType === 'company' && p.companyName)
      .map(p => p.companyName)
      .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates
      .sort();

    return companyNames;
  } catch (error) {
    return [];
  }
};
