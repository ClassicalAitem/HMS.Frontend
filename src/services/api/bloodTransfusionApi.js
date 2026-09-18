import apiClient from './apiClient'

export const createBloodTransfusionOrder = async (payload) => {
  const res = await apiClient.post('/blood-transfusion', payload)
  return res.data ?? res
}

export const completeBloodTransfusionOrder = async (id) => {
  const res = await apiClient.patch(`/blood-transfusion/${id}/complete`)
  return res.data ?? res
}

export const startBloodTransfusionOrder = async (id) => {
  const res = await apiClient.patch(`/blood-transfusion/${id}/start`)
  return res.data ?? res
}

export const getBloodTransfusionsByPatient = async (patientId, params = {}) => {
  const res = await apiClient.get(`/blood-transfusion/patient/${patientId}`, { params })
  return res.data ?? res
}

export const dispenseBloodTransfusionPreps = async (id) => {
  const res = await apiClient.patch(`/blood-transfusion/${id}/dispense`)
  return res.data ?? res
}

export default {
  createBloodTransfusionOrder,
  startBloodTransfusionOrder,
  completeBloodTransfusionOrder,
  getBloodTransfusionsByPatient,
  dispenseBloodTransfusionPreps,
}
