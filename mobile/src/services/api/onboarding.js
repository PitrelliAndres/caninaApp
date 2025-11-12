/**
 * Servicio de onboarding para mobile - 10 pasos
 */
import { apiClient } from './client'
import { handleApiCall } from '../../utils/apiErrorHandler'

export const onboardingService = {
  /**
   * Verificar disponibilidad de nickname
   * @deprecated - Ya no se usa nickname en el nuevo onboarding
   */
  async checkNickname(nickname) {
    return handleApiCall(
      () => apiClient.post('/onboarding/check-nickname', { nickname }),
      {
        errorTitle: 'Error al verificar nickname',
        showSuccessToast: false,
      }
    )
  },

  /**
   * Guardar un paso del onboarding
   * @param {string} stepId - ID del paso (ONB_NAME, ONB_BIRTHDATE, etc.)
   * @param {object} data - Datos del paso
   */
  async saveStep(stepId, data) {
    return handleApiCall(
      () => apiClient.post('/onboarding/step', {
        stepId,
        data,
        clientTimestamp: new Date().toISOString()
      }),
      {
        errorTitle: `Error en ${stepId}`,
        showSuccessToast: false,
      }
    )
  },

  /**
   * Completar el onboarding
   */
  async completeOnboarding() {
    return handleApiCall(
      () => apiClient.post('/onboarding/complete'),
      {
        errorTitle: 'Error al completar onboarding',
        successMessage: '¡Perfil completado exitosamente!',
        showSuccessToast: true,
      }
    )
  },

  /**
   * Obtener progreso del onboarding
   */
  async getProgress() {
    return handleApiCall(
      () => apiClient.get('/onboarding/progress'),
      {
        errorTitle: 'Error al obtener progreso',
        showSuccessToast: false,
      }
    )
  },

  /**
   * Saltar onboarding (solo development)
   */
  async skipOnboarding() {
    return handleApiCall(
      () => apiClient.post('/onboarding/skip'),
      {
        errorTitle: 'Error al saltar onboarding',
        showSuccessToast: false,
      }
    )
  },

  // Métodos legacy (deprecados pero mantenidos por compatibilidad)
  async submitStep1(data) {
    return this.saveStep('ONB_NAME', { name: data.name })
  },

  async submitStep2(data) {
    return this.saveStep('ONB_BIRTHDATE', data)
  },

  async submitStep3(data) {
    return this.saveStep('ONB_GENDER', data)
  }
}







