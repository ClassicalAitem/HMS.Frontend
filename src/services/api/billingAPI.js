import apiClient from './apiClient';
import { API_ENDPOINTS } from '../../config/env';

/**
 * Create a bill for a patient
 * POST /billing/create/{patientId}
 * payload: { items: [{ category, description, rate }], paymentMethod }
 */
export const createBill = async (patientId, billData) => {
  if (!patientId) throw new Error('Patient ID is required:');
  if (!billData || typeof billData !== 'object') throw new Error('billData must be an object');

  const { items = [], paymentMethod } = billData;
  if (!Array.isArray(items) || items.length === 0) throw new Error('At least one bill item is required');
  if (!paymentMethod) throw new Error('Payment method is required');

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.rate) || 0), 0);
  const payload = {
    items: items.map(({ category, description, rate }) => ({ category, description, rate: Number(rate) || 0 })),
    paymentMethod,
    totalAmount,
  };

  // Env maps CREATE_BILL to '/billing/create'
  const url = `${API_ENDPOINTS.CREATE_BILL}/${patientId}`;
  console.log('🧾 BillingAPI: Creating bill', { patientId, payload, url });
  const response = await apiClient.post(url, payload);
  return response;
};

/**
 * Get billing details by ID
 * GET /billing/{billingId}
 */
export const getBillingById = async (billingId) => {
  if (!billingId) throw new Error('Billing ID is required');
  const url = `/billing/${billingId}`; // consistent with docs
  console.log('🧾 BillingAPI: Fetching billing by ID', { billingId, url });
  const response = await apiClient.get(url);
  return response;
};

/**
 * Get all billings
 * GET /billing
 */
export const getAllBillings = async (params = {}) => {
  const url = API_ENDPOINTS.GET_BILLINGS; // '/billing'
  console.log('🧾 BillingAPI: Fetching all billings', { params, url });
  const response = await apiClient.get(url, { params });
  return response;
};

export default {
  createBill,
  getBillingById,
  getAllBillings,
};