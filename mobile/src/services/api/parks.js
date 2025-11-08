import { apiClient } from './client'
import { handleApiCall, handleFetch, handleCreate, handleUpdate, handleDelete } from '../../utils/apiErrorHandler'

export const parkService = {
  async getParks(params = {}) {
    return handleFetch(
      () => apiClient.get('/parks', params),
      'parques'
    )
  },

  async getPark(parkId) {
    return handleFetch(
      () => apiClient.get(`/parks/${parkId}`),
      'parque'
    )
  },

  async searchParks(query, filters = {}) {
    return handleFetch(
      () => apiClient.get('/parks/search', { q: query, ...filters }),
      'parques'
    )
  },

  async getNearbyParks(latitude, longitude, radius = 5000) {
    return handleFetch(
      () => apiClient.get('/parks/nearby', {
        lat: latitude,
        lng: longitude,
        radius
      }),
      'parques cercanos'
    )
  },

  async getParkVisits(parkId) {
    return handleFetch(
      () => apiClient.get(`/parks/${parkId}/visits`),
      'visitas del parque'
    )
  },

  async getParkReviews(parkId) {
    return handleFetch(
      () => apiClient.get(`/parks/${parkId}/reviews`),
      'reseñas del parque'
    )
  },

  async addParkReview(parkId, reviewData) {
    return handleCreate(
      () => apiClient.post(`/parks/${parkId}/reviews`, reviewData),
      'reseña'
    )
  },

  async updateParkReview(parkId, reviewId, reviewData) {
    return handleUpdate(
      () => apiClient.put(`/parks/${parkId}/reviews/${reviewId}`, reviewData),
      'reseña'
    )
  },

  async deleteParkReview(parkId, reviewId) {
    return handleDelete(
      () => apiClient.delete(`/parks/${parkId}/reviews/${reviewId}`),
      'reseña'
    )
  },

  async reportPark(parkId, reason) {
    return handleApiCall(
      () => apiClient.post(`/parks/${parkId}/report`, { reason }),
      {
        errorTitle: 'Error al reportar parque',
        successMessage: 'Parque reportado exitosamente',
        showSuccessToast: true,
      }
    )
  },

  async favoritePark(parkId) {
    return handleApiCall(
      () => apiClient.post(`/parks/${parkId}/favorite`),
      {
        errorTitle: 'Error al agregar favorito',
        successMessage: 'Parque agregado a favoritos',
        showSuccessToast: true,
      }
    )
  },

  async unfavoritePark(parkId) {
    return handleApiCall(
      () => apiClient.delete(`/parks/${parkId}/favorite`),
      {
        errorTitle: 'Error al quitar favorito',
        successMessage: 'Parque removido de favoritos',
        showSuccessToast: true,
      }
    )
  },

  async getFavoriteParks() {
    return handleFetch(
      () => apiClient.get('/parks/favorites'),
      'parques favoritos'
    )
  }
}
