import apiClient from './apiClient';

export const createTicket = async (data) => {
  const response = await apiClient.post('/tickets', data);
  return response.data;
};

export const getAllTickets = async (params = {}) => {
  const response = await apiClient.get('/tickets', { params });
  return response.data;
};

export const getTicketById = async (id) => {
  const response = await apiClient.get(`/tickets/${id}`);
  return response.data;
};

export const updateTicket = async (id, data) => {
  const response = await apiClient.patch(`/tickets/${id}`, data);
  return response.data;
};

export const addTicketComment = async (id, data) => {
  const response = await apiClient.post(`/tickets/${id}/comments`, data);
  return response.data;
};

export const getTicketStats = async () => {
  const response = await apiClient.get('/tickets/stats');
  return response.data;
};

export const uploadTicketAttachment = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post('/tickets/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getAttachmentUrl = (fileId) => {
  const baseURL = apiClient.defaults.baseURL || '/api/v1';
  return `${baseURL}/tickets/attachment/${fileId}`;
};

export default {
  createTicket,
  getAllTickets,
  getTicketById,
  updateTicket,
  addTicketComment,
  getTicketStats,
  uploadTicketAttachment,
  getAttachmentUrl,
};

