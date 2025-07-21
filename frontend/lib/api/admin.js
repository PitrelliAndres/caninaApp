/**
 * Servicio de administración
 */
import { apiClient } from './client'

export const adminService = {
  async getDashboardStats() {
    return apiClient.get('/admin/dashboard')
  },

  async getUsers(params = {}) {
    return apiClient.get('/admin/users', params)
  },

  async updateUserRole(userId, role) {
    return apiClient.patch(`/admin/users/${userId}/role`, { role })
  },

  async banUser(userId, action = 'ban', reason = '') {
    return apiClient.post(`/admin/users/${userId}/ban`, { action, reason })
  },

  async createPark(data) {
    return apiClient.post('/admin/parks', data)
  },

  async updatePark(parkId, data) {
    return apiClient.put(`/admin/parks/${parkId}`, data)
  },

  async getReports(params = {}) {
    return apiClient.get('/admin/reports', params)
  }
}
