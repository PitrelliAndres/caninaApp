/**
 * Servicio de onboarding para mobile
 */
import { apiClient } from './client'

export const onboardingService = {
  async checkNickname(nickname) {
    return apiClient.post('/onboarding/check-nickname', { nickname })
  },

  async submitStep1(data) {
    return apiClient.post('/onboarding/step1', data)
  },

  async submitStep2(data) {
    return apiClient.post('/onboarding/step2', data)
  },

  async submitStep3(data) {
    return apiClient.post('/onboarding/step3', data)
  }
}

