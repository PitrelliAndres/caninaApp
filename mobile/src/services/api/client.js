import Config from '../../config/Config'
import { secureStorage } from '../storage/secureStorage'

const API_URL = Config.API_URL
const WS_URL = Config.WS_URL

// Configuración de API móvil inicializada

// Device details disponibles para debugging si es necesario

class ApiClient {
  constructor() {
    this.baseURL = API_URL
    this.wsURL = WS_URL
    this.isRefreshing = false
    this.refreshSubscribers = []
  }

  async getAuthHeaders() {
    const token = await secureStorage.getItemAsync('jwt_token')
    return token ? { 'Authorization': `Bearer ${token}` } : {}
  }

  // Manejar cola de requests durante refresh
  subscribeTokenRefresh(cb) {
    this.refreshSubscribers.push(cb)
  }

  onTokenRefreshed(token) {
    this.refreshSubscribers.forEach(cb => cb(token))
    this.refreshSubscribers = []
  }

  async refreshAccessToken() {
    try {
      const refreshToken = await secureStorage.getItemAsync('refresh_token')
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh_token: refreshToken })
      })

      if (!response.ok) {
        throw new Error('Failed to refresh token')
      }

      const data = await response.json()

      if (data.jwt) {
        await secureStorage.setItemAsync('jwt_token', data.jwt)
        if (data.tokens?.refresh_token) {
          await secureStorage.setItemAsync('refresh_token', data.tokens.refresh_token)
        }
        // Store realtime token for WebSocket connections
        if (data.tokens?.realtime_token) {
          await secureStorage.setItemAsync('realtime_token', data.tokens.realtime_token)
        }
        return data.jwt
      }

      throw new Error('No token in refresh response')
    } catch (error) {
      // Si falla el refresh, limpiar tokens
      await secureStorage.deleteItemAsync('jwt_token')
      await secureStorage.deleteItemAsync('refresh_token')
      await secureStorage.deleteItemAsync('realtime_token')
      throw error
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const authHeaders = await this.getAuthHeaders()

    // Log request
    console.log(`[API] ${options.method || 'GET'} ${endpoint}`, {
      headers: options.headers,
      body: options.body ? JSON.parse(options.body) : undefined
    })

    const makeRequest = async (token = null) => {
      const config = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : authHeaders),
          ...options.headers,
        },
      }

      let response
      try {
        response = await fetch(url, config)
      } catch (networkError) {
        console.error(`[API] Network Error on ${endpoint}:`, networkError)
        throw new Error('No se pudo conectar al servidor. Verifica tu conexión a internet.')
      }

      // Manejar respuesta vacía
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        console.log(`[API] ${response.status} ${endpoint} - No content`)
        return { success: true }
      }

      const text = await response.text()
      let data
      try {
        data = text ? JSON.parse(text) : {}
      } catch (parseError) {
        console.error(`[API] Failed to parse response for ${endpoint}:`, text)
        throw new Error('Respuesta inválida del servidor')
      }

      // Log response
      console.log(`[API] ${response.status} ${endpoint}`, data)

      return { response, data }
    }

    try {
      const { response, data } = await makeRequest()

      if (!response.ok) {
        // Token expirado, intentar refresh
        if (response.status === 401) {
          console.log('[API] 401 Unauthorized - Attempting token refresh')
          const refreshToken = await secureStorage.getItemAsync('refresh_token')
          if (refreshToken) {
            // Si ya estamos refreshing, esperar
            if (this.isRefreshing) {
              return new Promise((resolve, reject) => {
                this.subscribeTokenRefresh((token) => {
                  makeRequest(token)
                    .then(({ response, data }) => {
                      if (!response.ok) {
                        reject(new Error(data.error || data.message || `HTTP error! status: ${response.status}`))
                      } else {
                        resolve(data)
                      }
                    })
                    .catch(reject)
                })
              })
            }

            // Iniciar refresh
            this.isRefreshing = true

            try {
              const newToken = await this.refreshAccessToken()
              console.log('[API] Token refreshed successfully')
              this.isRefreshing = false
              this.onTokenRefreshed(newToken)

              // Reintentar request original
              const { response: retryResponse, data: retryData } = await makeRequest(newToken)

              if (!retryResponse.ok) {
                throw new Error(retryData.error || retryData.message || `HTTP error! status: ${retryResponse.status}`)
              }

              return retryData
            } catch (error) {
              console.error('[API] Token refresh failed:', error)
              this.isRefreshing = false
              throw error
            }
          }
        }

        // Crear mensaje de error descriptivo basado en el código de estado
        let errorMessage = data.error || data.message || `Error del servidor (${response.status})`

        if (response.status === 400) {
          errorMessage = data.error || 'Solicitud inválida'
        } else if (response.status === 403) {
          errorMessage = 'No tienes permisos para realizar esta acción'
        } else if (response.status === 404) {
          errorMessage = 'Recurso no encontrado'
        } else if (response.status === 500) {
          errorMessage = 'Error interno del servidor'
        }

        const error = new Error(errorMessage)
        error.status = response.status
        error.data = data
        throw error
      }

      return data
    } catch (error) {
      console.error(`[API] Error on ${endpoint}:`, {
        message: error.message,
        status: error.status,
        data: error.data
      })
      throw error
    }
  }

  get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `${endpoint}?${queryString}` : endpoint
    return this.request(url, { method: 'GET' })
  }

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' })
  }
}

export const apiClient = new ApiClient()
export { API_URL, WS_URL }
