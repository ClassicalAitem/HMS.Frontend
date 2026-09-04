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

export default {
  createEbtRecord,
  getEbtByPatient,
  deleteEbtRecord,
}
