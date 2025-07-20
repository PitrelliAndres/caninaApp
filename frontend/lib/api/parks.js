/**
 * Servicio de parques
 */
import { apiClient } from './client'

export const parkService = {
  async getParks(filters = {}) {
    return apiClient.get('/parks', filters)
  },

  async getNeighborhoods() {
    return apiClient.get('/parks/neighborhoods')
  },

  async getParkDetail(parkId) {
    return apiClient.get(`/parks/${parkId}`)
  },

  async getParkVisitors(parkId) {
    return apiClient.get(`/parks/${parkId}/visitors`)
  }
}
