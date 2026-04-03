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

export default {
  getDispenses,
  getDispense,
  createDispense,
  updateDispense
}
