/**
 * Servicio de usuarios
 */
import { apiClient } from './client'

export const userService = {
  async getProfile() {
    return apiClient.get('/users/me')
  },

  async updateProfile(userId, data) {
    return apiClient.put(`/users/${userId}`, data)
  },

  async updateDog(dogId, data) {
    return apiClient.put(`/users/dogs/${dogId}`, data)
  },

  async updatePreferences(userId, data) {
    return apiClient.put(`/users/preferences/${userId}`, data)
  },

  async deleteAccount(userId) {
    return apiClient.delete(`/users/${userId}`)
  }
}
