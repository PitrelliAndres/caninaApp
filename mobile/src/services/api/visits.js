import { apiClient } from './client'

export const visitService = {
  async getVisits(params = {}) {
    return apiClient.get('/visits', params)
  },

  async getVisit(visitId) {
    return apiClient.get(`/visits/${visitId}`)
  },

  async createVisit(visitData) {
    return apiClient.post('/visits', visitData)
  },

  async updateVisit(visitId, visitData) {
    return apiClient.put(`/visits/${visitId}`, visitData)
  },

  async deleteVisit(visitId) {
    return apiClient.delete(`/visits/${visitId}`)
  },

  async getUserVisits(userId) {
    return apiClient.get(`/users/${userId}/visits`)
  },

  async getParkVisits(parkId) {
    return apiClient.get(`/parks/${parkId}/visits`)
  },

  async getUpcomingVisits() {
    return apiClient.get('/visits/upcoming')
  },

  async getPastVisits() {
    return apiClient.get('/visits/past')
  },

  async checkInVisit(visitId) {
    return apiClient.post(`/visits/${visitId}/checkin`)
  },

  async checkOutVisit(visitId) {
    return apiClient.post(`/visits/${visitId}/checkout`)
  },

  async inviteToVisit(visitId, userId) {
    return apiClient.post(`/visits/${visitId}/invite`, { user_id: userId })
  },

  async respondToInvite(visitId, response) {
    return apiClient.post(`/visits/${visitId}/respond`, { response })
  },

  async getVisitAttendees(visitId) {
    return apiClient.get(`/visits/${visitId}/attendees`)
  },

  async leaveVisit(visitId) {
    return apiClient.post(`/visits/${visitId}/leave`)
  }
}