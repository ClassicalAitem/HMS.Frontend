import apiClient from "./apiClient";

const BASE_URL = "/attendance";

export const getAttendanceLogs = async (params = {}) => {
  return await apiClient.get(`${BASE_URL}`, { params });
};
