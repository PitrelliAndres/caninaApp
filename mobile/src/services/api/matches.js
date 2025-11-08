import { apiClient } from './client'
import { handleApiCall, handleFetch, handleUpdate, handleDelete } from '../../utils/apiErrorHandler'

export const matchService = {
  async getMatches(params = {}) {
    return handleFetch(
      () => apiClient.get('/matches', params),
      'matches'
    )
  },

  async getMatch(matchId) {
    return handleFetch(
      () => apiClient.get(`/matches/${matchId}`),
      'match'
    )
  },

  async getPotentialMatches() {
    return handleFetch(
      () => apiClient.get('/matches/discover'),
      'matches sugeridos'
    )
  },

  async likeUser(userId) {
    return handleApiCall(
      () => apiClient.post('/matches/like', { user_id: userId }),
      {
        errorTitle: 'Error al dar like',
        successMessage: '¡Match enviado!',
        showSuccessToast: true,
      }
    )
  },

  async passUser(userId) {
    return handleApiCall(
      () => apiClient.post('/matches/pass', { user_id: userId }),
      {
        errorTitle: 'Error al pasar',
        showSuccessToast: false,
      }
    )
  },

  async unmatch(matchId) {
    return handleDelete(
      () => apiClient.delete(`/matches/${matchId}`),
      'match'
    )
  },

  async getMatchRequests() {
    return handleFetch(
      () => apiClient.get('/matches/requests'),
      'solicitudes de match'
    )
  },

  async acceptMatchRequest(requestId) {
    return handleApiCall(
      () => apiClient.post(`/matches/requests/${requestId}/accept`),
      {
        errorTitle: 'Error al aceptar solicitud',
        successMessage: '¡Match aceptado!',
        showSuccessToast: true,
      }
    )
  },

  async rejectMatchRequest(requestId) {
    return handleApiCall(
      () => apiClient.post(`/matches/requests/${requestId}/reject`),
      {
        errorTitle: 'Error al rechazar solicitud',
        successMessage: 'Solicitud rechazada',
        showSuccessToast: true,
      }
    )
  },

  async getMatchHistory() {
    return handleFetch(
      () => apiClient.get('/matches/history'),
      'historial de matches'
    )
  },

  async reportMatch(matchId, reason) {
    return handleApiCall(
      () => apiClient.post(`/matches/${matchId}/report`, { reason }),
      {
        errorTitle: 'Error al reportar',
        successMessage: 'Match reportado exitosamente',
        showSuccessToast: true,
      }
    )
  },

  async getMatchPreferences() {
    return handleFetch(
      () => apiClient.get('/matches/preferences'),
      'preferencias de match'
    )
  },

  async updateMatchPreferences(preferences) {
    return handleUpdate(
      () => apiClient.put('/matches/preferences', preferences),
      'preferencias'
    )
  },

  async getSuggestedMatches() {
    return handleFetch(
      () => apiClient.get('/matches/suggestions'),
      'sugerencias'
    )
  },

  async createMatch(userId, action) {
    return handleApiCall(
      () => apiClient.post('/matches', { user_id: userId, action }),
      {
        errorTitle: 'Error al crear match',
        successMessage: 'Match creado',
        showSuccessToast: true,
      }
    )
  }
}
