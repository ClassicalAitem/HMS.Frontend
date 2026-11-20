import apiClient from './apiClient';

export const shiftAccessAPI = {
  // Get current user's shift status, lock state, and active overrides
  getShiftStatus: async () => {
    const response = await apiClient.get('/shift-access/status');
    return response;
  },

  // Staff submits a request for double shift / overtime access
  requestAccess: async (data) => {
    const response = await apiClient.post('/shift-access/request', data);
    return response;
  },

  // Staff gets their own history of shift requests
  getMyRequests: async () => {
    const response = await apiClient.get('/shift-access/my-requests');
    return response;
  },

  // Record end of shift
  recordShiftEnd: async () => {
    const response = await apiClient.post('/shift-access/record-end');
    return response;
  },

  // HR / Super Admin: Get all shift access requests
  getAllRequests: async (params = {}) => {
    const response = await apiClient.get('/shift-access/all', { params });
    return response;
  },

  // HR / Super Admin: Approve or Reject a shift access request
  reviewRequest: async (requestId, data) => {
    const response = await apiClient.patch(`/shift-access/${requestId}/review`, data);
    return response;
  },
};

export default shiftAccessAPI;
