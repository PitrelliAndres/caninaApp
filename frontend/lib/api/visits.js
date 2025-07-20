/**
 * Servicio de visitas
 */
import { apiClient } from './client'

export const visitService = {
  async getMyVisits(type = 'all') {
    return apiClient.get('/visits', { type })
  },

  async createVisit(data) {
    return apiClient.post('/visits', data)
  },

  async cancelVisit(visitId) {
    return apiClient.delete(`/visits/${visitId}`)
  },

  async checkinVisit(visitId, location = {}) {
    return apiClient.post(`/visits/${visitId}/checkin`, location)
  },

  async checkoutVisit(visitId) {
    return apiClient.post(`/visits/${visitId}/checkout`)
  }
}
