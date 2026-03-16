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
  // This supports the new CreateBillModal usage
  if (billData.itemDetail && Array.isArray(billData.itemDetail)) {
      const url = `${API_ENDPOINTS.CREATE_BILL}/${patientId}`;
      console.log('🧾 BillingAPI: Creating bill (raw payload)', { patientId, payload: billData, url });
      const response = await apiClient.post(url, billData);
      return response;
  }

  // Legacy support for older calls (if any)
  const { items = [], paymentMethod } = billData;
  if (!Array.isArray(items) || items.length === 0) throw new Error('At least one bill item is required');
  // Payment method removed as requirement for BILL creation (it's for receipt)
  
  const totalAmount = items.reduce((sum, item) => sum + (Number(item.rate) || 0), 0);
  
  // Map old structure to new structure expected by backend
  const payload = {
    itemDetail: items.map(({ category, description, rate }) => ({ 
        code: category || 'misc', 
        description, 
        quantity: 1,
        price: Number(rate) || 0,
        total: Number(rate) || 0
    })),
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

/**
 * Get billing details by patient ID
 * GET /billing/patient/{patientId} or /billing?patientId={patientId} or fetch all and filter
 */
export const getBillingbypatientId = async (patientId) => {
  if (!patientId) throw new Error('Patient ID is required');
  
  console.log('🧾 BillingAPI: Starting getBillingbypatientId', { patientId });
  
  // Try endpoint 1: /billing/patient/{patientId}
  try {
    const url = `/billing/patient/${patientId}`;
    console.log('🧾 BillingAPI: Trying endpoint 1', { url });
    const response = await apiClient.get(url);
    console.log('🧾 BillingAPI: Endpoint 1 success', response);
    if (response?.data) {
      return response;
    }
  } catch (error) {
    console.log('🧾 BillingAPI: Endpoint 1 failed', { status: error?.response?.status, message: error?.message });
  }

  // Try endpoint 2: /billing?patientId={patientId}
  try {
    const url = `/billing?patientId=${patientId}`;
    console.log('🧾 BillingAPI: Trying endpoint 2', { url });
    const response = await apiClient.get(url);
    console.log('🧾 BillingAPI: Endpoint 2 success', response);
    if (response?.data) {
      const data = Array.isArray(response.data) ? response.data[0] : response.data;
      return { data };
    }
  } catch (error) {
    console.log('🧾 BillingAPI: Endpoint 2 failed', { status: error?.response?.status, message: error?.message });
  }

  // Fallback: Fetch all billings and filter
  try {
    console.log('🧾 BillingAPI: Attempting fallback - fetching all billings');
    const allBillings = await getAllBillings();
    console.log('🧾 BillingAPI: All billings response', allBillings);
    
    let billingsList = [];
    
    // Handle various response formats
    if (Array.isArray(allBillings?.data)) {
      billingsList = allBillings.data;
    } else if (Array.isArray(allBillings?.data?.data)) {
      billingsList = allBillings.data.data;
    } else if (allBillings?.data && typeof allBillings.data === 'object') {
      billingsList = [allBillings.data];
    } else if (Array.isArray(allBillings)) {
      billingsList = allBillings;
    }
    
    console.log('🧾 BillingAPI: Processed billings list', { count: billingsList.length, billingsList });
    
    // Filter by patient ID
    const patientBillings = billingsList.filter(b => {
      const bPatientId = b?.patientId || b?.patient?.id || b?.patient?._id;
      const matches = String(bPatientId) === String(patientId);
      console.log('🧾 BillingAPI: Checking billing', { billingId: b?.id, bPatientId, patientId, matches });
      return matches;
    });
    
    console.log('🧾 BillingAPI: Filtered billings for patient', { 
      patientId, 
      count: patientBillings.length,
      billings: patientBillings 
    });
    
    if (patientBillings.length > 0) {
      // Sort by creation date (most recent first) and return the latest
      const sorted = patientBillings.sort((a, b) => {
        const dateA = new Date(a?.createdAt || a?.created_at || 0).getTime();
        const dateB = new Date(b?.createdAt || b?.created_at || 0).getTime();
        return dateB - dateA;
      });
      
      console.log('🧾 BillingAPI: Returning most recent billing', sorted[0]);
      return { data: sorted[0] };
    } else {
      console.warn('🧾 BillingAPI: No billings found for patient', { patientId });
      return { data: null };
    }
  } catch (fallbackError) {
    console.error('🧾 BillingAPI: All methods failed', fallbackError);
    throw new Error(`Failed to fetch billing for patient ${patientId}: ${fallbackError?.message}`);
  }
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
 export const deleteBilling = async (billingId) => {
    console.log('🗑️ BillingAPI: Starting deleteBilling request');
    console.log('📤 BillingAPI: Billing ID:', billingId);

    try {
      const response = await apiClient.delete(`${API_ENDPOINTS.DELETE_BILLING}/${billingId}`);
      console.log('✅ BillingAPI: Delete billing response received');
      console.log('📥 BillingAPI: Response data:', response.data);
      return response;
    } catch (error) {
      console.error('❌ BillingAPI: Delete billing error occurred');
      console.error('📥 BillingAPI: Error response:', error.response);
      throw error;
    }
  };

  export const updateBilling = async (billingId, data) => {
  try {
    const response = await apiClient.patch(`/billing/${billingId}`, data);
    return response.data;
  } catch (error) {
    console.error('Update billing error', error);
    throw error;
  }
};

export default {
  createBill,
  createBilling,
  getBillingById,
  getBillingbypatientId,
  getAllBillings,
  getAllReceipts,
  getAllReceiptByPatientId,
  createReceipt,
  updateReceipt,
  deleteBilling,
  updateBilling,
};
