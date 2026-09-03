import apiClient from './apiClient';

export const getHospitalInfo = async () => {
  try {
    const response = await apiClient.get('/setting/hospital-info');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch hospital info:', error);
    throw error;
  }
};

export const updateHospitalInfo = async (data) => {
  try {
    const response = await apiClient.put('/setting/hospital-info', data);
    return response.data;
  } catch (error) {
    console.error('Failed to update hospital info:', error);
    throw error;
  }
};

export const getSystemPreferences = async () => {
  try {
    const response = await apiClient.get('/setting/system-preferences');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch system preferences:', error);
    throw error;
  }
};

export const updateSystemPreferences = async (data) => {
  try {
    const response = await apiClient.put('/setting/system-preferences', data);
    return response.data;
  } catch (error) {
    console.error('Failed to update system preferences:', error);
    throw error;
  }
};

export const getSecuritySettings = async () => {
  try {
    const response = await apiClient.get('/setting/security');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch security settings:', error);
    throw error;
  }
};

export const updateSecuritySettings = async (data) => {
  try {
    const response = await apiClient.put('/setting/security', data);
    return response.data;
  } catch (error) {
    console.error('Failed to update security settings:', error);
    throw error;
  }
};

export default {
  getHospitalInfo,
  updateHospitalInfo,
  getSystemPreferences,
  updateSystemPreferences,
  getSecuritySettings,
  updateSecuritySettings,
};
