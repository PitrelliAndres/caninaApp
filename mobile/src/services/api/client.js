import * as SecureStore from 'expo-secure-store'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api'
const WS_URL = process.env.EXPO_PUBLIC_WS_URL || 'http://localhost:5000'

class ApiClient {
  constructor() {
    this.baseURL = API_URL
    this.wsURL = WS_URL
    this.isRefreshing = false
    this.refreshSubscribers = []
  }

  async getAuthHeaders() {
    const token = await SecureStore.getItemAsync('jwt_token')
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
      const refreshToken = await SecureStore.getItemAsync('refresh_token')
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
        await SecureStore.setItemAsync('jwt_token', data.jwt)
        if (data.tokens?.refresh_token) {
          await SecureStore.setItemAsync('refresh_token', data.tokens.refresh_token)
        }
        return data.jwt
      }
      
      throw new Error('No token in refresh response')
    } catch (error) {
      // Si falla el refresh, limpiar tokens
      await SecureStore.deleteItemAsync('jwt_token')
      await SecureStore.deleteItemAsync('refresh_token')
      throw error
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const authHeaders = await this.getAuthHeaders()
    
    const makeRequest = async (token = null) => {
      const config = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : authHeaders),
          ...options.headers,
        },
      }

      const response = await fetch(url, config)
      
      // Manejar respuesta vacía
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return { success: true }
      }
      
      const text = await response.text()
      const data = text ? JSON.parse(text) : {}
      
      return { response, data }
    }

    try {
      const { response, data } = await makeRequest()
      
      if (!response.ok) {
        // Token expirado, intentar refresh
        if (response.status === 401) {
          const refreshToken = await SecureStore.getItemAsync('refresh_token')
          if (refreshToken) {
            // Si ya estamos refreshing, esperar
            if (this.isRefreshing) {
              return new Promise((resolve, reject) => {
                this.subscribeTokenRefresh((token) => {
                  makeRequest(token)
                    .then(({ response, data }) => {
                      if (!response.ok) {
                        reject(new Error(data.error || `HTTP error! status: ${response.status}`))
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
              this.isRefreshing = false
              this.onTokenRefreshed(newToken)
              
              // Reintentar request original
              const { response: retryResponse, data: retryData } = await makeRequest(newToken)
              
              if (!retryResponse.ok) {
                throw new Error(retryData.error || `HTTP error! status: ${retryResponse.status}`)
              }
              
              return retryData
            } catch (error) {
              this.isRefreshing = false
              throw error
            }
          }
        }
        
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }
      
      return data
    } catch (error) {
      console.error('API Error:', error)
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