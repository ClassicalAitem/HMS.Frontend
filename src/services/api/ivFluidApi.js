import apiClient from './apiClient'

export const createIvFluidOrder = async (payload) => {
  const res = await apiClient.post('/iv-fluid/order', payload)
  return res.data ?? res
}

export const updateIvFluidOrderStatus = async (id, status) => {
  const res = await apiClient.patch(`/iv-fluid/order/${id}/status`, { status })
  return res.data ?? res
}

export const createIvFluidEntry = async (payload) => {
  const res = await apiClient.post('/iv-fluid', payload)
  return res.data ?? res
}

export const getIvFluidByPatient = async (patientId, params = {}) => {
  const res = await apiClient.get(`/iv-fluid/patient/${patientId}`, { params })
  return res.data ?? res
}

export const deleteIvFluidEntry = async (id) => {
  const res = await apiClient.delete(`/iv-fluid/${id}`)
  return res.data ?? res
}

export default {
  createIvFluidOrder,
  updateIvFluidOrderStatus,
  createIvFluidEntry,
  getIvFluidByPatient,
  deleteIvFluidEntry,
}
