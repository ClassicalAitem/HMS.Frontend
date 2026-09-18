import apiClient from './apiClient'

export const administerMedication = async (admissionId, payload) => {
  if (!admissionId) throw new Error('Admission ID is required')
  const response = await apiClient.post(
    `/nurse/admissions/${admissionId}/administer-medication`,
    payload
  )
  return response.data ?? response
}

export const getMedicationAdministrations = async (admissionId) => {
  if (!admissionId) throw new Error('Admission ID is required')
  const response = await apiClient.get(`/admission/${admissionId}/medication-administrations`)
  return response.data?.data ?? response.data ?? response
}

export const generateTreatmentBill = async (admissionId) => {
  if (!admissionId) throw new Error('Admission ID is required')
  const response = await apiClient.post(`/nurse/admissions/${admissionId}/generate-treatment-bill`)
  return response.data ?? response
}

export default { administerMedication, getMedicationAdministrations, generateTreatmentBill }