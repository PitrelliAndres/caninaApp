/**
 * Cliente API base con interceptores para auth y refresh tokens
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000'

class ApiClient {
  constructor() {
    this.baseURL = API_URL
    this.wsURL = WS_URL
    this.isRefreshing = false
    this.refreshSubscribers = []
  }

  getAuthHeaders() {
    const token = localStorage.getItem('jwt_token')
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
      const refreshToken = localStorage.getItem('refresh_token')
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
        localStorage.setItem('jwt_token', data.jwt)
        if (data.tokens?.refresh_token) {
          localStorage.setItem('refresh_token', data.tokens.refresh_token)
        }
        return data.jwt
      }
      
      throw new Error('No token in refresh response')
    } catch (error) {
      // Si falla el refresh, limpiar tokens y redirigir a login
      localStorage.removeItem('jwt_token')
      localStorage.removeItem('refresh_token')
      window.location.href = '/'
      throw error
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    
    const makeRequest = async (token = null) => {
      const config = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : this.getAuthHeaders()),
          ...options.headers,
        },
      }

      const response = await fetch(url, config)
      
      // Manejar respuesta vacía
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return { success: true }
      }
      
      return { response, data: await response.json() }
    }

    try {
      const { response, data } = await makeRequest()
      
      if (!response.ok) {
        // Token expirado, intentar refresh
        if (response.status === 401 && localStorage.getItem('refresh_token')) {
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
        } else {
          throw new Error(data.error || `HTTP error! status: ${response.status}`)
        }
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