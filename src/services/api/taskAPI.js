import apiClient from './apiClient';

export const createTask = async (data) => {
  try {
    const response = await apiClient.post('/task', data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllTasks = async (params = {}) => {
  try {
    const response = await apiClient.get('/task', { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getTaskById = async (id) => {
  try {
    const response = await apiClient.get(`/task/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateTask = async (id, data) => {
  try {
    const response = await apiClient.patch(`/task/${id}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteTask = async (id) => {
  try {
    const response = await apiClient.delete(`/task/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
};
