import { apiClient } from './client'

export const userService = {
  async getUser(userId) {
    return apiClient.get(`/users/${userId}`)
  },

  async updateProfile(userId, data) {
    return apiClient.put(`/users/${userId}`, data)
  },

  async uploadAvatar(userId, imageUri) {
    const formData = new FormData()
    formData.append('avatar', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'avatar.jpg'
    })

    return apiClient.request(`/users/${userId}/avatar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      body: formData
    })
  },

  async getDogs(userId) {
    return apiClient.get(`/users/${userId}/dogs`)
  },

  async addDog(userId, dogData) {
    return apiClient.post(`/users/${userId}/dogs`, dogData)
  },

  async updateDog(userId, dogId, dogData) {
    return apiClient.put(`/users/${userId}/dogs/${dogId}`, dogData)
  },

  async deleteDog(userId, dogId) {
    return apiClient.delete(`/users/${userId}/dogs/${dogId}`)
  },

  async getUserMatches(userId) {
    return apiClient.get(`/users/${userId}/matches`)
  },

  async getUserVisits(userId) {
    return apiClient.get(`/users/${userId}/visits`)
  },

  async getUserPreferences(userId) {
    return apiClient.get(`/users/${userId}/preferences`)
  },

  async updatePreferences(userId, preferences) {
    return apiClient.put(`/users/${userId}/preferences`, preferences)
  },

  async blockUser(userId, blockedUserId) {
    return apiClient.post(`/users/${userId}/block`, { blocked_user_id: blockedUserId })
  },

  async unblockUser(userId, blockedUserId) {
    return apiClient.delete(`/users/${userId}/block/${blockedUserId}`)
  },

  async getBlockedUsers(userId) {
    return apiClient.get(`/users/${userId}/blocked`)
  },

  async searchUsers(query, filters = {}) {
    return apiClient.get('/users/search', { q: query, ...filters })
  }
}