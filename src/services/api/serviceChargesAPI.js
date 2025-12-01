import apiClient from './apiClient';

// Get all service charges
export const getServiceCharges = async () => {
  try {
    console.log('💰 ServiceChargesAPI: Fetching all service charges');
    const response = await apiClient.get('/serviceCharge');
    console.log('✅ ServiceChargesAPI: All service charges fetched successfully');
    console.log('💰 ServiceChargesAPI: Response data:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ ServiceChargesAPI: Get all service charges error occurred');
    console.error('📥 ServiceChargesAPI: Error response:', error.response);
    console.error('📥 ServiceChargesAPI: Error data:', error.response?.data);
    throw error;
  }
};

// Get service charge by ID
export const getServiceCharge = async (id) => {
  try {
    console.log('💰 ServiceChargesAPI: Fetching service charge with ID:', id);
    const response = await apiClient.get(`/serviceCharge/${id}`);
    console.log('✅ ServiceChargesAPI: Service charge fetched successfully');
    console.log('💰 ServiceChargesAPI: Response data:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ ServiceChargesAPI: Get service charge error occurred');
    console.error('📥 ServiceChargesAPI: Error response:', error.response);
    console.error('📥 ServiceChargesAPI: Error data:', error.response?.data);
    throw error;
  }
};

// Create new service charge
export const createServiceCharge = async (payload) => {
  try {
    console.log('💰 ServiceChargesAPI: Creating service charge with payload:', payload);
    const response = await apiClient.post('/serviceCharge', payload);
    console.log('✅ ServiceChargesAPI: Service charge created successfully');
    console.log('💰 ServiceChargesAPI: Create response data:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ ServiceChargesAPI: Create service charge error occurred');
    console.error('📥 ServiceChargesAPI: Error response:', error.response);
    console.error('📥 ServiceChargesAPI: Error data:', error.response?.data);
    throw error;
  }
};

// Update service charge
export const updateServiceCharge = async (id, payload) => {
  try {
    console.log('💰 ServiceChargesAPI: Updating service charge with ID:', id);
    console.log('💰 ServiceChargesAPI: Update payload:', payload);
    const response = await apiClient.patch(`/serviceCharge/${id}`, payload);
    console.log('✅ ServiceChargesAPI: Service charge updated successfully');
    console.log('💰 ServiceChargesAPI: Update response data:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ ServiceChargesAPI: Update service charge error occurred');
    console.error('📥 ServiceChargesAPI: Error response:', error.response);
    console.error('📥 ServiceChargesAPI: Error data:', error.response?.data);
    throw error;
  }
};

// Delete service charge
export const deleteServiceCharge = async (id) => {
  try {
    console.log('💰 ServiceChargesAPI: Deleting service charge with ID:', id);
    const response = await apiClient.delete(`/serviceCharge/${id}`);
    console.log('✅ ServiceChargesAPI: Service charge deleted successfully');
    console.log('💰 ServiceChargesAPI: Delete response data:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ ServiceChargesAPI: Delete service charge error occurred');
    console.error('📥 ServiceChargesAPI: Error response:', error.response);
    console.error('📥 ServiceChargesAPI: Error data:', error.response?.data);
    throw error;
  }
};

export default {
  getServiceCharges,
  getServiceCharge,
  createServiceCharge,
  updateServiceCharge,
  deleteServiceCharge,
};