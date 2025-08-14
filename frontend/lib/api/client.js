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
    
    // Basic token format validation
    if (token && !this.isValidJWTFormat(token)) {
      // TODO: Log security incident - malformed token detected
      this.clearTokens()
      return {}
    }
    
    return token ? { 'Authorization': `Bearer ${token}` } : {}
  }
  
  isValidJWTFormat(token) {
    try {
      const parts = token.split('.')
      return parts.length === 3 && parts.every(part => part.length > 0)
    } catch {
      return false
    }
  }
  
  clearTokens() {
    localStorage.removeItem('jwt_token')
    localStorage.removeItem('refresh_token')
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
      // Refresh failed - clear tokens and redirect
      // TODO: Log refresh failure for security monitoring
      this.clearTokens()
      
      // Preserve current path for redirect after login
      const currentPath = window.location.pathname + window.location.search
      const redirectUrl = encodeURIComponent(currentPath)
      window.location.href = `/login?redirect=${redirectUrl}`
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
        // Handle authentication errors with security logging
        if (response.status === 401) {
          // TODO: Log 401 error for security monitoring
          const refreshToken = localStorage.getItem('refresh_token')
          
          if (!refreshToken) {
            // No refresh token available
            this.clearTokens()
            throw new Error('Authentication required')
          }
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
            // TODO: Log refresh failure for security analysis
            throw error
          }
        } else if (response.status === 403) {
          // TODO: Log forbidden access attempt
          throw new Error('Access forbidden')
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