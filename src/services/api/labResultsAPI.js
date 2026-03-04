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
  // if attachments are present we need multipart/form-data
  if (data?.form?.attachments && data.form.attachments.length > 0) {
    const formData = new FormData();
    formData.append('patientId', data.patientId || '');
    formData.append('form', JSON.stringify(data.form));
    formData.append('remarks', data.remarks || '');
    data.form.attachments.forEach((file) => {
      // backend should expect `attachments` field
      formData.append('attachments', file);
    });

    const response = await apiClient.post(`/labResult/${investigationRequestId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  const payload = {
    patientId: data?.patientId,
    form: data?.form,
    remarks: data?.remarks,
  };
  
  const response = await apiClient.post(`/labResult/${investigationRequestId}`, payload);
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

export default {
  getLabResults,
  getLabResultById,
  createLabResult,
  updateLabResult,
};
