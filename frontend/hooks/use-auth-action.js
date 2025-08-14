/**
 * Hook for authentication-dependent actions with automatic login redirects
 * Ensures all sensitive operations require valid authentication
 */
import { useAuth } from './use-auth'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

export function useAuthAction() {
  const { isLoggedIn, loading, user } = useAuth()
  const router = useRouter()

  const executeWithAuth = useCallback(async (action, options = {}) => {
    const { 
      requireOnboarding = false, 
      requireRole = null,
      redirectPath = '/login',
      onUnauthorized = null,
      actionName = 'perform this action'
    } = options

    // Check if user is loading auth state
    if (loading) {
      throw new Error('AUTH_LOADING')
    }

    // Check if user is authenticated
    if (!isLoggedIn || !user) {
      if (onUnauthorized) {
        onUnauthorized('NOT_AUTHENTICATED')
      } else {
        const currentPath = window.location.pathname + window.location.search
        const actionParam = actionName ? `&action=${encodeURIComponent(actionName)}` : ''
        router.push(`${redirectPath}?redirect=${encodeURIComponent(currentPath)}${actionParam}`)
      }
      throw new Error('AUTH_REQUIRED')
    }

    // Check onboarding requirement
    if (requireOnboarding && !user.onboarded) {
      router.push('/onboarding')
      throw new Error('ONBOARDING_REQUIRED')
    }

    // Check role requirement
    if (requireRole && user.role !== requireRole) {
      if (onUnauthorized) {
        onUnauthorized('INSUFFICIENT_ROLE')
      } else {
        router.push('/')
      }
      throw new Error('INSUFFICIENT_PERMISSIONS')
    }

    // Execute the action
    try {
      return await action()
    } catch (error) {
      // Handle token expiration
      if (error.message?.includes('TOKEN_EXPIRED') || error.message?.includes('AUTH_FAILED')) {
        router.push(`${redirectPath}?redirect=${encodeURIComponent(window.location.pathname)}`)
        throw new Error('AUTH_EXPIRED')
      }
      throw error
    }
  }, [isLoggedIn, loading, user, router])

  const withAuth = useCallback((action, options = {}) => {
    return (...args) => executeWithAuth(() => action(...args), options)
  }, [executeWithAuth])

  return {
    executeWithAuth,
    withAuth,
    isAuthenticated: isLoggedIn && !!user,
    isReady: !loading,
    user
  }
}

// Convenience hooks for common scenarios
export function useAdminAction() {
  const authAction = useAuthAction()
  
  return {
    ...authAction,
    executeAsAdmin: (action, options = {}) => 
      authAction.executeWithAuth(action, { requireRole: 'admin', ...options }),
    withAdmin: (action, options = {}) => 
      authAction.withAuth(action, { requireRole: 'admin', ...options })
  }
}

export function useOnboardedAction() {
  const authAction = useAuthAction()
  
  return {
    ...authAction,
    executeOnboarded: (action, options = {}) => 
      authAction.executeWithAuth(action, { requireOnboarding: true, ...options }),
    withOnboarded: (action, options = {}) => 
      authAction.withAuth(action, { requireOnboarding: true, ...options })
  }
}