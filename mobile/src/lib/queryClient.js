import { QueryClient } from '@tanstack/react-query'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { persistQueryClient } from '@tanstack/query-persist-client-core'

// Configuración del QueryClient con defaults optimizados para mobile
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache por 5 minutos por defecto
      staleTime: 5 * 60 * 1000,
      // Cache en background por 10 minutos
      gcTime: 10 * 60 * 1000,
      // Retry 3 veces con backoff exponencial
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // No refetch en window focus (mobile no tiene window focus como web)
      refetchOnWindowFocus: false,
      // Refetch en reconnect
      refetchOnReconnect: true,
      // Network mode: sempre intenta queries en offline con cache
      networkMode: 'offlineFirst',
    },
    mutations: {
      // Retry mutations 2 veces
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      // Network mode: no ejecutar mutations en offline
      networkMode: 'online',
    },
  },
})

// Persistir cache en AsyncStorage
export const initializeQueryPersistence = async () => {
  try {
    await persistQueryClient({
      queryClient,
      persister: {
        persistClient: async (client) => {
          await AsyncStorage.setItem('REACT_QUERY_OFFLINE_CACHE', JSON.stringify(client))
        },
        restoreClient: async () => {
          const cached = await AsyncStorage.getItem('REACT_QUERY_OFFLINE_CACHE')
          return cached ? JSON.parse(cached) : undefined
        },
        removeClient: async () => {
          await AsyncStorage.removeItem('REACT_QUERY_OFFLINE_CACHE')
        },
      },
      // Cache por 24 horas
      maxAge: 24 * 60 * 60 * 1000,
      // Comprimir cache si es muy grande
      hydrateOptions: {},
      dehydrateOptions: {
        shouldDehydrateQuery: (query) => {
          // Solo persistir queries exitosas y no stale
          return query.state.status === 'success' && query.state.dataUpdatedAt > Date.now() - (24 * 60 * 60 * 1000)
        },
      },
    })
  } catch (error) {
    console.warn('Failed to initialize query persistence:', error)
  }
}

// Query keys factory para consistencia
export const queryKeys = {
  // Auth
  auth: {
    user: () => ['auth', 'user'],
    refresh: () => ['auth', 'refresh'],
  },
  
  // Users
  users: {
    all: () => ['users'],
    profile: (userId) => ['users', 'profile', userId],
    me: () => ['users', 'me'],
  },
  
  // Parks
  parks: {
    all: () => ['parks'],
    list: (filters) => ['parks', 'list', filters],
    detail: (parkId) => ['parks', 'detail', parkId],
    nearby: (location) => ['parks', 'nearby', location],
  },
  
  // Visits
  visits: {
    all: () => ['visits'],
    my: () => ['visits', 'my'],
    byPark: (parkId) => ['visits', 'byPark', parkId],
    detail: (visitId) => ['visits', 'detail', visitId],
  },
  
  // Matches
  matches: {
    all: () => ['matches'],
    discover: (filters) => ['matches', 'discover', filters],
    mutual: () => ['matches', 'mutual'],
    likes: () => ['matches', 'likes'],
  },
  
  // Messages (solo para fallback HTTP, el real-time va por Socket.IO)
  messages: {
    all: () => ['messages'],
    conversation: (conversationId) => ['messages', 'conversation', conversationId],
    thread: (conversationId, after, limit) => ['messages', 'thread', conversationId, { after, limit }],
  },
}

// Helper para invalidar queries relacionadas
export const invalidateQueries = {
  user: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.all() }),
  parks: () => queryClient.invalidateQueries({ queryKey: queryKeys.parks.all() }),
  visits: () => queryClient.invalidateQueries({ queryKey: queryKeys.visits.all() }),
  matches: () => queryClient.invalidateQueries({ queryKey: queryKeys.matches.all() }),
  messages: () => queryClient.invalidateQueries({ queryKey: queryKeys.messages.all() }),
}

// Helper para prefetch data común
export const prefetchCommonData = async () => {
  // Prefetch user profile
  await queryClient.prefetchQuery({
    queryKey: queryKeys.users.me(),
    queryFn: () => import('../services/api/users').then(m => m.getMyProfile()),
    staleTime: 5 * 60 * 1000,
  })
  
  // Prefetch parks list con cache extendido
  await queryClient.prefetchQuery({
    queryKey: queryKeys.parks.list({}),
    queryFn: () => import('../services/api/parks').then(m => m.getParks()),
    staleTime: 15 * 60 * 1000, // Parks cambian poco, cache más largo
  })
}

export default queryClient
