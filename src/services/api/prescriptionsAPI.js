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

export const getPrescriptionById = async (id) => {
  try {
    const response = await apiClient.get(`/prescription/${id}`)
    return response.data ?? response
  } catch (err) {
    console.error('prescriptionsAPI: getPrescriptionById error', err)
    throw err
  }
}

export default {
  getPrescriptions,
  getPrescriptionById
}
