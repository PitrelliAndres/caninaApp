/**
 * Mobile logging utilities with structured error reporting
 */

class MobileLogger {
  static generateId() {
    return Math.random().toString(36).substr(2, 9)
  }

  static logError(error, context = {}, component = 'Unknown') {
    const errorId = this.generateId()

    const errorData = {
      errorId,
      timestamp: new Date().toISOString(),
      component,
      platform: 'mobile',
      errorType: error.name || 'Error',
      errorMessage: error.message || String(error),
      stack: error.stack || 'No stack trace available',
      context,
      userId: context.userId || null
    }

    // Console error with detailed info
    console.group(`🔴 Mobile Error ${errorId} in ${component}`)
    console.error('Error:', error)
    console.log('Context:', context)
    console.log('Full Error Data:', errorData)
    console.groupEnd()

    // Send to backend in production (optional)
    if (__DEV__ === false && context.sendToBackend) {
      this.sendErrorToBackend(errorData).catch(console.warn)
    }

    return errorId
  }

  static logWarning(message, context = {}, component = 'Unknown') {
    const warningData = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      component,
      platform: 'mobile',
      message,
      context
    }

    console.group(`🟡 Mobile Warning in ${component}`)
    console.warn(message)
    console.log('Context:', context)
    console.groupEnd()

    return warningData.id
  }

  static logInfo(message, context = {}, component = 'Unknown') {
    const infoData = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      component,
      platform: 'mobile',
      message,
      context
    }

    console.group(`ℹ️ Mobile Info from ${component}`)
    console.log(message)
    console.log('Context:', context)
    console.groupEnd()

    return infoData.id
  }

  static logWebSocketEvent(event, data = {}, component = 'WebSocket') {
    const eventData = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      component,
      platform: 'mobile',
      event,
      data,
      connectionState: data.socket?.connected ? 'connected' : 'disconnected'
    }

    console.group(`📡 Mobile WebSocket ${event} in ${component}`)
    console.log('Event Data:', data)
    console.log('Connection State:', eventData.connectionState)
    console.groupEnd()

    return eventData.id
  }

  static logNetworkRequest(url, method, statusCode, context = {}) {
    const requestData = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      platform: 'mobile',
      url,
      method,
      statusCode,
      context
    }

    const statusEmoji = statusCode >= 400 ? '🔴' : statusCode >= 300 ? '🟡' : '🟢'

    console.group(`${statusEmoji} Mobile API ${method} ${url} (${statusCode})`)
    console.log('Request Data:', context)
    console.groupEnd()

    return requestData.id
  }

  static async sendErrorToBackend(errorData) {
    try {
      // This would need to be implemented based on your API client
      const response = await fetch('/api/client-errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData)
      })
    } catch (backendError) {
      console.warn('Failed to send mobile error to backend:', backendError)
    }
  }
}

// Error boundary helper
export function withErrorLogging(fn, context = {}, component = 'Unknown') {
  return async (...args) => {
    try {
      return await fn(...args)
    } catch (error) {
      const errorId = MobileLogger.logError(error, {
        ...context,
        functionArgs: args
      }, component)

      // Re-throw with error ID
      error.errorId = errorId
      throw error
    }
  }
}

// API call wrapper
export function withApiErrorLogging(apiCall, context = {}, component = 'API') {
  return withErrorLogging(apiCall, context, component)
}

// WebSocket event wrapper
export function withWebSocketErrorLogging(handler, context = {}, component = 'WebSocket') {
  return (data) => {
    try {
      MobileLogger.logWebSocketEvent('event_received', { data, ...context }, component)
      return handler(data)
    } catch (error) {
      MobileLogger.logError(error, {
        ...context,
        eventData: data
      }, component)
      throw error
    }
  }
}

export default MobileLogger
