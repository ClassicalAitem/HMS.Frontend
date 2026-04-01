import apiClient from './apiClient'

export const getInvestigations = async () => {
  try {
    const response = await apiClient.get('/investigation')
    return response.data ?? []
  } catch (err) {
    console.error('investigationsAPI: getInvestigations error', err)
    throw err
  }
}

export const getInvestigationsForConsultation = async (consultationId) => {
  try {
    const response = await apiClient.get(`/investigation/consultation/${consultationId}`)
    return response.data ?? []
  } catch (err) {
    console.error('investigationsAPI: getInvestigationsForConsultation error', err)
    throw err
  }
}

export const getInvestigationsByAntenatalId = async (antenatalId) => {
  try {
    const response = await apiClient.get(`/investigation/antenatal/${antenatalId}`)
    return response.data ?? []
  } catch (err) {
    console.error('investigationsAPI: getInvestigationsByAntenatalId error', err)
    throw err
  }
}

export const getInvestigationById = async (id) => {
  try {
    const response = await apiClient.get(`/investigation/${id}`)
    return response.data ?? {}
  } catch (err) {
    console.error('investigationsAPI: getInvestigationById error', err)
    throw err
  }
}

export const getInvestigationByPatientId = async (patientId) => {
  try {
    const response = await apiClient.get(`/investigation/getInvestigationByPatientId/${patientId}`)
    return response.data ?? []
  } catch (err) {
    // Suppress 404 errors (patient has no investigations)
    if (err?.response?.status !== 404) {
      console.error('investigationsAPI: getInvestigationByPatientId error', err)
    }
    throw err
  }
}

export const updateInvestigation = async (id, updateData) => {
  try {
    const response = await apiClient.patch(`/investigation/${id}`, updateData)
    return response.data ?? {}
  } catch (err) {
    console.error('investigationsAPI: updateInvestigation error', err)
    throw err
  }
}

export const createInvestigation = async (data, contextId, contextType = 'consultation') => {
  try {
    const endpoint = contextType === 'antenatal' 
      ? `/investigation/antenatal/${contextId}`
      : `/investigation/consultation/${contextId}`
    const response = await apiClient.post(endpoint, data)
    return response.data ?? {}
  } catch (err) {
    console.error('investigationsAPI: createInvestigation error', err.response?.data || err.message, err)
    throw err
  }
}

export const deleteInvestigation = async (id) => {
  try {
    const response = await apiClient.delete(`/investigation/${id}`)
    return response.data ?? {}
  } catch (err) {
    console.error('investigationsAPI: deleteInvestigation error', err)
    throw err
  }
}

export default {
  getInvestigations,
  getInvestigationsForConsultation,
  getInvestigationsByAntenatalId,
  getInvestigationById,
  getInvestigationByPatientId,
  updateInvestigation,
  createInvestigation,
  deleteInvestigation
}