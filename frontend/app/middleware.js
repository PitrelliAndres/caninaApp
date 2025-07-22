import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

// Función para verificar JWT
async function verifyJWT(token) {
  try {
    // En producción, usar variable de entorno para el secreto
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'dev-secret-key-change-in-production'
    )
    
    const { payload } = await jwtVerify(token, secret)
    return payload
  } catch (error) {
    return null
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl
  
  // Rutas públicas que no requieren autenticación
  const publicPaths = ['/login', '/privacy', '/terms', '/api/auth/google']
  
  // Si es ruta pública o archivo estático, permitir acceso
  if (
    publicPaths.includes(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // archivos con extensión
  ) {
    return NextResponse.next()
  }
  
  // Obtener token de cookies o headers
  const token = request.cookies.get('jwt_token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!token) {
    // Si no hay token, redirigir a login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }
  
  // Verificar token
  const payload = await verifyJWT(token)
  
  if (!payload) {
    // Token inválido o expirado
    const response = NextResponse.redirect(new URL('/', request.url))
    response.cookies.delete('jwt_token')
    response.cookies.delete('refresh_token')
    return response
  }
  
  // Verificar si el token está próximo a expirar (menos de 5 minutos)
  const now = Math.floor(Date.now() / 1000)
  const timeUntilExpiry = payload.exp - now
  
  if (timeUntilExpiry < 300) { // 5 minutos
    // Agregar header para indicar que se debe refrescar el token
    const response = NextResponse.next()
    response.headers.set('X-Token-Expiring-Soon', 'true')
    return response
  }
  
  // Verificar rutas específicas de roles
  if (pathname.startsWith('/admin')) {
    if (payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }
  
  // Verificar onboarding
  if (pathname !== '/onboarding' && !payload.onboarded) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
}