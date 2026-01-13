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

export const createBilling = async (patientId, payload) => {
  if (!patientId) throw new Error('Patient ID is required');
  if (!payload || typeof payload !== 'object') throw new Error('payload must be an object');
  const { itemDetail = [], totalAmount } = payload;
  if (!Array.isArray(itemDetail) || itemDetail.length === 0) throw new Error('itemDetail must include at least one item');
  const sanitized = itemDetail.map(({ code, description, quantity, price, total }) => ({
    code,
    description,
    quantity: Number(quantity) || 1,
    price: Number(price) || 0,
    total: Number(total) || ((Number(price) || 0) * (Number(quantity) || 1)),
  }));
  const body = { itemDetail: sanitized };
  if (totalAmount !== undefined) body.totalAmount = Number(totalAmount) || 0;
  const url = `${API_ENDPOINTS.CREATE_BILL}/${patientId}`;
  console.log('🧾 BillingAPI: Creating billing (detailed)', { patientId, body, url });
  const response = await apiClient.post(url, body);
  return response;
};

export const getAllReceipts = async (params = {}) => {
  const url = API_ENDPOINTS.GET_RECEIPTS; // '/receipts'
  console.log('🧾 ReceiptAPI: Fetching all receipts', { params, url });
  const response = await apiClient.get(url, { params });
  return response;
}

export const getAllReceiptByPatientId = async (patientId) => {
  if (!patientId) throw new Error('Patient ID is required');

  console.log(patientId);

  const url = `/receipt/patient/${patientId}`;
  console.log('🧾 ReceiptAPI: Fetching receipt by patient ID', { patientId, url });
  const response = await apiClient.get(url);
  return response;
};

export const createReceipt = async (billingId, receiptData) => {
  if (!billingId) throw new Error('Billing ID is required');
  if (!receiptData || typeof receiptData !== 'object') throw new Error('receiptData must be an object');

  const { amountPaid, paymentMethod, paidBy, hmoId, paymentDestination } = receiptData;
  if (amountPaid == null || isNaN(Number(amountPaid))) throw new Error('Valid amountPaid is required');
  if (!paymentMethod) throw new Error('Payment method is required');
  if (!paidBy) throw new Error('Payer information is required');
  if (!paymentDestination) throw new Error('Payment destination is required');

  const payload = {
    amountPaid: Number(amountPaid),
    paymentMethod,
    paidBy,
    hmoId: hmoId,
    paymentDestination,
  };
  const url = `/receipt/create/${billingId}`;
  console.log('🧾 ReceiptAPI: Creating receipt', { billingId, payload, url });
  const response = await apiClient.post(url, payload);
  return response;
};

export const updateReceipt = async(receiptId, status) => {
  if(!receiptId) throw new Error('Receipt ID is required');

  const url = `/receipt/${receiptId}`;
  const response = await apiClient.patch(url, status)
  return response;
}

export default {
  createBill,
  createBilling,
  getBillingById,
  getAllBillings,
  getAllReceipts,
  getAllReceiptByPatientId,
  createReceipt,
  updateReceipt,
};
