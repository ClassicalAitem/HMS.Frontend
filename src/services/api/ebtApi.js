import apiClient from './apiClient'

export const createEbtRecord = async (payload) => {
  const res = await apiClient.post('/ebt', payload)
  return res.data ?? res
}

export const getEbtByPatient = async (patientId, params = {}) => {
  const res = await apiClient.get(`/ebt/patient/${patientId}`, { params })
  return res.data ?? res
}

export const deleteEbtRecord = async (id) => {
  const res = await apiClient.delete(`/ebt/${id}`)
  return res.data ?? res
}

export const updateEbtStatus = async (id, status, nurseNote) => {
  const res = await apiClient.patch(`/ebt/${id}/status`, { status, nurseNote })
  return res.data ?? res
}

export const orderEbtConsumables = async (id, payload) => {
  const res = await apiClient.post(`/ebt/${id}/consumables`, payload)
  return res.data ?? res
}

export const dispenseEbtConsumables = async (id, consumableId) => {
  const res = await apiClient.patch(`/ebt/${id}/consumables/${consumableId}/dispense`)
  return res.data ?? res
}

export default {
  createEbtRecord,
  getEbtByPatient,
  deleteEbtRecord,
  updateEbtStatus,
  orderEbtConsumables,
  dispenseEbtConsumables,
}
