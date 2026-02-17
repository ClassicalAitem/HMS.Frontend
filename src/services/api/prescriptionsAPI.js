import apiClient from './apiClient'

export const getPrescriptions = async () => {
  try {
    const response = await apiClient.get('/prescription')
    return response.data ?? response
  } catch (err) {
    console.error('prescriptionsAPI: getPrescriptions error', err)
    throw err
  }
}

export const getPrescriptionsForConsultation = async (consultationId) => {
  try {
    const response = await apiClient.get(`/prescription?consultationId=${consultationId}`)
    return response.data ?? response
  } catch (err) {
    console.error('prescriptionsAPI: getPrescriptionsForConsultation error', err)
    throw err
  }
}

export const getPrescriptionById = async (id) => {
  try {
    const response = await apiClient.get(`/prescription/${id}`)
    return response.data ?? response
  } catch (err) {
    console.error('prescriptionsAPI: getPrescriptionById error', err)
    throw err
  }
}

export const getPrescriptionByPatientId = async (patientId) => {
  try {
    const response = await apiClient.get(`/prescription/getPrescriptionByPatientId/${patientId}`)
    return response.data ?? response
  } catch (err) {
    console.error('prescriptionsAPI: getPrescriptionByPatientId error', err)
    throw err
  }
}

export const updatePrescription = async (id, updateData) => {
  try {
    const response = await apiClient.patch(`/prescription/${id}`, updateData)
    return response.data ?? response
  } catch (err) {
    console.error('prescriptionsAPI: updatePrescription error', err)
    throw err
  }
}

export const createPrescription = async (data, consultationId) => {
  try {
    const response = await apiClient.post(`/prescription/${consultationId}`, data)
    return response.data ?? response
  } catch (err) {
    console.error('prescriptionsAPI: createPrescription error', err.response?.data || err.message)
    throw err
  }
}

export default {
  getPrescriptions,
  getPrescriptionById,
  getPrescriptionByPatientId,
  updatePrescription,
  createPrescription
}
