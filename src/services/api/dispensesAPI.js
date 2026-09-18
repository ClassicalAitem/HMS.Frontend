import apiClient from './apiClient'

export const getDispenses = async (params = {}) => {
  try {
    const response = await apiClient.get('/dispense', { params })
    // API returns { success, code, message, data }
    return response.data ?? response
  } catch (err) {
    console.error('dispensesAPI: getDispenses error', err)
    throw err
  }
}

export const getDispense = async (id) => {
  try {
    const response = await apiClient.get(`/dispense/${id}`)
    return response.data ?? response
  } catch (err) {
    console.error('dispensesAPI: getDispense error', err)
    throw err
  }
}

export const createDispense = async (prescriptionId, payload) => {
  try {
    if (!prescriptionId) throw new Error('Prescription ID is required')
    if (!payload || !Array.isArray(payload.items) || payload.items.length === 0) {
      throw new Error('At least one dispense item is required')
    }

    const invalidItem = payload.items.find((item) => !item?.drugName || !(item?.quantity !== undefined && item?.quantity !== null && Number(item.quantity) > 0))
    if (invalidItem) {
      throw new Error('Each dispense item must include a drugName and a positive quantity')
    }

    const response = await apiClient.post(`/dispense/${prescriptionId}`, payload)
    return response.data ?? response
  } catch (err) {
    console.error('dispensesAPI: createDispense error', err)
    throw err
  }
}

export const updateDispense = async (id, payload) => {
  try {
    const response = await apiClient.patch(`/dispense/${id}`, payload)
    return response.data ?? response
  } catch (err) {
    console.error('dispensesAPI: updateDispense error', err)
    throw err
  }
}

export const dispenseMedicationSlot = async (admissionId, payload) => {
  if (!admissionId) throw new Error('Admission ID is required')
  const response = await apiClient.post(
    `/dispense/slot/${admissionId}`,
    payload
  )
  return response.data ?? response
}

export const getMedicationDispenseSlots = async (admissionId) => {
  if (!admissionId) throw new Error('Admission ID is required')
  const response = await apiClient.get(`/dispense/slots/${admissionId}`)
  return response.data?.data ?? response.data ?? response
}

export const createTreatmentBill = async (admissionId) => {
  if (!admissionId) throw new Error('Admission ID is required')
  const response = await apiClient.post(`/dispense/treatment-bill/${admissionId}`)
  return response.data ?? response
}

export default {
  getDispenses,
  getDispense,
  createDispense,
  updateDispense,
  dispenseMedicationSlot,
  getMedicationDispenseSlots,
  createTreatmentBill
}
