/**
 * Frontend logging utilities with structured error reporting
 */

class FrontendLogger {
  static generateId() {
    return Math.random().toString(36).substr(2, 9)
  }

  static logError(error, context = {}, component = 'Unknown') {
    const errorId = this.generateId()
    
    const errorData = {
      errorId,
      timestamp: new Date().toISOString(),
      component,
      errorType: error.name || 'Error',
      errorMessage: error.message || String(error),
      stack: error.stack || 'No stack trace available',
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: context.userId || null
    }

    // Console error with detailed info
    console.group(`🔴 Error ${errorId} in ${component}`)
    console.error('Error:', error)
    console.log('Context:', context)
    console.log('Full Error Data:', errorData)
    console.groupEnd()

    // Send to backend in production (optional)
    if (process.env.NODE_ENV === 'production' && context.sendToBackend) {
      this.sendErrorToBackend(errorData).catch(console.warn)
    }

    return errorId
  }

  static logWarning(message, context = {}, component = 'Unknown') {
    const warningData = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      component,
      message,
      context,
      url: window.location.href
    }

    console.group(`🟡 Warning in ${component}`)
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
      message,
      context,
      url: window.location.href
    }

    console.group(`ℹ️ Info from ${component}`)
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
      event,
      data,
      connectionState: data.socket?.connected ? 'connected' : 'disconnected'
    }

    console.group(`📡 WebSocket ${event} in ${component}`)
    console.log('Event Data:', data)
    console.log('Connection State:', eventData.connectionState)
    console.groupEnd()

    return eventData.id
  }

  static async sendErrorToBackend(errorData) {
    try {
      await fetch('/api/client-errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData)
      })
    } catch (backendError) {
      console.warn('Failed to send error to backend:', backendError)
    }
  }
}

// Error boundary helper
export function withErrorLogging(fn, context = {}, component = 'Unknown') {
  return async (...args) => {
    try {
      return await fn(...args)
    } catch (error) {
      const errorId = FrontendLogger.logError(error, {
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
      FrontendLogger.logWebSocketEvent('event_received', { data, ...context }, component)
      return handler(data)
    } catch (error) {
      FrontendLogger.logError(error, {
        ...context,
        eventData: data
      }, component)
      throw error
    }
  }
}

export default FrontendLogger