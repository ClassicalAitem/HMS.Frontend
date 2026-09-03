// API configuration utility
import { config } from '../config/env';

export const testAPIConfig = () => {
  return {
    baseURL: config.API_BASE_URL,
    isConfigured: !config.API_BASE_URL?.includes('your-api-base-url.com'),
  };
};
