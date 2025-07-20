/**
 * Cliente API base con interceptores para auth
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000'

class ApiClient {
  constructor() {
    this.baseURL = API_URL
    this.wsURL = WS_URL
  }

  getAuthHeaders() {
    const token = localStorage.getItem('jwt_token')
    return token ? { 'Authorization': `Bearer ${token}` } : {}
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    }

    try {
      const response = await fetch(url, config)
      
      // Manejar respuesta vacía
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return { success: true }
      }
      
      const data = await response.json()
      
      if (!response.ok) {
        // Token expirado
        if (response.status === 401) {
          localStorage.removeItem('jwt_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/'
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
