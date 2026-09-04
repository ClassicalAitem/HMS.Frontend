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
    if (!consultationId) throw new Error('Consultation ID is required')
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
    const response = await apiClient.get(`/prescription/getPrescriptionByPatientId/${patientId}`, { skipErrorToast: true })
    return response.data ?? []
  } catch (err) {
    if (err?.response?.status === 404) {
      return []
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
    if (!contextId) throw new Error(`A valid ${contextType} ID is required`)
    const payload = data?.medications?.[0] || []
    const requiredFields = ['drugName', 'frequency', 'duration', 'dosageAmount', 'dosageUnit']
    for (const field of requiredFields) {
      if (!payload?.[field] && !data?.[field]) {
        throw new Error(`Missing required field: ${field}`)
      }
    }
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

export const createPrescriptionByWardRound = async (wardRoundId, data) => {
  try {
    if (!wardRoundId) throw new Error('Ward round ID is required')
    const response = await apiClient.post(`/prescription/wardRound/${wardRoundId}`, data)
    return response.data ?? response
  } catch (err) {
    console.error('prescriptionsAPI: createPrescriptionByWardRound error', err.response?.data || err.message, err)
    throw err
  }
}

export const getPrescriptionsByWardRound = async (wardRoundId) => {
  try {
    if (!wardRoundId) throw new Error('Ward round ID is required')
    const response = await apiClient.get(`/prescription/wardRound/${wardRoundId}`)
    return response.data ?? response
  } catch (err) {
    console.error('prescriptionsAPI: getPrescriptionsByWardRound error', err.response?.data || err.message, err)
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
  createPrescriptionByWardRound,
  getPrescriptionsByWardRound,
  deletePrescription
}