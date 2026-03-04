import apiClient from './apiClient'

export const getLaboratoryInventories = async () => {
  try {
    const response = await apiClient.get('/laboratoryInventory')
    return response.data ?? response
  } catch (err) {
    console.error('inventoryAPI: getLaboratoryInventories error', err)
    throw err
  }
}

export const getLaboratoryInventory = async (id) => {
  try {
    const response = await apiClient.get(`/laboratoryInventory/${id}`)
    return response.data ?? response
  } catch (err) {
    console.error('inventoryAPI: getLaboratoryInventory error', err)
    throw err
  }
}

export const createLaboratoryInventory = async (payload) => {
  try {
    const response = await apiClient.post('/laboratoryInventory', payload)
    return response.data ?? response
  } catch (err) {
    console.error('inventoryAPI: createLaboratoryInventory error', err)
    throw err
  }
}

export const updateLaboratoryInventory = async (id, payload) => {
  try {
    const response = await apiClient.patch(`/laboratoryInventory/${id}`, payload)
    return response.data ?? response
  } catch (err) {
    console.error('inventoryAPI: updateLaboratoryInventory error', err)
    throw err
  }
}

export const restockLaboratoryInventory = async (id, payload) => {
  try {
    const response = await apiClient.patch(`/laboratoryInventory/restockLaboratoryInventory/${id}`, payload)
    return response.data ?? response
  } catch (err) {
    console.error('inventoryAPI: restockLaboratoryInventory error', err)
    throw err
  }
}

export const getAllLaboratoryInventoryTransactions = async () => {
  try {
    const response = await apiClient.get('/laboratoryInventory/LaboratoryInventoryTransaction/transactions')
    return response.data ?? response
  } catch (err) {
    console.error('inventoryAPI: getAllLaboratoryInventoryTransactions error', err)
    throw err
  }
}

export const getlaboratoryInventoryTransaction = async (id) => {
  try {
    const response = await apiClient.get(`/laboratoryInventory/LaboratoryInventoryTransaction/transaction/${id}`)
    return response.data ?? response
  } catch (err) {
    console.error('inventoryAPI: getLaboratoryInventoryTransaction error', err)
    throw err
  }
}

export const deleteLaboratoryInventory = async (id) => {
  try {
    const response = await apiClient.delete(`/laboratoryInventory/${id}`)
    return response.data ?? response
  } catch (err) {
    console.error('inventoryAPI: deleteLaboratoryInventory error', err)
    throw err
  }
}
export default {
  getLaboratoryInventories,
  getLaboratoryInventory,
  createLaboratoryInventory,
  updateLaboratoryInventory,
  restockLaboratoryInventory,
  getAllLaboratoryInventoryTransactions,
  getlaboratoryInventoryTransaction,
  deleteLaboratoryInventory
}
