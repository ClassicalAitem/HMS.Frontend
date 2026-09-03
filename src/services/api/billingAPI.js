import apiClient from './apiClient';
import { API_ENDPOINTS } from '../../config/env';

/**
 * Create a bill for a patient
 * POST /billing/create/{patientId}
 * payload: { items: [{ category, description, rate }], paymentMethod }
 */
export const createBill = async (patientId, billData) => {
  if (!patientId) throw new Error('Patient ID is required:');

  // Allow passing raw payload directly if it matches expected structure { itemDetail: [...] }
  if (billData.itemDetail && Array.isArray(billData.itemDetail)) {
    const url = `${API_ENDPOINTS.CREATE_BILL}/${patientId}`;
    const response = await apiClient.post(url, billData);
    return response;
  }

  // Legacy support for older calls (if any)
  const { items = [] } = billData;
  if (!Array.isArray(items) || items.length === 0) throw new Error('At least one bill item is required');

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.rate) || 0), 0);

  const payload = {
    itemDetail: items.map(({ category, description, rate }) => ({
      code: category || 'misc',
      description,
      quantity: 1,
      price: Number(rate) || 0,
      total: Number(rate) || 0,
    })),
    totalAmount,
  };

  const url = `${API_ENDPOINTS.CREATE_BILL}/${patientId}`;
  const response = await apiClient.post(url, payload);
  return response;
};

export const createBillForOpd = async (opdPatientId, billData) => {
  if (!opdPatientId) throw new Error('OpD Patient ID is required');
  if (!billData || typeof billData !== 'object') throw new Error('billData must be an object');

  const { itemDetail = [], totalAmount } = billData;
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

  const url = `${API_ENDPOINTS.CREATE_BILL_OPD}/${opdPatientId}`;
  const response = await apiClient.post(url, body);
  return response;
};

/**
 * Get billing details by ID
 * GET /billing/{billingId}
 */
export const getBillingById = async (billingId) => {
  if (!billingId) throw new Error('Billing ID is required');
  const url = `/billing/${billingId}`;
  const response = await apiClient.get(url);
  return response;
};

/**
 * Get all billings
 * GET /billing
 */
export const getAllBillings = async (params = {}) => {
  const url = API_ENDPOINTS.GET_BILLINGS;
  const response = await apiClient.get(url, { params });
  return response;
};

/**
 * Get billing details by patient ID
 * GET /billing/patient/{patientId} or /billing?patientId={patientId} or fetch all and filter
 */
export const getBillingbypatientId = async (patientId) => {
  if (!patientId) throw new Error('Patient ID is required');

  // Try endpoint 1: /billing/patient/{patientId}
  try {
    const url = `/billing/patient/${patientId}`;
    const response = await apiClient.get(url, { skipErrorToast: true });
    if (response?.data) {
      return response;
    }
  } catch {
    // try next endpoint
  }

  // Try endpoint 2: /billing?patientId={patientId}
  try {
    const url = `/billing?patientId=${patientId}`;
    const response = await apiClient.get(url, { skipErrorToast: true });
    if (response?.data) {
      const data = Array.isArray(response.data) ? response.data[0] : response.data;
      return { data };
    }
  } catch {
    // try fallback
  }

  // Fallback: Fetch all billings and filter
  try {
    const allBillings = await getAllBillings({ skipErrorToast: true });

    let billingsList = [];

    if (Array.isArray(allBillings?.data)) {
      billingsList = allBillings.data;
    } else if (Array.isArray(allBillings?.data?.data)) {
      billingsList = allBillings.data.data;
    } else if (allBillings?.data && typeof allBillings.data === 'object') {
      billingsList = [allBillings.data];
    } else if (Array.isArray(allBillings)) {
      billingsList = allBillings;
    }

    const patientBillings = billingsList.filter((b) => {
      const bPatientId = b?.patientId || b?.patient?.id || b?.patient?._id;
      return String(bPatientId) === String(patientId);
    });

    if (patientBillings.length > 0) {
      const sorted = patientBillings.sort((a, b) => {
        const dateA = new Date(a?.createdAt || a?.created_at || 0).getTime();
        const dateB = new Date(b?.createdAt || b?.created_at || 0).getTime();
        return dateB - dateA;
      });

      return { data: sorted[0] };
    } else {
      return { data: null };
    }
  } catch (fallbackError) {
    throw new Error(`Failed to fetch billing for patient ${patientId}: ${fallbackError?.message}`);
  }
};

export const getBillingsByOpdPatientId = async (opdPatientId) => {
  if (!opdPatientId) throw new Error('OpD Patient ID is required');
  const url = `/billing/opd-patient/${opdPatientId}`;
  const response = await apiClient.get(url);
  return response;
};

export const createBilling = async (patientId, billData) => {
  if (!patientId) throw new Error('Patient ID is required:');

  if (billData.itemDetail && Array.isArray(billData.itemDetail)) {
    const url = `${API_ENDPOINTS.CREATE_BILL}/${patientId}`;
    const response = await apiClient.post(url, billData);
    return response;
  }

  const { items = [] } = billData;
  if (!Array.isArray(items) || items.length === 0) throw new Error('At least one bill item is required');

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.rate) || 0), 0);

  const payload = {
    itemDetail: items.map(({ category, description, rate }) => ({
      code: category || 'misc',
      description,
      quantity: 1,
      price: Number(rate) || 0,
      total: Number(rate) || 0,
    })),
    totalAmount,
  };

  const url = `${API_ENDPOINTS.CREATE_BILL}/${patientId}`;
  const response = await apiClient.post(url, payload);
  return response;
};

export const getAllReceipts = async (params = {}) => {
  const url = API_ENDPOINTS.GET_RECEIPTS;
  const response = await apiClient.get(url, { params });
  return response;
};

export const getAllReceiptByPatientId = async (patientId) => {
  if (!patientId) throw new Error('Patient ID is required');

  const url = `/receipt/patient/${patientId}`;
  try {
    const response = await apiClient.get(url, { skipErrorToast: true });
    return response;
  } catch (error) {
    if (error.response?.status === 404) {
      return { data: [] };
    }
    throw error;
  }
};

export const getReceiptsByOpdPatientId = async (opdPatientId) => {
  if (!opdPatientId) throw new Error('OPD Patient ID is required');

  const url = `/receipt/opd-patient/${opdPatientId}`;
  try {
    const response = await apiClient.get(url, { skipErrorToast: true });
    return response;
  } catch (error) {
    if (error.response?.status === 404) {
      return { data: [] };
    }
    throw error;
  }
};

export const createReceipt = async (billingId, receiptData) => {
  if (!billingId) throw new Error('Billing ID is required');
  if (!receiptData || typeof receiptData !== 'object') throw new Error('receiptData must be an object');

  const { amountPaid, paymentMethod, paidBy, hmoId, paymentDestination, bankName, senderName, cashierName, sessionId, dependantId } = receiptData;
  if (amountPaid == null || isNaN(Number(amountPaid))) throw new Error('Valid amountPaid is required');
  if (!paymentMethod) throw new Error('Payment method is required');
  if (!paidBy) throw new Error('Payer information is required');
  if (!paymentDestination) throw new Error('Payment destination is required');

  const payload = {
    amountPaid: Number(amountPaid),
    paymentMethod,
    paidBy,
    paymentDestination,
  };

  if (hmoId) payload.hmoId = hmoId;
  if (dependantId != null && dependantId !== '') payload.dependantId = dependantId;
  if (bankName && bankName.trim()) payload.bankName = bankName.trim();
  if (senderName && senderName.trim()) payload.senderName = senderName.trim();
  if (cashierName && cashierName.trim()) payload.cashierName = cashierName.trim();
  if (sessionId && sessionId.trim()) payload.sessionId = sessionId.trim();

  const url = `/receipt/create/${billingId}`;
  const response = await apiClient.post(url, payload);
  return response;
};

export const updateReceipt = async (receiptId, status) => {
  if (!receiptId) throw new Error('Receipt ID is required');

  const url = `/receipt/${receiptId}`;
  const response = await apiClient.patch(url, status);
  return response;
};

export const deleteBilling = async (billingId) => {
  const response = await apiClient.delete(`${API_ENDPOINTS.DELETE_BILLING}/${billingId}`);
  return response;
};

export const updateBilling = async (billingId, data) => {
  const response = await apiClient.patch(`/billing/${billingId}`, data);
  return response.data;
};

export default {
  createBill,
  createBilling,
  getBillingById,
  getBillingbypatientId,
  getBillingsByOpdPatientId,
  getAllBillings,
  getAllReceipts,
  getAllReceiptByPatientId,
  getReceiptsByOpdPatientId,
  createReceipt,
  updateReceipt,
  deleteBilling,
  updateBilling,
};
