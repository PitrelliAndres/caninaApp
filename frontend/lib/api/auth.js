/**
 * Servicio de autenticación
 */
import { apiClient } from './client'

export const authService = {
  async googleLogin(googleToken) {
    const response = await apiClient.post('/auth/google', {
      google_token: googleToken
    })
    
    // Guardar tokens
    if (response.jwt) {
      localStorage.setItem('jwt_token', response.jwt)
      if (response.tokens?.refresh_token) {
        localStorage.setItem('refresh_token', response.tokens.refresh_token)
      }
    }
    
    return response
  },

  async getCurrentUser() {
    return apiClient.get('/auth/me')
  },

  async refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) throw new Error('No refresh token')
    
    const response = await apiClient.post('/auth/refresh', {
      refresh_token: refreshToken
    })
    
    if (response.jwt) {
      localStorage.setItem('jwt_token', response.jwt)
      if (response.tokens?.refresh_token) {
        localStorage.setItem('refresh_token', response.tokens.refresh_token)
      }
    }
    
    return response
  },

  logout() {
    localStorage.removeItem('jwt_token')
    localStorage.removeItem('refresh_token')
    return apiClient.post('/auth/logout').catch(() => {})
  }
}
