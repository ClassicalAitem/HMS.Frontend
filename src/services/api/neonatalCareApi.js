import apiClient from './apiClient'

export const createNeonatalCareLog = async (payload) => {
  const res = await apiClient.post('/neonatal-care', payload)
  return res.data ?? res
}

export const endNeonatalCareSession = async (id, payload = {}) => {
  const res = await apiClient.patch(`/neonatal-care/${id}/end`, payload)
  return res.data ?? res
}

export const getNeonatalCareByPatient = async (patientId, params = {}) => {
  const res = await apiClient.get(`/neonatal-care/patient/${patientId}`, { params })
  return res.data ?? res
}

export const deleteNeonatalCareLog = async (id) => {
  const res = await apiClient.delete(`/neonatal-care/${id}`)
  return res.data ?? res
}

export default {
  createNeonatalCareLog,
  endNeonatalCareSession,
  getNeonatalCareByPatient,
  deleteNeonatalCareLog,
}
