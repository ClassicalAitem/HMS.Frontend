import apiClient from "./apiClient";

export const getAllWards = async() => {
  try {
    const response = await apiClient.get('/ward');
    return response.data;

  } catch (error) {
    console.error('❌ WardsAPI: Get Wards error occurred');
    console.error('📥 WardsAPI: Error response:', error.response);
    console.error('📥 WardsAPI: Error data:', error.response?.data);
    throw error;
  }
}

export const createWard = async(wardData) => {
  try {
    const requiredFields = ['name', 'departmentId', 'status'];
    for (const field of requiredFields) {
      if (!wardData?.[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    const response = await apiClient.post('/ward', wardData);
    return response.data;
  } catch (error) {
    console.error('❌ WardsAPI: Create Ward error occurred');
    console.error('📥 WardsAPI: Error response:', error.response);
    console.error('📥 WardsAPI: Error data:', error.response?.data);
    throw error;
  }
};

export const updateWard = async(wardId, wardData) => {
  try {
    const response = await apiClient.patch(`/ward/${wardId}`, wardData);
    return response.data;
  } catch (error) {
    console.error('❌ WardsAPI: Update Ward error occurred');
    console.error('📥 WardsAPI: Error response:', error.response)
    console.error('📥 WardsAPI: Error data:', error.response?.data);
    throw error;
  }
};

export const deleteWard = async(wardId) => {
  try {
    const response = await apiClient.delete(`/ward/${wardId}`);
    return response.data;
  } catch (error) {
    console.error('❌ WardsAPI: Delete Ward error occurred');
    console.error('📥 WardsAPI: Error response:', error.response);
    console.error('📥 WardsAPI: Error data:', error.response?.data);
    throw error;
  }
};