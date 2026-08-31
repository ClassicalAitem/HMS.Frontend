import apiClient from './apiClient'

export const createWardRound = async (payload) => {
  try {
    const res = await apiClient.post('/wardRound', payload)
    return res.data ?? res
  } catch (err) {
    console.error('wardRoundApi: createWardRound error', err)
    throw err
  }
}

export const getWardRoundRelatedByConsultation = async (consultationId) => {
  try {
    const res = await apiClient.get(`/wardRound/consultation/${consultationId}/related`)
    return res.data ?? res
  } catch (err) {
    console.error('wardRoundApi: getWardRoundRelatedByConsultation error', err)
    throw err
  }
}

export const getAllWardRounds = async () => {
  try {
    const res = await apiClient.get('/wardRound')
    return res.data ?? res
  } catch (err) {
    console.error('wardRoundApi: getAllWardRounds error', err)
    throw err
  }
}

export default {
  createWardRound,
  getWardRoundRelatedByConsultation,
  getAllWardRounds,
}
