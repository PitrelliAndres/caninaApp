import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { matchesService } from '../../services/api/matches'
import { queryKeys, invalidateQueries } from '../queryClient'
import { selectSearchFilters } from '../../store/slices/uiSlice'
import MobileLogger from '../../utils/logger'

// Hook para obtener usuarios para match (discover)
export const useDiscoverUsers = (filters = {}, options = {}) => {
  const searchFilters = useSelector(selectSearchFilters)
  const mergedFilters = { ...searchFilters, ...filters }

  return useInfiniteQuery({
    queryKey: queryKeys.matches.discover(mergedFilters),
    queryFn: ({ pageParam = 1 }) => 
      matchesService.getDiscoverUsers({ ...mergedFilters, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => {
      return lastPage.has_more ? pages.length + 1 : undefined
    },
    staleTime: 2 * 60 * 1000, // 2 minutos (discover es dinámico)
    gcTime: 10 * 60 * 1000,
    retry: 2,
    ...options,
  })
}

// Hook para obtener matches mutuos
export const useMutualMatches = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.matches.mutual(),
    queryFn: matchesService.getMutualMatches,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2,
    ...options,
  })
}

// Hook para obtener mis likes enviados
export const useMyLikes = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.matches.likes(),
    queryFn: matchesService.getMyLikes,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2,
    ...options,
  })
}

// Hook para dar like a un usuario
export const useLikeUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (targetUserId) => matchesService.likeUser(targetUserId),
    onMutate: async (targetUserId) => {
      // Optimistic update - remover de discover
      await queryClient.cancelQueries({ queryKey: queryKeys.matches.discover() })
      
      const discoverQueries = queryClient.getQueriesData({ queryKey: queryKeys.matches.discover() })
      
      discoverQueries.forEach(([queryKey, data]) => {
        if (data?.pages) {
          const updatedPages = data.pages.map(page => ({
            ...page,
            users: page.users.filter(user => user.id !== targetUserId)
          }))
          
          queryClient.setQueryData(queryKey, {
            ...data,
            pages: updatedPages
          })
        }
      })
      
      return { discoverQueries }
    },
    onSuccess: (data, targetUserId) => {
      // Invalidar queries relevantes
      invalidateQueries.matches()
      
      // Si fue match mutuo, invalidar conversaciones
      if (data.is_mutual) {
        queryClient.invalidateQueries({ queryKey: queryKeys.messages.all() })
        
        MobileLogger.logInfo('Mutual match created!', { 
          targetUserId,
          matchId: data.match_id 
        }, 'Matches')
      } else {
        MobileLogger.logInfo('Like sent', { targetUserId }, 'Matches')
      }
    },
    onError: (error, targetUserId, context) => {
      // Revert optimistic updates
      if (context?.discoverQueries) {
        context.discoverQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      
      MobileLogger.logError(error, { targetUserId }, 'Matches')
    },
    retry: 1,
  })
}

// Hook para dar unlike (remover like)
export const useUnlikeUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (targetUserId) => matchesService.unlikeUser(targetUserId),
    onMutate: async (targetUserId) => {
      // Optimistic update - remover de likes
      await queryClient.cancelQueries({ queryKey: queryKeys.matches.likes() })
      
      const previousLikes = queryClient.getQueryData(queryKeys.matches.likes())
      
      if (previousLikes) {
        const updatedLikes = previousLikes.filter(like => like.target_user.id !== targetUserId)
        queryClient.setQueryData(queryKeys.matches.likes(), updatedLikes)
      }
      
      return { previousLikes }
    },
    onSuccess: (data, targetUserId) => {
      invalidateQueries.matches()
      
      MobileLogger.logInfo('Like removed', { targetUserId }, 'Matches')
    },
    onError: (error, targetUserId, context) => {
      // Revert optimistic update
      if (context?.previousLikes) {
        queryClient.setQueryData(queryKeys.matches.likes(), context.previousLikes)
      }
      
      MobileLogger.logError(error, { targetUserId }, 'Matches')
    },
    retry: 1,
  })
}

// Hook para reportar usuario
export const useReportUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, reason, description }) => 
      matchesService.reportUser(userId, reason, description),
    onMutate: async (variables) => {
      // Optimistic update - remover de discover y matches
      const discoverQueries = queryClient.getQueriesData({ queryKey: queryKeys.matches.discover() })
      
      discoverQueries.forEach(([queryKey, data]) => {
        if (data?.pages) {
          const updatedPages = data.pages.map(page => ({
            ...page,
            users: page.users.filter(user => user.id !== variables.userId)
          }))
          
          queryClient.setQueryData(queryKey, {
            ...data,
            pages: updatedPages
          })
        }
      })
      
      return { discoverQueries }
    },
    onSuccess: (data, variables) => {
      // Invalidar todas las queries de matches
      invalidateQueries.matches()
      
      MobileLogger.logInfo('User reported', { 
        userId: variables.userId,
        reason: variables.reason
      }, 'Matches')
    },
    onError: (error, variables, context) => {
      // Revert optimistic updates
      if (context?.discoverQueries) {
        context.discoverQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      
      MobileLogger.logError(error, { userId: variables.userId }, 'Matches')
    },
    retry: 1,
  })
}

// Hook para bloquear usuario
export const useBlockUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId) => matchesService.blockUser(userId),
    onMutate: async (userId) => {
      // Optimistic update - remover de todas partes
      await queryClient.cancelQueries({ queryKey: queryKeys.matches.all() })
      
      // Remover de discover
      const discoverQueries = queryClient.getQueriesData({ queryKey: queryKeys.matches.discover() })
      discoverQueries.forEach(([queryKey, data]) => {
        if (data?.pages) {
          const updatedPages = data.pages.map(page => ({
            ...page,
            users: page.users.filter(user => user.id !== userId)
          }))
          queryClient.setQueryData(queryKey, { ...data, pages: updatedPages })
        }
      })
      
      // Remover de matches mutuos
      const mutualMatches = queryClient.getQueryData(queryKeys.matches.mutual())
      if (mutualMatches) {
        const updatedMatches = mutualMatches.filter(match => match.user.id !== userId)
        queryClient.setQueryData(queryKeys.matches.mutual(), updatedMatches)
      }
      
      return { discoverQueries, mutualMatches }
    },
    onSuccess: (data, userId) => {
      // Invalidar queries relacionadas incluyendo conversaciones
      invalidateQueries.matches()
      invalidateQueries.messages()
      
      MobileLogger.logInfo('User blocked', { userId }, 'Matches')
    },
    onError: (error, userId, context) => {
      // Revert optimistic updates
      if (context?.discoverQueries) {
        context.discoverQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      if (context?.mutualMatches) {
        queryClient.setQueryData(queryKeys.matches.mutual(), context.mutualMatches)
      }
      
      MobileLogger.logError(error, { userId }, 'Matches')
    },
    retry: 1,
  })
}

// Hook para obtener perfil de usuario específico
export const useUserProfile = (userId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.users.profile(userId),
    queryFn: () => matchesService.getUserProfile(userId),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    enabled: !!userId,
    retry: 2,
    ...options,
  })
}

// Hook para match statistics
export const useMatchStats = (options = {}) => {
  return useQuery({
    queryKey: ['matches', 'stats'],
    queryFn: matchesService.getMatchStats,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    ...options,
  })
}

// Hook para prefetch de siguiente lote de usuarios
export const usePrefetchNextUsers = () => {
  const queryClient = useQueryClient()

  return (filters = {}) => {
    queryClient.prefetchInfiniteQuery({
      queryKey: queryKeys.matches.discover(filters),
      queryFn: ({ pageParam = 1 }) => 
        matchesService.getDiscoverUsers({ ...filters, page: pageParam }),
      initialPageParam: 1,
      staleTime: 2 * 60 * 1000,
    })
  }
}

// Hook combinado para página de discover
export const useDiscoverPage = (filters = {}) => {
  const discoverQuery = useDiscoverUsers(filters)
  const statsQuery = useMatchStats({ enabled: discoverQuery.data?.pages?.length > 0 })

  // Flatten pages de usuarios
  const users = discoverQuery.data?.pages?.flatMap(page => page.users) || []

  return {
    users,
    stats: statsQuery.data,
    hasNextPage: discoverQuery.hasNextPage,
    fetchNextPage: discoverQuery.fetchNextPage,
    isFetchingNextPage: discoverQuery.isFetchingNextPage,
    isLoading: discoverQuery.isLoading,
    isRefreshing: discoverQuery.isRefetching,
    error: discoverQuery.error || statsQuery.error,
    refetch: discoverQuery.refetch,
  }
}

// Hook para acciones rápidas (swipe)
export const useSwipeActions = () => {
  const likeUser = useLikeUser()
  const unlikeUser = useUnlikeUser()
  const reportUser = useReportUser()
  const blockUser = useBlockUser()

  return {
    like: likeUser.mutate,
    unlike: unlikeUser.mutate,
    report: reportUser.mutate,
    block: blockUser.mutate,
    isLoading: likeUser.isPending || unlikeUser.isPending || 
               reportUser.isPending || blockUser.isPending,
  }
}

export default {
  useDiscoverUsers,
  useMutualMatches,
  useMyLikes,
  useLikeUser,
  useUnlikeUser,
  useReportUser,
  useBlockUser,
  useUserProfile,
  useMatchStats,
  usePrefetchNextUsers,
  useDiscoverPage,
  useSwipeActions,
}
