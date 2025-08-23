import { apiClient } from './client'

export const parkService = {
  async getParks(params = {}) {
    return apiClient.get('/parks', params)
  },

  async getPark(parkId) {
    return apiClient.get(`/parks/${parkId}`)
  },

  async searchParks(query, filters = {}) {
    return apiClient.get('/parks/search', { q: query, ...filters })
  },

  async getNearbyParks(latitude, longitude, radius = 5000) {
    return apiClient.get('/parks/nearby', {
      lat: latitude,
      lng: longitude,
      radius
    })
  },

  async getParkVisits(parkId) {
    return apiClient.get(`/parks/${parkId}/visits`)
  },

  async getParkReviews(parkId) {
    return apiClient.get(`/parks/${parkId}/reviews`)
  },

  async addParkReview(parkId, reviewData) {
    return apiClient.post(`/parks/${parkId}/reviews`, reviewData)
  },

  async updateParkReview(parkId, reviewId, reviewData) {
    return apiClient.put(`/parks/${parkId}/reviews/${reviewId}`, reviewData)
  },

  async deleteParkReview(parkId, reviewId) {
    return apiClient.delete(`/parks/${parkId}/reviews/${reviewId}`)
  },

  async reportPark(parkId, reason) {
    return apiClient.post(`/parks/${parkId}/report`, { reason })
  },

  async favoritePark(parkId) {
    return apiClient.post(`/parks/${parkId}/favorite`)
  },

  async unfavoritePark(parkId) {
    return apiClient.delete(`/parks/${parkId}/favorite`)
  },

  async getFavoriteParks() {
    return apiClient.get('/parks/favorites')
  }
}