import apiClient from "./apiClient";

export const createBloodDispense = async (data) => {
  const response = await apiClient.post("/blood-dispense", data);
  return response.data;
};

export const getBloodDispenseByPatient = async (patientId) => {
  const response = await apiClient.get(`/blood-dispense/patient/${patientId}`);
  return response.data;
};

export const getBloodDispenseByAdmission = async (admissionId) => {
  const response = await apiClient.get(`/blood-dispense/admission/${admissionId}`);
  return response.data;
};

export const updateBloodDispenseStatus = async (id, status) => {
  const response = await apiClient.patch(`/blood-dispense/${id}/status`, { status });
  return response.data;
};
