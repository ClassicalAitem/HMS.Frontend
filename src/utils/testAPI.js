// Test API configuration
import { config } from '../config/env';

export const testAPIConfig = () => {
  console.log('🔧 API Configuration Test:');
  console.log('🌐 Base URL:', config.API_BASE_URL);
  console.log('📱 App Name:', config.APP_NAME);
  console.log('🔢 App Version:', config.APP_VERSION);
  console.log('🌍 Environment:', config.NODE_ENV);
  
  // Test if the URL is properly formatted
  if (config.API_BASE_URL.includes('your-api-base-url.com')) {
    console.warn('⚠️  WARNING: Using default API URL. Please update your .env file!');
  } else {
    console.log('✅ API URL appears to be configured');
  }
  
  return {
    baseURL: config.API_BASE_URL,
    isConfigured: !config.API_BASE_URL.includes('your-api-base-url.com')
  };
};

// Call this function to test the configuration
testAPIConfig();
