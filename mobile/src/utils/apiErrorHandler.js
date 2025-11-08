/**
 * API Error Handler con Toast notifications
 * Helper genérico para manejar errores de API con mensajes al usuario
 * Todos los mensajes están internacionalizados
 */

import Toast from 'react-native-toast-message'
import i18n from '../i18n'

// Tipos de error predefinidos
export const ERROR_TYPES = {
  NETWORK: 'network',
  TIMEOUT: 'timeout',
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'forbidden',
  NOT_FOUND: 'not_found',
  SERVER_ERROR: 'server_error',
  VALIDATION: 'validation',
  UNKNOWN: 'unknown',
}

// Mensajes predefinidos por tipo de error (usando i18n)
const getErrorMessage = (errorType) => {
  const messages = {
    [ERROR_TYPES.NETWORK]: {
      title: i18n.t('errors.api.networkError'),
      message: i18n.t('errors.api.networkErrorMsg'),
    },
    [ERROR_TYPES.TIMEOUT]: {
      title: i18n.t('errors.api.timeout'),
      message: i18n.t('errors.api.timeoutMsg'),
    },
    [ERROR_TYPES.UNAUTHORIZED]: {
      title: i18n.t('errors.api.sessionExpired'),
      message: i18n.t('errors.api.sessionExpiredMsg'),
    },
    [ERROR_TYPES.FORBIDDEN]: {
      title: i18n.t('errors.api.forbidden'),
      message: i18n.t('errors.api.forbiddenMsg'),
    },
    [ERROR_TYPES.NOT_FOUND]: {
      title: i18n.t('errors.api.notFoundTitle'),
      message: i18n.t('errors.api.notFoundMsg'),
    },
    [ERROR_TYPES.SERVER_ERROR]: {
      title: i18n.t('errors.api.serverError'),
      message: i18n.t('errors.api.serverErrorMsg'),
    },
    [ERROR_TYPES.VALIDATION]: {
      title: i18n.t('errors.api.validationError'),
      message: i18n.t('errors.api.validationErrorMsg'),
    },
    [ERROR_TYPES.UNKNOWN]: {
      title: i18n.t('errors.api.unknownError'),
      message: i18n.t('errors.api.unknownErrorMsg'),
    },
  }

  return messages[errorType] || messages[ERROR_TYPES.UNKNOWN]
}

/**
 * Determina el tipo de error basado en el error recibido
 */
const getErrorType = (error) => {
  // Errores de red
  if (error.message?.toLowerCase().includes('network') ||
      error.message?.toLowerCase().includes('conexión') ||
      error.message?.toLowerCase().includes('conectar') ||
      error.message?.toLowerCase().includes('connection') ||
      error.message?.toLowerCase().includes('connect')) {
    return ERROR_TYPES.NETWORK
  }

  // Timeout
  if (error.message?.toLowerCase().includes('timeout')) {
    return ERROR_TYPES.TIMEOUT
  }

  // Por código de estado HTTP
  if (error.status === 401) return ERROR_TYPES.UNAUTHORIZED
  if (error.status === 403) return ERROR_TYPES.FORBIDDEN
  if (error.status === 404) return ERROR_TYPES.NOT_FOUND
  if (error.status === 400 || error.status === 422) return ERROR_TYPES.VALIDATION
  if (error.status >= 500) return ERROR_TYPES.SERVER_ERROR

  return ERROR_TYPES.UNKNOWN
}

/**
 * Método genérico para mostrar toasts
 * @param {string} type - Tipo de toast: 'success', 'error', 'info', 'warning'
 * @param {string} title - Título del toast
 * @param {string} message - Mensaje del toast
 * @param {number} duration - Duración en ms (opcional)
 */
export const showToast = (type, title, message, duration = 4000) => {
  Toast.show({
    type,
    text1: title,
    text2: message,
    visibilityTime: duration,
    position: 'top',
  })
}

/**
 * Wrapper para llamadas a API que maneja errores automáticamente
 * @param {Function} apiCall - Función async que hace la llamada a la API
 * @param {Object} options - Opciones de configuración
 * @param {string} options.errorTitle - Título personalizado para el toast de error
 * @param {string} options.errorMessage - Mensaje personalizado para el toast de error
 * @param {string} options.successTitle - Título para el toast de éxito
 * @param {string} options.successMessage - Mensaje de éxito opcional
 * @param {boolean} options.showSuccessToast - Mostrar toast de éxito (default: false)
 * @param {boolean} options.showErrorToast - Mostrar toast de error (default: true)
 * @param {Function} options.onError - Callback adicional para manejar error
 * @param {Function} options.onSuccess - Callback adicional para manejar éxito
 * @returns {Promise} - Resultado de la llamada a la API
 */
export const handleApiCall = async (apiCall, options = {}) => {
  const {
    errorTitle,
    errorMessage,
    successTitle = i18n.t('common.success'),
    successMessage = i18n.t('common.success'),
    showSuccessToast = false,
    showErrorToast: showErrorToastOption = true,
    onError,
    onSuccess,
  } = options

  try {
    const result = await apiCall()

    // Mostrar toast de éxito si está configurado
    if (showSuccessToast) {
      showToast('success', successTitle, successMessage)
    }

    // Callback de éxito personalizado
    if (onSuccess) {
      onSuccess(result)
    }

    return result
  } catch (error) {
    console.error('[ApiErrorHandler] Error:', error)

    // Determinar tipo de error
    const errorType = getErrorType(error)

    // Obtener mensaje predefinido o usar personalizado
    const predefinedError = getErrorMessage(errorType)
    const title = errorTitle || predefinedError.title
    let message = errorMessage || predefinedError.message

    // Si el backend envió un mensaje más específico, usarlo
    if (error.data?.message && !errorMessage) {
      message = error.data.message
    } else if (error.data?.error && !errorMessage) {
      message = error.data.error
    } else if (error.message && !errorMessage && errorType === ERROR_TYPES.UNKNOWN) {
      message = error.message
    }

    // Mostrar toast de error si está habilitado
    if (showErrorToastOption) {
      showToast('error', title, message)
    }

    // Callback de error personalizado
    if (onError) {
      onError(error, errorType)
    }

    // Re-lanzar el error para que el caller pueda manejarlo si es necesario
    throw error
  }
}

/**
 * Wrapper específico para operaciones de creación
 */
export const handleCreate = (apiCall, resourceName) => {
  return handleApiCall(apiCall, {
    errorTitle: i18n.t('common.error'),
    successMessage: i18n.t('common.success'),
    showSuccessToast: true,
  })
}

/**
 * Wrapper específico para operaciones de actualización
 */
export const handleUpdate = (apiCall, resourceName) => {
  return handleApiCall(apiCall, {
    errorTitle: i18n.t('common.error'),
    successMessage: i18n.t('common.success'),
    showSuccessToast: true,
  })
}

/**
 * Wrapper específico para operaciones de eliminación
 */
export const handleDelete = (apiCall, resourceName) => {
  return handleApiCall(apiCall, {
    errorTitle: i18n.t('common.error'),
    successMessage: i18n.t('common.success'),
    showSuccessToast: true,
  })
}

/**
 * Wrapper específico para operaciones de obtención/lectura
 * Por defecto no muestra toast de éxito
 */
export const handleFetch = (apiCall, resourceName) => {
  return handleApiCall(apiCall, {
    errorTitle: i18n.t('common.error'),
    showSuccessToast: false,
  })
}

/**
 * Mostrar toast de error manualmente
 */
export const showErrorToast = (title, message) => {
  Toast.show({
    type: 'error',
    text1: title,
    text2: message,
    visibilityTime: 4000,
  })
}

/**
 * Mostrar toast de éxito manualmente
 */
export const showSuccessToast = (title, message) => {
  Toast.show({
    type: 'success',
    text1: title,
    text2: message,
  })
}

/**
 * Mostrar toast de información manualmente
 */
export const showInfoToast = (title, message) => {
  Toast.show({
    type: 'info',
    text1: title,
    text2: message,
  })
}
