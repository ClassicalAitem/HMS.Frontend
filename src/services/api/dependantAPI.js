import apiClient from './apiClient';

/**
 * Add a single dependant for a patient
 * POST /dependants/:patientId
 * Payload shape: dependant fields JSON (no array)
 */
export const addDependantForPatient = async (patientId, dependant) => {
  if (!patientId) throw new Error('Patient ID is required');
  const required = ['firstName', 'lastName', 'dob', 'gender', 'relationshipType'];

  for (const key of required) {
    if (!dependant?.[key]) throw new Error(`${key} is required`);
  }
  if (!dependant || typeof dependant !== 'object') throw new Error('dependant must be an object');

  // Only send supported keys
  const allowedKeys = ['firstName', 'middleName', 'lastName', 'dob', 'gender', 'relationshipType'];
  const payload = {};
  allowedKeys.forEach((k) => {
    if (dependant[k] !== undefined && dependant[k] !== null && dependant[k] !== '') payload[k] = dependant[k];
  });

  return apiClient.post(`/dependant/${patientId}`, payload, { skipErrorToast: true });
};

/**
 * Update a dependant (partial update)
 * PATCH /dependants/:dependantId
 * Only send changed fields among: firstName, middleName, lastName, dob, gender, relationshipType
 */
export const updateDependant = async (dependantId, updates) => {
  if (!dependantId) throw new Error('Dependant ID is required');
  if (!updates || typeof updates !== 'object') throw new Error('updates must be an object');

  const allowedKeys = ['firstName', 'middleName', 'lastName', 'dob', 'gender', 'relationshipType'];
  const payload = {};
  allowedKeys.forEach((k) => {
    if (updates[k] !== undefined) payload[k] = updates[k];
  });

  if (Object.keys(payload).length === 0) {
    throw new Error('No valid fields provided to update');
  }

  return apiClient.patch(`/dependant/${dependantId}`, payload, { skipErrorToast: true });
};

export const getAllDependantsForPatient = async (patientId) => {
  if (!patientId) throw new Error('Patient ID is required');
  return apiClient.get(`/dependant?patientId=${patientId}`);
};

export const getDependantById = async (dependantId) => {
  if (!dependantId) throw new Error('Dependant ID is required');
  return apiClient.get(`/dependant/${dependantId}`);
};


export const updateDependantStatus = async (dependantId, statusData) => {
  if (!dependantId) throw new Error('Dependant ID is required');
  return apiClient.patch(`/dependant/dependantStatus/${dependantId}`, statusData);
};

export const getDependants = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const url = queryString ? `/dependant?${queryString}` : '/dependant';
  return apiClient.get(url);
};

export default {
  addDependantForPatient,
  updateDependant,
  getAllDependantsForPatient,
  updateDependantStatus,
  getDependants,
  getDependantById,
};