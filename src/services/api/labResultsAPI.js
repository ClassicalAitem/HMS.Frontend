import apiClient from './apiClient';

export const getLabResults = async (params = {}) => {
  const response = await apiClient.get('/labResult', { params });
  return response.data;
};

export const getLabResultById = async (id) => {
  if (!id) throw new Error('Lab result ID is required');
  const response = await apiClient.get(`/labResult/${id}`);
  return response.data;
};

export const createLabResult = async (investigationRequestId, data) => {
  // For OpD patients without investigation, use /opd endpoint
  const endpoint = investigationRequestId ? `/labResult/${investigationRequestId}` : '/labResult/opd';
  
  // if attachments are present we need multipart/form-data
  if (data?.form?.attachments && data.form.attachments.length > 0) {
    const formData = new FormData();
    formData.append('patientId', data.patientId || '');
    if (data.opdPatientId) {
      formData.append('opdPatientId', data.opdPatientId);
    }
    if (data.dependantId) {
      formData.append('dependantId', data.dependantId);
    }
    formData.append('form', JSON.stringify(data.form));
    formData.append('remarks', data.remarks || '');
    data.form.attachments.forEach((file) => {
      // backend should expect `attachments` field
      formData.append('attachments', file);
    });

    const response = await apiClient.post(endpoint, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  const payload = {
    patientId: data?.patientId,
    dependantId: data?.dependantId,
    form: data?.form,
    remarks: data?.remarks,
  };

  if (data.opdPatientId) {
    payload.opdPatientId = data.opdPatientId;
  }
  
  const response = await apiClient.post(endpoint, payload);
  return response.data;
};

export const updateLabResult = async (id, payload) => {
  // if attachments included with update convert to FormData
  if (payload?.form?.attachments && payload.form.attachments.length > 0) {
    const formData = new FormData();
    if (payload.patientId) formData.append('patientId', payload.patientId);
    formData.append('form', JSON.stringify(payload.form));
    if (payload.remarks) formData.append('remarks', payload.remarks);
    payload.form.attachments.forEach((file) => {
      formData.append('attachments', file);
    });
    const response = await apiClient.patch(`/labResult/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  const response = await apiClient.patch(`/labResult/${id}`, payload);
  return response.data;
};

export const getLabResultFile = async (fileId) => {
  if (!fileId) throw new Error('File ID is required');
  const response = await apiClient.get(`/labResult/file/${fileId}`, {
    responseType: 'arraybuffer'
  });
  return response;
};

export default {
  getLabResults,
  getLabResultById,
  createLabResult,
  updateLabResult,
  getLabResultFile,
};
