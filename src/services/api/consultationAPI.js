import apiClient from './apiClient';

export const getConsultations = async (params = {}) => {
  const response = await apiClient.get('/consultation', { params });
  return response.data;
};

export const getConsultationById = async (id) => {
  if (!id) throw new Error('Consultation ID is required');
  const response = await apiClient.get(`/consultation/${id}`);
  return response.data;
};

export const getConsultationByPatientId = async (patientId) => {
  if (!patientId) throw new Error('Patient ID is required');
  const response = await apiClient.get(`/consultation/patient/${patientId}`);
  return response.data;
};

export const createConsultation = async (payload) => {
  // if attachments are present we need multipart/form-data
  if (payload?.attachments && payload.attachments.length > 0) {
    const formData = new FormData();
    
    // Add all fields except attachments
    Object.keys(payload).forEach((key) => {
      if (key !== 'attachments') {
        if (typeof payload[key] === 'object') {
          formData.append(key, JSON.stringify(payload[key]));
        } else {
          formData.append(key, payload[key] || '');
        }
      }
    });

    // Add files
    payload.attachments.forEach((file) => {
      formData.append('attachments', file);
    });

    const response = await apiClient.post('/consultation', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  const response = await apiClient.post('/consultation', payload);
  return response.data;
};

export const updateConsultation = async (id, payload) => {
  if (!id) throw new Error('Consultation ID is required');
  
  // if attachments included with update convert to FormData
  if (payload?.attachments && payload.attachments.length > 0) {
    const formData = new FormData();
    
    // Add all fields except attachments
    Object.keys(payload).forEach((key) => {
      if (key !== 'attachments') {
        if (typeof payload[key] === 'object') {
          formData.append(key, JSON.stringify(payload[key]));
        } else {
          formData.append(key, payload[key] || '');
        }
      }
    });

    // Add files
    payload.attachments.forEach((file) => {
      formData.append('attachments', file);
    });

    const response = await apiClient.patch(`/consultation/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  const response = await apiClient.patch(`/consultation/${id}`, payload);
  return response.data;
};

export const getConsultationFile = async (fileId) => {
  if (!fileId) throw new Error('File ID is required');
  const response = await apiClient.get(`/consultation/file/${fileId}`, {
    responseType: 'arraybuffer'
  });
  return response;
};

export default {
  getConsultations,
  getConsultationById,
  getConsultationByPatientId,
  createConsultation,
  updateConsultation,
  getConsultationFile,
};