/**
 * Servicio de onboarding para mobile
 */
import { apiClient } from './client'
import { handleApiCall } from '../../utils/apiErrorHandler'

export const onboardingService = {
  async checkNickname(nickname) {
    return handleApiCall(
      () => apiClient.post('/onboarding/check-nickname', { nickname }),
      {
        errorTitle: 'Error al verificar nickname',
        showSuccessToast: false,
      }
    )
  },

  async submitStep1(data) {
    return handleApiCall(
      () => apiClient.post('/onboarding/step1', data),
      {
        errorTitle: 'Error en paso 1',
        successMessage: 'Paso 1 completado',
        showSuccessToast: true,
      }
    )
  },

  async submitStep2(data) {
    return handleApiCall(
      () => apiClient.post('/onboarding/step2', data),
      {
        errorTitle: 'Error en paso 2',
        successMessage: 'Paso 2 completado',
        showSuccessToast: true,
      }
    )
  },

  async submitStep3(data) {
    return handleApiCall(
      () => apiClient.post('/onboarding/step3', data),
      {
        errorTitle: 'Error en paso 3',
        successMessage: '¡Onboarding completado!',
        showSuccessToast: true,
      }
    )
  }
}







