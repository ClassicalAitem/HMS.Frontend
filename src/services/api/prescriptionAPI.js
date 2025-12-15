import apiClient from "./apiClient";

export const updatePrescription = async(prescriptionId, payload) => {
  try {
    const response = await apiClient.patch(`/prescription/${prescriptionId}`, payload);
    return response.data;
  } catch (error) {
    console.error('❌ PrescriptionsAPI: Update Prescription error occurred');
    console.error('📥 PrescriptionsAPI: Error response:', error.response);
    console.error('📥 PrescriptionsAPI: Error data:', error.response?.data);
    throw error;
  }
};