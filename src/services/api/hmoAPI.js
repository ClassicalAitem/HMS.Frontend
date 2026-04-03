import apiClient from './apiClient';
import { API_ENDPOINTS } from '@/config/env';

/**
 * Add HMO plans for a patient
 * POST /hmo/:patientId
 * Payload shape: { hmos: [{ provider, memberId, plan, expiresAt }] }
 */
export const addHmoForPatient = async (patientId, hmos) => {
  if (!patientId) throw new Error('Patient ID is required');
  if (!Array.isArray(hmos)) throw new Error('hmos must be an array');

  const payload = { hmos };
  return apiClient.post(`/hmo/${patientId}`, payload);
};

export const updateHmoExpiry = async (hmoId, expiresAt) => {
  if (!hmoId) throw new Error('HMO ID is required');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expiresAt)) throw new Error('expiresAt must be YYYY-MM-DD');
  return apiClient.patch(`/hmo/${hmoId}`, { expiresAt });
};

export const getAllHmos = async (params = {}) => {
  const url = API_ENDPOINTS.GET_HMOS; // '/hmo'
  console.log('🧾 HmoAPI: Fetching all hmo', { params, url });
  const response = await apiClient.get(url, { params });
  return response;
}

export default {
  addHmoForPatient,
  updateHmoExpiry,
  getAllHmos,
};