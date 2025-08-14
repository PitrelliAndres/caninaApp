import { useSelector, useDispatch } from "react-redux"
import { loginWithGoogle, logout, fetchCurrentUser } from "@/lib/redux/features/userSlice"
import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"

export function useAuth() {
  const dispatch = useDispatch()
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoggedIn, loading, error, isNew } = useSelector((state) => state.user)

  // Public routes that don't require auth (can be viewed without login)
  const publicRoutes = ['/login', '/privacy', '/terms', '/']
  
  // Routes that require authentication to access
  const protectedRoutes = ['/profile', '/my-visits', '/matches', '/chats', '/admin', '/onboarding']
  
  // Check if current environment is development
  const isDev = process.env.NODE_ENV === 'development'

  // Token validation and auth state management
  useEffect(() => {
    const token = localStorage.getItem('jwt_token')
    
    // Security check: validate token format
    if (token && !isValidJWTFormat(token)) {
      // TODO: Log security incident - malformed token
      localStorage.removeItem('jwt_token')
      localStorage.removeItem('refresh_token')
      if (!publicRoutes.includes(pathname)) {
        router.push('/login')
      }
      return
    }
    
    // Redirect to login if no token and on protected route
    if (!token && protectedRoutes.some(route => pathname.startsWith(route))) {
      const redirectUrl = encodeURIComponent(pathname)
      router.push(`/login?redirect=${redirectUrl}`)
      return
    }
    
    // Validate token with backend if exists but not logged in
    if (token && !isLoggedIn && !loading) {
      dispatch(fetchCurrentUser()).catch((error) => {
        // Handle different error types
        console.error('Auth validation failed:', error)
        
        // Clear invalid tokens
        localStorage.removeItem('jwt_token')
        localStorage.removeItem('refresh_token')
        
        // Only redirect if on protected route
        if (protectedRoutes.some(route => pathname.startsWith(route))) {
          const redirectUrl = encodeURIComponent(pathname)
          router.push(`/login?redirect=${redirectUrl}`)
        }
      })
    }
  }, [dispatch, isLoggedIn, loading, pathname, router])

  const login = async (googleToken) => {
    try {
      const result = await dispatch(loginWithGoogle(googleToken)).unwrap()
      return result
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const logoutUser = () => {
    dispatch(logout())
    router.push('/login')
  }

  // Security helper functions
  const isValidJWTFormat = (token) => {
    try {
      const parts = token.split('.')
      return parts.length === 3
    } catch {
      return false
    }
  }
  
  const requireAuth = (callback, customRedirect = null) => {
    if (!isLoggedIn || !user) {
      const redirectUrl = customRedirect || encodeURIComponent(window.location.pathname + window.location.search)
      router.push(`/login?redirect=${redirectUrl}`)
      return false
    }
    return callback ? callback() : true
  }
  
  const requireAuthForAction = (actionName = 'perform this action') => {
    if (!isLoggedIn || !user) {
      const currentUrl = encodeURIComponent(window.location.pathname + window.location.search)
      router.push(`/login?redirect=${currentUrl}&action=${encodeURIComponent(actionName)}`)
      return false
    }
    return true
  }
  
  const requireRole = (role, callback) => {
    if (!requireAuth()) return false
    
    if (user.role !== role) {
      // TODO: Log unauthorized role access attempt
      router.push('/')
      return false
    }
    return callback ? callback() : true
  }

  return {
    user,
    isLoggedIn,
    loading,
    error,
    isNew,
    login,
    logout: logoutUser,
    requireAuth,
    requireAuthForAction,
    requireRole,
    isAuthenticated: isLoggedIn && !!user,
    isOnPublicRoute: publicRoutes.includes(pathname),
    isOnProtectedRoute: protectedRoutes.some(route => pathname.startsWith(route)),
    isDev
  }
}

// Helper function for token format validation
function isValidJWTFormat(token) {
  try {
    const parts = token.split('.')
    return parts.length === 3 && parts.every(part => part.length > 0)
  } catch {
    return false
  }
}