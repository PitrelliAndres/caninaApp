import { apiClient } from './client'

export const authService = {
  async googleLogin(googleToken) {
    return apiClient.post('/auth/google', { 
      google_token: googleToken,
      platform: 'mobile'
    })
  },

  async getCurrentUser() {
    return apiClient.get('/auth/me')
  },

  async refreshToken(refreshToken) {
    return apiClient.post('/auth/refresh', { 
      refresh_token: refreshToken 
    })
  },

  async logout() {
    return apiClient.post('/auth/logout')
  },

  async verifyToken() {
    return apiClient.get('/auth/verify')
  },

  async updateProfile(data) {
    return apiClient.put('/auth/profile', data)
  },

  async deleteAccount() {
    return apiClient.delete('/auth/account')
  }
}