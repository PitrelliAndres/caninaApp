import { apiClient } from './client'

export const matchService = {
  async getMatches(params = {}) {
    return apiClient.get('/matches', params)
  },

  async getMatch(matchId) {
    return apiClient.get(`/matches/${matchId}`)
  },

  async getPotentialMatches() {
    return apiClient.get('/matches/discover')
  },

  async likeUser(userId) {
    return apiClient.post('/matches/like', { user_id: userId })
  },

  async passUser(userId) {
    return apiClient.post('/matches/pass', { user_id: userId })
  },

  async unmatch(matchId) {
    return apiClient.delete(`/matches/${matchId}`)
  },

  async getMatchRequests() {
    return apiClient.get('/matches/requests')
  },

  async acceptMatchRequest(requestId) {
    return apiClient.post(`/matches/requests/${requestId}/accept`)
  },

  async rejectMatchRequest(requestId) {
    return apiClient.post(`/matches/requests/${requestId}/reject`)
  },

  async getMatchHistory() {
    return apiClient.get('/matches/history')
  },

  async reportMatch(matchId, reason) {
    return apiClient.post(`/matches/${matchId}/report`, { reason })
  },

  async getMatchPreferences() {
    return apiClient.get('/matches/preferences')
  },

  async updateMatchPreferences(preferences) {
    return apiClient.put('/matches/preferences', preferences)
  },

  async getSuggestedMatches() {
    return apiClient.get('/matches/suggestions')
  },

  async createMatch(userId, action) {
    return apiClient.post('/matches', { user_id: userId, action })
  }
}