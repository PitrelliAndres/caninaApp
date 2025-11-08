import { apiClient } from './client'
import { handleApiCall, handleFetch, handleCreate, handleUpdate, handleDelete } from '../../utils/apiErrorHandler'

export const visitService = {
  async getVisits(params = {}) {
    return handleFetch(
      () => apiClient.get('/visits', params),
      'visitas'
    )
  },

  async getVisit(visitId) {
    return handleFetch(
      () => apiClient.get(`/visits/${visitId}`),
      'visita'
    )
  },

  async createVisit(visitData) {
    return handleCreate(
      () => apiClient.post('/visits', visitData),
      'visita'
    )
  },

  async updateVisit(visitId, visitData) {
    return handleUpdate(
      () => apiClient.put(`/visits/${visitId}`, visitData),
      'visita'
    )
  },

  async deleteVisit(visitId) {
    return handleDelete(
      () => apiClient.delete(`/visits/${visitId}`),
      'visita'
    )
  },

  async getUserVisits(userId) {
    return handleFetch(
      () => apiClient.get(`/users/${userId}/visits`),
      'visitas del usuario'
    )
  },

  async getParkVisits(parkId) {
    return handleFetch(
      () => apiClient.get(`/parks/${parkId}/visits`),
      'visitas del parque'
    )
  },

  async getUpcomingVisits() {
    return handleFetch(
      () => apiClient.get('/visits/upcoming'),
      'visitas próximas'
    )
  },

  async getPastVisits() {
    return handleFetch(
      () => apiClient.get('/visits/past'),
      'visitas pasadas'
    )
  },

  async checkInVisit(visitId) {
    return handleApiCall(
      () => apiClient.post(`/visits/${visitId}/checkin`),
      {
        errorTitle: 'Error al registrar entrada',
        successMessage: 'Entrada registrada exitosamente',
        showSuccessToast: true,
      }
    )
  },

  async checkOutVisit(visitId) {
    return handleApiCall(
      () => apiClient.post(`/visits/${visitId}/checkout`),
      {
        errorTitle: 'Error al registrar salida',
        successMessage: 'Salida registrada exitosamente',
        showSuccessToast: true,
      }
    )
  },

  async inviteToVisit(visitId, userId) {
    return handleApiCall(
      () => apiClient.post(`/visits/${visitId}/invite`, { user_id: userId }),
      {
        errorTitle: 'Error al enviar invitación',
        successMessage: 'Invitación enviada',
        showSuccessToast: true,
      }
    )
  },

  async respondToInvite(visitId, response) {
    return handleApiCall(
      () => apiClient.post(`/visits/${visitId}/respond`, { response }),
      {
        errorTitle: 'Error al responder invitación',
        successMessage: response === 'accept' ? 'Invitación aceptada' : 'Invitación rechazada',
        showSuccessToast: true,
      }
    )
  },

  async getVisitAttendees(visitId) {
    return handleFetch(
      () => apiClient.get(`/visits/${visitId}/attendees`),
      'asistentes'
    )
  },

  async leaveVisit(visitId) {
    return handleApiCall(
      () => apiClient.post(`/visits/${visitId}/leave`),
      {
        errorTitle: 'Error al salir de la visita',
        successMessage: 'Has salido de la visita',
        showSuccessToast: true,
      }
    )
  }
}
