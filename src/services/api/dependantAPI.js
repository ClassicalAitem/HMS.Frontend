import apiClient from './apiClient';

/**
 * Add a single dependant for a patient
 * POST /dependants/:patientId
 * Payload shape: dependant fields JSON (no array)
 */
export const addDependantForPatient = async (patientId, dependant) => {
  if (!patientId) throw new Error('Patient ID is required');
  if (!dependant || typeof dependant !== 'object') throw new Error('dependant must be an object');

  console.log('Adding dependant for patient ID:', patientId, 'with data:', dependant);

  // Only send supported keys
  const allowedKeys = ['firstName', 'middleName', 'lastName', 'dob', 'gender', 'relationshipType'];
  const payload = {};
  allowedKeys.forEach((k) => {
    if (dependant[k] !== undefined && dependant[k] !== null && dependant[k] !== '') payload[k] = dependant[k];
  });

  return apiClient.post(`/dependant/${patientId}`, payload);
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

  return apiClient.patch(`/dependant/${dependantId}`, payload);
};

export const getAllDependantsForPatient = async (patientId) => {
  if (!patientId) throw new Error('Patient ID is required');
  return apiClient.get(`/dependant?patientId=${patientId}`);
};

export default {
  addDependantForPatient,
  updateDependant,
  getAllDependantsForPatient
};