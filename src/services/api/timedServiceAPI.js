import apiClient from './apiClient';

export const startTimedSession = async (payload) => {
  try {
    const response = await apiClient.post('/timed-service/start', payload);
    return response.data ?? {};
  } catch (err) {
    console.error('timedServiceAPI: startTimedSession error', err);
    throw err;
  }
};

export const completeTimedSession = async (id, payload) => {
  try {
    const response = await apiClient.patch(`/timed-service/${id}/complete`, payload);
    return response.data ?? {};
  } catch (err) {
    console.error('timedServiceAPI: completeTimedSession error', err);
    throw err;
  }
};

export const cancelTimedSession = async (id, payload) => {
  try {
    const response = await apiClient.patch(`/timed-service/${id}/cancel`, payload);
    return response.data ?? {};
  } catch (err) {
    console.error('timedServiceAPI: cancelTimedSession error', err);
    throw err;
  }
};

export const getTimedSessionsByAdmission = async (admissionId) => {
  try {
    const response = await apiClient.get(`/timed-service/admission/${admissionId}`);
    return response.data?.data ?? response.data ?? [];
  } catch (err) {
    console.error('timedServiceAPI: getTimedSessionsByAdmission error', err);
    return [];
  }
};

export default {
  startTimedSession,
  completeTimedSession,
  cancelTimedSession,
  getTimedSessionsByAdmission,
};
