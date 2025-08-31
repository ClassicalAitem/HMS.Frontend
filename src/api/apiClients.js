import axios from 'axios';
import { getLocalStorageItem } from '../utils/localStorage';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, 
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Add an interceptor to include the auth token in headers
apiClient.interceptors.request.use(
  (config) => {
    const authToken = getLocalStorageItem('accessToken');
    if (authToken) {
      config.headers['Authorization'] = `Bearer ${authToken}`;
    } else {
      delete config.headers['Authorization']; // Remove the header if no token
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
