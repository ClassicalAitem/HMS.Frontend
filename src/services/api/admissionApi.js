import apiClient from './apiClient'

export const getAdmissions = async () => {
  try {
    const response = await apiClient.get('/admission')
    return response.data ?? []
  } catch (err) {
    console.error('admissionAPI: getAdmissions error', err)
    throw err
  }
}

export const getAdmissionsForConsultation = async (consultationId) => {
  try {
    const response = await apiClient.get(`/admission/consultation/${consultationId}`)
    return response.data ?? []
  } catch (err) {
    console.error('admissionAPI: getAdmissionsForConsultation error', err)
    throw err
  }
}

export const getAdmissionsByAntenatalId = async (antenatalId) => {
  try {
    const response = await apiClient.get(`/admission/antenatal/${antenatalId}`)
    return response.data ?? []
  } catch (err) {
    console.error('admissionAPI: getAdmissionsByAntenatalId error', err)
    throw err
  }
}

export const getAdmissionById = async (id) => {
  try {
    const response = await apiClient.get(`/admission/${id}`)
    return response.data ?? {}
  } catch (err) {
    console.error('admissionAPI: getAdmissionById error', err)
    throw err
  }
}

export const getAdmissionByPatientId = async (patientId) => {
  try {
    const response = await apiClient.get(`/admission/getAdmissionByPatientId/${patientId}`)
    return response.data ?? []
  } catch (err) {
    // Suppress 404 errors (patient has no admissions) - return empty array
    if (err?.response?.status === 404) {
      console.log('admissionAPI: No admissions found for patient, returning empty array')
      return []
    }
    console.error('admissionAPI: getAdmissionByPatientId error', err)
    throw err
  }
}

export const updateAdmission = async (id, updateData) => {
  try {
    const response = await apiClient.patch(`/admission/${id}`, updateData)
    return response.data ?? {}
  } catch (err) {
    console.error('admissionAPI: updateAdmission error', err)
    throw err
  }
}

export const dischargeAdmission = async (id, dischargeNotes) => {
  try {
    const response = await apiClient.patch(`/admission/${id}/discharge`, { dischargeNotes })
    return response.data ?? {}
  } catch (err) {
    console.error('admissionAPI: dischargeAdmission error', err)
    throw err
  }
}

export const createAdmission = async (data, contextId, contextType = 'consultation') => {
  try {
    const requiredFields = ['ward', 'admissions']
    for (const field of requiredFields) {
      if (!data?.[field]) {
        throw new Error(`Missing required field: ${field}`)
      }
    }
    const endpoint = contextType === 'antenatal'
      ? `/admission/antenatal/${contextId}`
      : `/admission/consultation/${contextId}`
    const response = await apiClient.post(endpoint, data)
    return response.data ?? {}
  } catch (err) {
    console.error('admissionAPI: createAdmission error', err.response?.data || err.message, err)
    throw err
  }
}

export const deleteAdmission = async (id) => {
  try {
    const response = await apiClient.delete(`/admission/${id}`)
    return response.data ?? {}
  } catch (err) {
    console.error('admissionAPI: deleteAdmission error', err)
    throw err
  }
}

export default {
  getAdmissions,
  getAdmissionsForConsultation,
  getAdmissionsByAntenatalId,
  getAdmissionById,
  getAdmissionByPatientId,
  updateAdmission,
  dischargeAdmission,
  createAdmission,
  deleteAdmission
}