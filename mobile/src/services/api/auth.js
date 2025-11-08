import { apiClient } from './client'
import { handleApiCall } from '../../utils/apiErrorHandler'
import i18n from '../../i18n'

export const authService = {
  async googleLogin(googleToken) {
    return handleApiCall(
      () => apiClient.post('/auth/google', {
        google_token: googleToken,
        platform: 'mobile'
      }),
      {
        errorTitle: i18n.t('api.auth.loginError'),
        showSuccessToast: false, // Login success handled by screen
      }
    )
  },

  async getCurrentUser() {
    return handleApiCall(
      () => apiClient.get('/auth/me'),
      {
        errorTitle: i18n.t('api.auth.getUserError'),
        showSuccessToast: false,
      }
    )
  },

  async refreshToken(refreshToken) {
    return handleApiCall(
      () => apiClient.post('/auth/refresh', {
        refresh_token: refreshToken
      }),
      {
        errorTitle: i18n.t('api.auth.refreshError'),
        showSuccessToast: false,
      }
    )
  },

  async logout() {
    return handleApiCall(
      () => apiClient.post('/auth/logout'),
      {
        errorTitle: i18n.t('api.auth.logoutError'),
        successMessage: i18n.t('api.auth.logoutSuccess'),
        showSuccessToast: true,
      }
    )
  },

  async verifyToken() {
    return handleApiCall(
      () => apiClient.get('/auth/verify'),
      {
        errorTitle: i18n.t('api.auth.verifyError'),
        showSuccessToast: false,
      }
    )
  },

  async updateProfile(data) {
    return handleApiCall(
      () => apiClient.put('/auth/profile', data),
      {
        errorTitle: i18n.t('common.error'),
        successMessage: i18n.t('api.auth.updateProfileSuccess'),
        showSuccessToast: true,
      }
    )
  },

  async deleteAccount() {
    return handleApiCall(
      () => apiClient.delete('/auth/account'),
      {
        errorTitle: i18n.t('common.error'),
        successMessage: i18n.t('api.auth.deleteAccountSuccess'),
        showSuccessToast: true,
      }
    )
  }
}
