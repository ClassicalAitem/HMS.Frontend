import apiClient from './apiClient'

export const getPrescriptions = async () => {
  try {
    const response = await apiClient.get('/prescription')
    return response.data ?? []
  } catch (err) {
    console.error('prescriptionsAPI: getPrescriptions error', err)
    throw err
  }
}

export const getPrescriptionsForConsultation = async (consultationId) => {
  try {
    const response = await apiClient.get(`/prescription/consultation/${consultationId}`)
    return response.data ?? []
  } catch (err) {
    console.error('prescriptionsAPI: getPrescriptionsForConsultation error', err)
    throw err
  }
}

export const getPrescriptionsByAntenatalId = async (antenatalId) => {
  try {
    const response = await apiClient.get(`/prescription/antenatal/${antenatalId}`)
    return response.data ?? []
  } catch (err) {
    console.error('prescriptionsAPI: getPrescriptionsByAntenatalId error', err)
    throw err
  }
}

export const getPrescriptionById = async (id) => {
  try {
    const response = await apiClient.get(`/prescription/${id}`)
    return response.data ?? {}
  } catch (err) {
    console.error('prescriptionsAPI: getPrescriptionById error', err)
    throw err
  }
}

export const getPrescriptionByPatientId = async (patientId) => {
  try {
    const response = await apiClient.get(`/prescription/getPrescriptionByPatientId/${patientId}`)
    return response.data ?? []
  } catch (err) {
    // Suppress 404 errors (patient has no prescriptions)
    if (err?.response?.status !== 404) {
      console.error('prescriptionsAPI: getPrescriptionByPatientId error', err)
    }
    throw err
  }
}

export const updatePrescription = async (id, updateData) => {
  try {
    const response = await apiClient.patch(`/prescription/${id}`, updateData)
    return response.data ?? {}
  } catch (err) {
    console.error('prescriptionsAPI: updatePrescription error', err)
    throw err
  }
}

export const createPrescription = async (data, contextId, contextType = 'consultation') => {
  try {
    const endpoint = contextType === 'antenatal' 
      ? `/prescription/antenatal/${contextId}`
      : `/prescription/consultation/${contextId}`
    const response = await apiClient.post(endpoint, data)
    return response.data ?? {}
  } catch (err) {
    console.error('prescriptionsAPI: createPrescription error', err.response?.data || err.message, err)
    throw err
  }
}

export const deletePrescription = async (id) => {
  try {
    const response = await apiClient.delete(`/prescription/${id}`)
    return response.data ?? {}
  } catch (err) {
    console.error('prescriptionsAPI: deletePrescription error', err)
    throw err
  }
}

export default {
  getPrescriptions,
  getPrescriptionsForConsultation,
  getPrescriptionsByAntenatalId,
  getPrescriptionById,
  getPrescriptionByPatientId,
  updatePrescription,
  createPrescription,
  deletePrescription
}