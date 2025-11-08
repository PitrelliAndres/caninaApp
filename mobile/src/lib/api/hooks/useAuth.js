import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'
import { secureStorage } from '../../../services/storage/secureStorage'
import { authService } from '../../services/api/auth'
import { queryKeys, invalidateQueries } from '../queryClient'
import { loginWithGoogle, logout as reduxLogout, fetchCurrentUser } from '../../store/slices/userSlice'
import { resetChat } from '../../store/slices/chatSlice'
import { resetUI } from '../../store/slices/uiSlice'
import MobileLogger from '../../utils/logger'

// Import existing hook to maintain compatibility
import { useAuth as useExistingAuth } from '../../hooks/useAuth'

// Hook para login con Google
export const useGoogleLogin = () => {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (googleToken) => {
      const response = await authService.googleLogin(googleToken)
      
      // Guardar tokens en secure store
      if (response.jwt) {
        await secureStorage.setItemAsync('jwt_token', response.jwt)
        if (response.tokens?.refresh_token) {
          await secureStorage.setItemAsync('refresh_token', response.tokens.refresh_token)
        }
        if (response.tokens?.realtime_token) {
          await secureStorage.setItemAsync('realtime_token', response.tokens.realtime_token)
        }
      }
      
      return response
    },
    onSuccess: (data) => {
      // Actualizar Redux store
      dispatch(loginWithGoogle.fulfilled(data))
      
      // Invalidar queries relacionadas
      invalidateQueries.user()
      
      // Prefetch data común después del login
      queryClient.prefetchQuery({
        queryKey: queryKeys.users.me(),
        queryFn: () => authService.getCurrentUser(),
      })
      
      MobileLogger.logInfo('Google login successful', { 
        userId: data.user?.id,
        isNew: data.is_new 
      }, 'Auth')
    },
    onError: (error) => {
      MobileLogger.logError(error, {}, 'Auth')
    },
    retry: 1,
  })
}

// Hook para logout (compatible con el existing hook)
export const useLogout = () => {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const existingAuth = useExistingAuth()

  return useMutation({
    mutationFn: async () => {
      // Usar el logout del hook existente para mantener compatibilidad
      await existingAuth.logout()
      
      // También limpiar tokens del secure store (nueva arquitectura)
      await Promise.all([
        secureStorage.deleteItemAsync('jwt_token'),
        secureStorage.deleteItemAsync('refresh_token'),
        secureStorage.deleteItemAsync('realtime_token'),
      ])
    },
    onSuccess: () => {
      // Reset Redux stores
      dispatch(reduxLogout())
      dispatch(resetChat())
      dispatch(resetUI())
      
      // Limpiar cache de queries
      queryClient.clear()
      
      MobileLogger.logInfo('Logout successful', {}, 'Auth')
    },
    onError: (error) => {
      // Logout siempre debe funcionar, al menos localmente
      dispatch(reduxLogout())
      dispatch(resetChat())
      dispatch(resetUI())
      queryClient.clear()
      
      MobileLogger.logError(error, {}, 'Auth')
    },
  })
}

// Hook para obtener usuario actual
export const useCurrentUser = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.auth.user(),
    queryFn: authService.getCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  })
}

// Hook para verificar si hay token válido
export const useAuthToken = () => {
  return useQuery({
    queryKey: ['auth', 'token'],
    queryFn: async () => {
      const token = await SecureStore.getItemAsync('jwt_token')
      const refreshToken = await SecureStore.getItemAsync('refresh_token')
      
      return {
        hasToken: !!token,
        hasRefreshToken: !!refreshToken,
        token: token || null,
      }
    },
    staleTime: 60 * 1000, // 1 minuto
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  })
}

// Hook para refresh token
export const useRefreshToken = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const refreshToken = await SecureStore.getItemAsync('refresh_token')
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      const response = await authService.refreshToken(refreshToken)
      
      // Actualizar tokens
      if (response.jwt) {
        await SecureStore.setItemAsync('jwt_token', response.jwt)
        if (response.tokens?.refresh_token) {
          await SecureStore.setItemAsync('refresh_token', response.tokens.refresh_token)
        }
        if (response.tokens?.realtime_token) {
          await SecureStore.setItemAsync('realtime_token', response.tokens.realtime_token)
        }
      }
      
      return response
    },
    onSuccess: () => {
      // Invalidar cache de token
      queryClient.invalidateQueries({ queryKey: ['auth', 'token'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.user() })
      
      MobileLogger.logInfo('Token refresh successful', {}, 'Auth')
    },
    onError: (error) => {
      // Si falla el refresh, probablemente necesita re-login
      MobileLogger.logError(error, {}, 'Auth')
    },
    retry: 1,
  })
}

// Hook combinado para estado de autenticación (compatible con existing hook)
export const useAuthState = () => {
  const existingAuth = useExistingAuth()
  const { data: tokenData, isLoading: tokenLoading } = useAuthToken()
  const { 
    data: userData, 
    isLoading: userLoading, 
    error: userError 
  } = useCurrentUser({
    enabled: existingAuth.isAuthenticated || tokenData?.hasToken,
  })

  // Priorizar el estado del hook existente para mantener compatibilidad
  const isAuthenticated = existingAuth.isAuthenticated || !!(tokenData?.hasToken && userData)
  const isLoading = existingAuth.loading || tokenLoading || (tokenData?.hasToken && userLoading)
  const user = existingAuth.user || userData
  const needsLogin = !existingAuth.isAuthenticated && (!tokenData?.hasToken || !!userError)

  return {
    isAuthenticated,
    isLoading,
    needsLogin,
    user,
    hasToken: tokenData?.hasToken,
    hasRefreshToken: tokenData?.hasRefreshToken,
    error: userError,
    // Incluir métodos del hook existente para compatibilidad
    login: existingAuth.login,
    logout: existingAuth.logout,
    updateUser: existingAuth.updateUser,
  }
}

// Hook para auto-refresh del token
export const useAutoRefresh = () => {
  const { mutate: refreshToken } = useRefreshToken()
  const queryClient = useQueryClient()

  // Auto-refresh cada 5 minutos si hay refresh token
  useQuery({
    queryKey: ['auth', 'auto-refresh'],
    queryFn: async () => {
      const refreshTokenValue = await SecureStore.getItemAsync('refresh_token')
      if (refreshTokenValue) {
        refreshToken()
      }
      return true
    },
    refetchInterval: 5 * 60 * 1000, // 5 minutos
    enabled: true,
    retry: false,
  })
}

export default {
  useGoogleLogin,
  useLogout,
  useCurrentUser,
  useAuthToken,
  useRefreshToken,
  useAuthState,
  useAutoRefresh,
}
