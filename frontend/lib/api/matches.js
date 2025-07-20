/**
 * Servicio de matches
 */
import { apiClient } from './client'

export const matchService = {
  async getSuggestions() {
    return apiClient.get('/matches/suggestions')
  },

  async createMatch(targetUserId, action) {
    return apiClient.post('/matches', {
      target_user_id: targetUserId,
      action: action // 'like' or 'pass'
    })
  },

  async getMutualMatches() {
    return apiClient.get('/matches/mutual')
  },

  async unmatch(matchId) {
    return apiClient.delete(`/matches/${matchId}`)
  }
}
