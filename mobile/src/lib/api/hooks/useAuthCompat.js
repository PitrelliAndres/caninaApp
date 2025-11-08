/**
 * Compatibility layer for existing Google login functionality
 * This ensures the current Google login process keeps working
 * while adding the new TanStack Query architecture on top
 */

import { useAuth } from '../../hooks/useAuth'
import { useAuthState, useGoogleLogin, useLogout } from './useAuth'

/**
 * Drop-in replacement for the existing useAuth hook
 * Maintains exact same API but adds TanStack Query features
 */
export const useAuthCompat = () => {
  const existingAuth = useAuth()
  const newAuthState = useAuthState()
  const googleLogin = useGoogleLogin()
  const logoutMutation = useLogout()

  // Enhanced login that works with both systems
  const login = async (token, userData) => {
    try {
      // Use existing login method (maintains Google login flow)
      const success = await existingAuth.login(token, userData)
      
      if (success) {
        // Sync with new Redux state
        googleLogin.mutate(token, {
          onError: (error) => {
            console.warn('Redux sync failed but login succeeded:', error)
          }
        })
      }
      
      return success
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  // Enhanced logout that cleans both systems
  const logout = async () => {
    try {
      // Use new logout mutation (cleans everything)
      logoutMutation.mutate()
      return true
    } catch (error) {
      // Fallback to existing logout
      return await existingAuth.logout()
    }
  }

  return {
    // Existing API (exact same interface)
    user: existingAuth.user,
    loading: existingAuth.loading,
    isAuthenticated: existingAuth.isAuthenticated,
    login,
    logout,
    updateUser: existingAuth.updateUser,
    clearAuth: existingAuth.clearAuth,
    
    // New features (optional to use)
    hasToken: newAuthState.hasToken,
    hasRefreshToken: newAuthState.hasRefreshToken,
    error: newAuthState.error,
  }
}

export default useAuthCompat
