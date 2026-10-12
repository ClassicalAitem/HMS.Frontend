import apiClient from './apiClient'

export const getPatientCredits = async (patientId) => {
  if (!patientId) throw new Error('Patient ID is required')
  const response = await apiClient.get(`/patient-credit/patient/${patientId}`)
  return response.data?.data ?? response.data ?? {}
}

export const createPatientCredit = async (patientId, credit) => {
  if (!patientId) throw new Error('Patient ID is required')
  const response = await apiClient.post(`/patient-credit/patient/${patientId}`, credit)
  return response.data?.data ?? response.data ?? {}
}
