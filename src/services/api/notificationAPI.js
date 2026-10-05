import apiClient from './apiClient';

export const getQueueCount = async (role) => {
  const response = await apiClient.get(`/patient/queue-count/${role}`);
  return response.data;
};

export const getWebPushPublicKey = async () => {
  const response = await apiClient.get('/push-notifications/public-key', {
    skipErrorToast: true,
  });
  return response.data?.data?.publicKey || null;
};

export const saveWebPushSubscription = async (subscription) => {
  const response = await apiClient.post(
    '/push-notifications/subscription',
    { subscription },
    { skipErrorToast: true },
  );
  return response.data;
};

export const removeWebPushSubscription = async (endpoint) => {
  if (!endpoint) return null;

  const response = await apiClient.delete(
    '/push-notifications/subscription',
    { data: { endpoint }, skipErrorToast: true },
  );

  return response.data;
};