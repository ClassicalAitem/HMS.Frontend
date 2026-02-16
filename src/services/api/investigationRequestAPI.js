import apiClient from './apiClient';

// Investigation Request API service
// Backend routes reference: see investigationRequest.controller.js

/**
 * Create a new investigation request for a consultation
 * POST /investigation/:consultationId
 * @param {string} consultationId
 * @param {object} payload
 */
export const createInvestigationRequest = async (consultationId, payload) => {
  if (!consultationId) throw new Error('Consultation ID is required');
  const url = `/investigation/${consultationId}`;
  const response = await apiClient.post(url, payload);
  return response.data;
};

/**
 * Get all investigation requests
 * GET /investigation
 * @param {object} params (optional)
 */
export const getAllInvestigationRequests = async (params = {}) => {
  const url = '/investigation';
  const response = await apiClient.get(url, { params });
  console.log(response)
  return response.data;
};

/**
 * Get investigation request by ID
 * GET /investigation/:id
 * @param {string} id
 */
export const getInvestigationRequestById = async (id) => {
  if (!id) throw new Error('Investigation Request ID is required');
  const url = `/investigation/${id}`;
  const response = await apiClient.get(url);
  return response.data;
};

/**
 * Get investigation requests by patient ID
 * GET /investigation/getInvestigationRequestByPatientId/:id
 * @param {string} patientId
 */
export const getInvestigationRequestByPatientId = async (patientId) => {
  if (!patientId) throw new Error('Patient ID is required');
  const url = `/investigation/getInvestigationRequestByPatientId/${patientId}`;
  const response = await apiClient.get(url);
  return response.data;
};

/**
 * Update an investigation request
 * PATCH /investigation/:id
 * @param {string} id
 * @param {object} payload
 */
export const updateInvestigationRequest = async (id, payload) => {
  if (!id) throw new Error('Investigation Request ID is required');
  const url = `/investigation/${id}`;
  console.log('Updating investigation request:', { id, url, payload });
  try {
    const response = await apiClient.patch(url, payload);
    console.log('Investigation request updated successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to update investigation request:', error.response?.data || error.message);
    throw error;
  }
};

export default {
  createInvestigationRequest,
  getAllInvestigationRequests,
  getInvestigationRequestById,
  getInvestigationRequestByPatientId,
  updateInvestigationRequest,
};
