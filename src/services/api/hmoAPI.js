import apiClient from './apiClient';
import { API_ENDPOINTS } from '@/config/env';

/**
 * Add HMO plans for a patient
 * POST /hmo/:patientId
 * Payload shape: { hmos: [{ provider, memberId, plan, expiresAt }] }
 */
export const addHmoForPatient = async (patientId, hmos, dependantId = null) => {
  if (!patientId) throw new Error('Patient ID is required');
  if (!Array.isArray(hmos) || hmos.length === 0) throw new Error('hmos must be a non-empty array');

  const requiredFields = ['memberId', 'provider'];
  for (const entry of hmos) {
    for (const field of requiredFields) {
      if (!entry?.[field]) throw new Error(`${field} is required`);
    }
  }

  const payload = { patientId, hmos, ...(dependantId ? { dependantId } : {}) };
  return apiClient.post('/hmo', payload);
};

/**
 * Update HMO details (provider, memberId, plan, expiresAt) — partial update.
 * PATCH /hmo/:hmoId
 * Only fields you pass in `updates` are sent, so this works for
 * full edits or single-field edits (e.g. just expiry) alike.
 */
export const updateHmo = async (hmoId, updates = {}) => {
  if (!hmoId) throw new Error('HMO ID is required');

  const payload = {};
  if (updates.provider !== undefined) payload.provider = updates.provider;
  if (updates.memberId !== undefined) payload.memberId = updates.memberId;
  if (updates.plan !== undefined) payload.plan = updates.plan;
  if (updates.expiresAt !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(updates.expiresAt)) {
      throw new Error('expiresAt must be YYYY-MM-DD');
    }
    payload.expiresAt = updates.expiresAt;
  }

  if (Object.keys(payload).length === 0) {
    throw new Error('At least one field must be provided to update');
  }

  return apiClient.patch(`/hmo/${hmoId}`, payload);
};

// Kept for backward compatibility with existing callers of updateHmoExpiry.
export const updateHmoExpiry = async (hmoId, expiresAt) => {
  return updateHmo(hmoId, { expiresAt });
};

export const getAllHmos = async (params = {}) => {
  const url = API_ENDPOINTS.GET_HMOS; // '/hmo'
  const response = await apiClient.get(url, { params });
  return response;
}

export default {
  addHmoForPatient,
  updateHmo,
  updateHmoExpiry,
  getAllHmos,
};