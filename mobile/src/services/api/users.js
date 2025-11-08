import { apiClient } from './client'
import { handleApiCall, handleFetch, handleCreate, handleUpdate, handleDelete } from '../../utils/apiErrorHandler'

export const userService = {
  async getUser(userId) {
    return handleFetch(
      () => apiClient.get(`/users/${userId}`),
      'usuario'
    )
  },

  async updateProfile(userId, data) {
    return handleUpdate(
      () => apiClient.put(`/users/${userId}`, data),
      'perfil'
    )
  },

  async uploadAvatar(userId, imageUri) {
    const formData = new FormData()
    formData.append('avatar', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'avatar.jpg'
    })

    return handleApiCall(
      () => apiClient.request(`/users/${userId}/avatar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        body: formData
      }),
      {
        errorTitle: 'Error al subir foto',
        successMessage: 'Foto de perfil actualizada',
        showSuccessToast: true,
      }
    )
  },

  async getDogs(userId) {
    return handleFetch(
      () => apiClient.get(`/users/${userId}/dogs`),
      'perros'
    )
  },

  async addDog(userId, dogData) {
    return handleCreate(
      () => apiClient.post(`/users/${userId}/dogs`, dogData),
      'perro'
    )
  },

  async updateDog(userId, dogId, dogData) {
    return handleUpdate(
      () => apiClient.put(`/users/${userId}/dogs/${dogId}`, dogData),
      'perro'
    )
  },

  async deleteDog(userId, dogId) {
    return handleDelete(
      () => apiClient.delete(`/users/${userId}/dogs/${dogId}`),
      'perro'
    )
  },

  async getUserMatches(userId) {
    return handleFetch(
      () => apiClient.get(`/users/${userId}/matches`),
      'matches del usuario'
    )
  },

  async getUserVisits(userId) {
    return handleFetch(
      () => apiClient.get(`/users/${userId}/visits`),
      'visitas del usuario'
    )
  },

  async getUserPreferences(userId) {
    return handleFetch(
      () => apiClient.get(`/users/${userId}/preferences`),
      'preferencias'
    )
  },

  async updatePreferences(userId, preferences) {
    return handleUpdate(
      () => apiClient.put(`/users/${userId}/preferences`, preferences),
      'preferencias'
    )
  },

  async blockUser(userId, blockedUserId) {
    return handleApiCall(
      () => apiClient.post(`/users/${userId}/block`, { blocked_user_id: blockedUserId }),
      {
        errorTitle: 'Error al bloquear usuario',
        successMessage: 'Usuario bloqueado',
        showSuccessToast: true,
      }
    )
  },

  async unblockUser(userId, blockedUserId) {
    return handleApiCall(
      () => apiClient.delete(`/users/${userId}/block/${blockedUserId}`),
      {
        errorTitle: 'Error al desbloquear usuario',
        successMessage: 'Usuario desbloqueado',
        showSuccessToast: true,
      }
    )
  },

  async getBlockedUsers(userId) {
    return handleFetch(
      () => apiClient.get(`/users/${userId}/blocked`),
      'usuarios bloqueados'
    )
  },

  async searchUsers(query, filters = {}) {
    return handleFetch(
      () => apiClient.get('/users/search', { q: query, ...filters }),
      'usuarios'
    )
  }
}
