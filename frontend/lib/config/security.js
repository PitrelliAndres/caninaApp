/**
 * Security configuration for dev/prod environments
 * Centralizes security-related settings and feature flags
 */

export const SecurityConfig = {
  // Environment detection
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  // Authentication settings
  auth: {
    // Token validation strictness
    strictJWTValidation: process.env.NEXT_PUBLIC_STRICT_JWT_VALIDATION === 'true',
    
    // Session timeout (minutes)
    sessionTimeout: process.env.NEXT_PUBLIC_SESSION_TIMEOUT || (
      process.env.NODE_ENV === 'production' ? 15 : 120
    ),
    
    // Auto-refresh token threshold (minutes before expiry)
    refreshThreshold: process.env.NEXT_PUBLIC_REFRESH_THRESHOLD || 5,
    
    // Maximum login attempts before lockout
    maxLoginAttempts: process.env.NEXT_PUBLIC_MAX_LOGIN_ATTEMPTS || 5,
    
    // Require HTTPS in production
    requireHTTPS: process.env.NEXT_PUBLIC_REQUIRE_HTTPS === 'true' || 
                  process.env.NODE_ENV === 'production'
  },
  
  // API security settings
  api: {
    // Request timeout (milliseconds)
    timeout: process.env.NEXT_PUBLIC_API_TIMEOUT || 30000,
    
    // Retry attempts for failed requests
    maxRetries: process.env.NEXT_PUBLIC_MAX_RETRIES || 3,
    
    // Rate limiting (requests per minute)
    rateLimit: process.env.NEXT_PUBLIC_RATE_LIMIT || (
      process.env.NODE_ENV === 'production' ? 60 : 300
    )
  },
  
  // Security monitoring
  monitoring: {
    // Log security events
    enableSecurityLogging: process.env.NEXT_PUBLIC_SECURITY_LOGGING === 'true' || 
                          process.env.NODE_ENV === 'production',
    
    // Log failed auth attempts
    logFailedAuth: process.env.NEXT_PUBLIC_LOG_FAILED_AUTH === 'true',
    
    // Report CSP violations
    enableCSPReporting: process.env.NEXT_PUBLIC_CSP_REPORTING === 'true'
  },
  
  // Feature flags for security features
  features: {
    // Two-factor authentication
    enable2FA: process.env.NEXT_PUBLIC_ENABLE_2FA === 'true',
    
    // Biometric authentication
    enableBiometric: process.env.NEXT_PUBLIC_ENABLE_BIOMETRIC === 'true',
    
    // Device fingerprinting
    enableFingerprinting: process.env.NEXT_PUBLIC_ENABLE_FINGERPRINTING === 'true',
    
    // Geographic restrictions
    enableGeoRestriction: process.env.NEXT_PUBLIC_ENABLE_GEO_RESTRICTION === 'true'
  },
  
  // Content Security Policy
  csp: {
    // Report violations to this endpoint
    reportUri: process.env.NEXT_PUBLIC_CSP_REPORT_URI,
    
    // Strict CSP in production
    strictCSP: process.env.NODE_ENV === 'production'
  },
  
  // Data protection settings
  privacy: {
    // Automatically anonymize data after this period (days)
    dataRetentionDays: process.env.NEXT_PUBLIC_DATA_RETENTION_DAYS || 365,
    
    // Enable data encryption at rest
    encryptData: process.env.NEXT_PUBLIC_ENCRYPT_DATA === 'true' || 
                 process.env.NODE_ENV === 'production',
    
    // Limit data for unauthenticated users
    limitPublicData: process.env.NEXT_PUBLIC_LIMIT_PUBLIC_DATA === 'true' || 
                     process.env.NODE_ENV === 'production'
  }
}

// Helper functions
export const isSecureContext = () => {
  return SecurityConfig.isProduction || 
         (SecurityConfig.isDevelopment && window.location.protocol === 'https:')
}

export const shouldLogSecurityEvent = (eventType) => {
  if (!SecurityConfig.monitoring.enableSecurityLogging) return false
  
  const criticalEvents = ['auth_failure', 'token_manipulation', 'unauthorized_access']
  return SecurityConfig.isProduction || criticalEvents.includes(eventType)
}

export const getTokenExpiryWarningTime = () => {
  return SecurityConfig.auth.refreshThreshold * 60 * 1000 // Convert to milliseconds
}

// Environment-specific configurations
export const getSecurityHeaders = () => {
  const headers = {}
  
  if (SecurityConfig.auth.requireHTTPS && SecurityConfig.isProduction) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
  }
  
  return headers
}

export default SecurityConfig