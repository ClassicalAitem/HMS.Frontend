import apiClient from './apiClient';

export const getAuditLogs = async (params = {}) => {
  try {
    const response = await apiClient.get('/auditLog', { params });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    throw error;
  }
};

export const getAuditLogStats = async () => {
  try {
    const response = await apiClient.get('/auditLog/stats');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch audit log stats:', error);
    throw error;
  }
};

export const createAuditLog = async (data) => {
  try {
    const response = await apiClient.post('/auditLog', data);
    return response.data;
  } catch (error) {
    console.error('Failed to create audit log:', error);
    throw error;
  }
};

export default {
  getAuditLogs,
  getAuditLogStats,
  createAuditLog,
};
