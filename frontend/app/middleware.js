import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

// Environment-based security configuration
const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const STRICT_JWT_VALIDATION = process.env.NEXT_PUBLIC_STRICT_JWT_VALIDATION === 'true' || IS_PRODUCTION
const REQUIRE_HTTPS = process.env.NEXT_PUBLIC_REQUIRE_HTTPS === 'true' || IS_PRODUCTION

// Enhanced JWT verification with security logging
async function verifyJWT(token) {
  try {
    // Validate token format first
    if (!isValidJWTFormat(token)) {
      logSecurityEvent('invalid_token_format', { tokenLength: token?.length || 0 })
      return null
    }
    
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'dev-secret-key-change-in-production'
    )
    
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
      audience: STRICT_JWT_VALIDATION ? 'parkdog-client' : undefined,
      issuer: STRICT_JWT_VALIDATION ? 'parkdog-api' : undefined
    })
    
    // Additional payload validation
    if (!payload.user_id || typeof payload.user_id !== 'number') {
      logSecurityEvent('invalid_token_payload', { hasUserId: !!payload.user_id })
      return null
    }
    
    return payload
  } catch (error) {
    logSecurityEvent('jwt_verification_failed', { 
      error: error.message,
      code: error.code 
    })
    return null
  }
}

// Token format validation
function isValidJWTFormat(token) {
  if (!token || typeof token !== 'string') return false
  const parts = token.split('.')
  return parts.length === 3 && parts.every(part => part.length > 0)
}

// Security event logging
function logSecurityEvent(event, data = {}) {
  if (IS_PRODUCTION || process.env.NEXT_PUBLIC_SECURITY_LOGGING === 'true') {
    console.warn(`[SECURITY] ${event}:`, {
      timestamp: new Date().toISOString(),
      ...data
    })
    // TODO: Send to security monitoring service
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl
  const userAgent = request.headers.get('user-agent') || ''
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  
  // Security headers for all responses
  const response = NextResponse.next()
  addSecurityHeaders(response)
  
  // HTTPS enforcement in production
  if (REQUIRE_HTTPS && request.nextUrl.protocol === 'http:') {
    const httpsUrl = new URL(request.url)
    httpsUrl.protocol = 'https:'
    return NextResponse.redirect(httpsUrl)
  }
  
  // Public paths that don't require authentication
  const publicPaths = ['/login', '/privacy', '/terms', '/api/auth/google']
  
  // Always allow access to home route (/) - it's public but may have limited features
  if (pathname === '/') {
    return response
  }
  
  // Allow access to public paths and static files
  if (
    publicPaths.includes(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') // files with extensions
  ) {
    return response
  }
  
  // Extract token from cookies or authorization header
  const cookieToken = request.cookies.get('jwt_token')?.value
  const authHeader = request.headers.get('authorization')
  const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  
  const token = cookieToken || headerToken
  
  if (!token) {
    logSecurityEvent('missing_auth_token', { 
      path: pathname, 
      ip, 
      userAgent: userAgent.substring(0, 100) 
    })
    
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }
  
  // Verify token
  const payload = await verifyJWT(token)
  
  if (!payload) {
    logSecurityEvent('invalid_auth_token', { 
      path: pathname, 
      ip,
      tokenSource: cookieToken ? 'cookie' : 'header'
    })
    
    const redirectResponse = NextResponse.redirect(new URL('/login', request.url))
    redirectResponse.cookies.delete('jwt_token')
    redirectResponse.cookies.delete('refresh_token')
    return redirectResponse
  }
  
  // Check token expiration and add refresh warning
  const now = Math.floor(Date.now() / 1000)
  const timeUntilExpiry = payload.exp - now
  const refreshThreshold = parseInt(process.env.NEXT_PUBLIC_REFRESH_THRESHOLD || '300')
  
  if (timeUntilExpiry < refreshThreshold) {
    response.headers.set('X-Token-Expiring-Soon', 'true')
    response.headers.set('X-Token-Expires-In', timeUntilExpiry.toString())
  }
  
  // Role-based access control
  if (pathname.startsWith('/admin')) {
    if (payload.role !== 'admin') {
      logSecurityEvent('unauthorized_admin_access', { 
        userId: payload.user_id, 
        userRole: payload.role, 
        path: pathname,
        ip 
      })
      return NextResponse.redirect(new URL('/', request.url))
    }
  }
  
  // Onboarding requirement check
  if (pathname !== '/onboarding' && !payload.onboarded) {
    response.headers.set('X-Onboarding-Required', 'true')
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }
  
  // Add user context to response headers for debugging (dev only)
  if (!IS_PRODUCTION) {
    response.headers.set('X-User-ID', payload.user_id.toString())
    response.headers.set('X-User-Role', payload.role || 'user')
  }
  
  return response
}

// Add security headers to response
function addSecurityHeaders(response) {
  // Content Security Policy
  if (IS_PRODUCTION) {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self'; frame-ancestors 'none';"
    )
  }
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)')
  
  if (REQUIRE_HTTPS) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Enhanced matcher for security middleware
     * Excludes: API auth routes, static files, images, favicons
     * Includes: All app routes that need authentication
     */
    '/((?!api/auth|_next/static|_next/image|favicon|.*\\..*|public).*)',
  ],
}