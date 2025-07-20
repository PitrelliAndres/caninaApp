import { NextResponse } from 'next/server'

export function middleware(request) {
  const token = request.cookies.get('jwt_token')?.value
  const { pathname } = request.nextUrl

  // Rutas públicas
  const publicPaths = ['/', '/privacy', '/terms']
  
  // Si es ruta pública, permitir acceso
  if (publicPaths.includes(pathname)) {
    return NextResponse.next()
  }

  // Si no hay token, redirigir a login
  if (!token) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
}