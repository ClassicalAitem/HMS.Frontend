import apiClient from './apiClient'

export const getInventories = async () => {
  try {
    const response = await apiClient.get('/inventory')
    return response.data ?? response
  } catch (err) {
    console.error('inventoryAPI: getInventories error', err)
    throw err
  }
}

export const getInventory = async (id) => {
  try {
    const response = await apiClient.get(`/inventory/${id}`)
    return response.data ?? response
  } catch (err) {
    console.error('inventoryAPI: getInventory error', err)
    throw err
  }
}

export const createInventory = async (payload) => {
  try {
    const response = await apiClient.post('/inventory', payload)
    return response.data ?? response
  } catch (err) {
    console.error('inventoryAPI: createInventory error', err)
    throw err
  }
}

export const updateInventory = async (id, payload) => {
  try {
    const response = await apiClient.patch(`/inventory/${id}`, payload)
    return response.data ?? response
  } catch (err) {
    console.error('inventoryAPI: updateInventory error', err)
    throw err
  }
}

export const restockInventory = async (id, payload) => {
  try {
    const response = await apiClient.patch(`/inventory/restockInventory/${id}`, payload)
    return response.data ?? response
  } catch (err) {
    console.error('inventoryAPI: restockInventory error', err)
    throw err
  }
}

export const getAllInventoryTransactions = async () => {
  try {
    const response = await apiClient.get('/inventory/InventoryTransaction/transactions')
    return response.data ?? response
  } catch (err) {
    console.error('inventoryAPI: getAllInventoryTransactions error', err)
    throw err
  }
}

export const getInventoryTransaction = async (id) => {
  try {
    const response = await apiClient.get(`/inventory/InventoryTransaction/transaction/${id}`)
    return response.data ?? response
  } catch (err) {
    console.error('inventoryAPI: getInventoryTransaction error', err)
    throw err
  }
}

export default {
  getInventories,
  getInventory,
  createInventory,
  updateInventory,
  restockInventory,
  getAllInventoryTransactions,
  getInventoryTransaction
}
