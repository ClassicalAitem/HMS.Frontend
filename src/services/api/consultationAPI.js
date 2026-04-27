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
  const cleanedPayload = {};
  const optionalFields = [
    'visitReason',
    'allergicHistory',
    'familyHistory',
    'medicalHistory',
    'socialHistory',
    'surgicalHistory',
    'complaint',
    'complaintHistory',
    'notes',
    'additionalNotes',
    'attachments',
  ];

  Object.keys(payload).forEach((key) => {
    const value = payload[key];
    
    if (optionalFields.includes(key)) {
      if (value === '' || value === null || (Array.isArray(value) && value.length === 0)) {
        return; 
      }
    }
    
    cleanedPayload[key] = value;
  });

  // if attachments are present we need multipart/form-data
  if (cleanedPayload?.attachments && cleanedPayload.attachments.length > 0) {
    const formData = new FormData();
    
    // Add all fields except attachments
    Object.keys(cleanedPayload).forEach((key) => {
      if (key !== 'attachments') {
        if (typeof cleanedPayload[key] === 'object') {
          formData.append(key, JSON.stringify(cleanedPayload[key]));
        } else {
          formData.append(key, cleanedPayload[key]);
        }
      }
    });

    // Add files
    cleanedPayload.attachments.forEach((file) => {
      formData.append('attachments', file);
    });

    const response = await apiClient.post('/consultation', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  const response = await apiClient.post('/consultation', cleanedPayload);
  return response.data;
};

export const updateConsultation = async (id, payload) => {
  if (!id) throw new Error('Consultation ID is required');
  
 const cleanedPayload = {};
  const optionalFields = [
    'visitReason',
    'allergicHistory',
    'familyHistory',
    'medicalHistory',
    'socialHistory',
    'surgicalHistory',
    'complaint',
    'complaintHistory',
    'notes',
    'additionalNotes',
    'attachments',
  ];

  Object.keys(payload).forEach((key) => {
    const value = payload[key];
     if (optionalFields.includes(key)) {
      if (value === '' || value === null || (Array.isArray(value) && value.length === 0)) {
        return;
      }
    }
    
    cleanedPayload[key] = value;
  });
  
  // if attachments included with update convert to FormData
  if (cleanedPayload?.attachments && cleanedPayload.attachments.length > 0) {
    const formData = new FormData();
    
    // Add all fields except attachments
    Object.keys(cleanedPayload).forEach((key) => {
      if (key !== 'attachments') {
        if (typeof cleanedPayload[key] === 'object') {
          formData.append(key, JSON.stringify(cleanedPayload[key]));
        } else {
          formData.append(key, cleanedPayload[key]);
        }
      }
    });

    // Add files
    cleanedPayload.attachments.forEach((file) => {
      formData.append('attachments', file);
    });

    const response = await apiClient.patch(`/consultation/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  const response = await apiClient.patch(`/consultation/${id}`, cleanedPayload);
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