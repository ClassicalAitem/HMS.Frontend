import apiClient from './apiClient'

export const createBloodTransfusionOrder = async (payload) => {
  const res = await apiClient.post('/blood-transfusion', payload)
  return res.data ?? res
}

export const orderBloodTransfusionConsumables = async (id, items) => {
  const res = await apiClient.post(`/blood-transfusion/${id}/consumables`, { items })
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

export const dispenseBloodTransfusionConsumables = async (orderId, consumableId) => {
  const res = await apiClient.patch(`/blood-transfusion/${orderId}/consumables/${consumableId}/dispense`)
  return res.data ?? res
}

export const administerBloodTransfusionPreps = async (id) => {
  const res = await apiClient.patch(`/blood-transfusion/${id}/administer-preps`)
  return res.data ?? res
}

export default {
  createBloodTransfusionOrder,
  orderBloodTransfusionConsumables,
  startBloodTransfusionOrder,
  completeBloodTransfusionOrder,
  getBloodTransfusionsByPatient,
  dispenseBloodTransfusionPreps,
  dispenseBloodTransfusionConsumables,
  administerBloodTransfusionPreps,
}
