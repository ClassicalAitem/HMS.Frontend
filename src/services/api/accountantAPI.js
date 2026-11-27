import apiClient from './apiClient';

export const accountantAPI = {
  getDashboard: async (params = {}) => {
    const response = await apiClient.get('/accountant/dashboard', { params });
    return response.data;
  },

  getIndividualBills: async (params = {}) => {
    const response = await apiClient.get('/accountant/individual-bills', { params });
    return response.data;
  },

  getPatients: async () => {
    const response = await apiClient.get('/accountant/patients');
    return response.data;
  },

  getPatientFinancials: async (id, type = 'patient') => {
    const response = await apiClient.get(`/accountant/patients/${id}/financials`, {
      params: { type },
    });
    return response.data;
  },

  getInventoryBalance: async () => {
    const response = await apiClient.get('/accountant/inventory-balance');
    return response.data;
  },

  updateInventoryLocation: async (id, data) => {
    const response = await apiClient.patch(`/accountant/inventory/${id}/location`, data);
    return response.data;
  },

  getExpenses: async (params = {}) => {
    const response = await apiClient.get('/accountant/expenses', { params });
    return response.data;
  },

  createExpense: async (data) => {
    const response = await apiClient.post('/accountant/expenses', data);
    return response.data;
  },

  updateExpense: async (id, data) => {
    const response = await apiClient.patch(`/accountant/expenses/${id}`, data);
    return response.data;
  },

  deleteExpense: async (id) => {
    const response = await apiClient.delete(`/accountant/expenses/${id}`);
    return response.data;
  },

  getDirectIncomes: async (params = {}) => {
    const response = await apiClient.get('/accountant/income', { params });
    return response.data;
  },

  createDirectIncome: async (data) => {
    const response = await apiClient.post('/accountant/income', data);
    return response.data;
  },

  deleteDirectIncome: async (id) => {
    const response = await apiClient.delete(`/accountant/income/${id}`);
    return response.data;
  },
};

export default accountantAPI;
