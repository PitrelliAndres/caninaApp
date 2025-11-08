import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { parksService } from '../../services/api/parks'
import { queryKeys, invalidateQueries } from '../queryClient'
import { selectSearchFilters } from '../../store/slices/uiSlice'
import MobileLogger from '../../utils/logger'

// Hook para obtener lista de parques
export const useParks = (filters = {}, options = {}) => {
  const searchFilters = useSelector(selectSearchFilters)
  const mergedFilters = { ...searchFilters, ...filters }

  return useQuery({
    queryKey: queryKeys.parks.list(mergedFilters),
    queryFn: () => parksService.getParks(mergedFilters),
    staleTime: 15 * 60 * 1000, // 15 minutos (parks cambian poco)
    gcTime: 30 * 60 * 1000, // 30 minutos
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  })
}

// Hook para obtener parque específico
export const usePark = (parkId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.parks.detail(parkId),
    queryFn: () => parksService.getPark(parkId),
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 20 * 60 * 1000, // 20 minutos
    enabled: !!parkId,
    retry: 2,
    ...options,
  })
}

// Hook para parques cercanos con geolocalización
export const useNearbyParks = (location, radius = 5, options = {}) => {
  return useQuery({
    queryKey: queryKeys.parks.nearby({ location, radius }),
    queryFn: () => parksService.getNearbyParks(location, radius),
    staleTime: 5 * 60 * 1000, // 5 minutos (más dinámico)
    gcTime: 15 * 60 * 1000,
    enabled: !!(location?.latitude && location?.longitude),
    retry: 2,
    ...options,
  })
}

// Hook para buscar parques con debounce
export const useSearchParks = (searchTerm, options = {}) => {
  return useQuery({
    queryKey: ['parks', 'search', searchTerm],
    queryFn: () => parksService.searchParks(searchTerm),
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 10 * 60 * 1000,
    enabled: searchTerm && searchTerm.length >= 2,
    retry: 1,
    ...options,
  })
}

// Hook para parques favoritos
export const useFavoriteParks = (options = {}) => {
  return useQuery({
    queryKey: ['parks', 'favorites'],
    queryFn: parksService.getFavoriteParks,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2,
    ...options,
  })
}

// Hook para marcar/desmarcar parque como favorito
export const useFavoritePark = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ parkId, isFavorite }) => {
      return isFavorite 
        ? parksService.addToFavorites(parkId)
        : parksService.removeFromFavorites(parkId)
    },
    onMutate: async ({ parkId, isFavorite }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['parks', 'favorites'] })
      
      const previousFavorites = queryClient.getQueryData(['parks', 'favorites'])
      
      if (previousFavorites) {
        const updatedFavorites = isFavorite
          ? [...previousFavorites, { park_id: parkId }]
          : previousFavorites.filter(fav => fav.park_id !== parkId)
        
        queryClient.setQueryData(['parks', 'favorites'], updatedFavorites)
      }
      
      return { previousFavorites }
    },
    onError: (error, variables, context) => {
      // Revert optimistic update
      if (context?.previousFavorites) {
        queryClient.setQueryData(['parks', 'favorites'], context.previousFavorites)
      }
      
      MobileLogger.logError(error, { 
        parkId: variables.parkId,
        action: variables.isFavorite ? 'add' : 'remove'
      }, 'Parks')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['parks', 'favorites'] })
      invalidateQueries.parks()
    },
  })
}

// Hook para reportar problema en parque
export const useReportPark = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ parkId, reason, description }) => 
      parksService.reportPark(parkId, reason, description),
    onSuccess: (data, variables) => {
      // Invalidar cache del parque específico
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.parks.detail(variables.parkId) 
      })
      
      MobileLogger.logInfo('Park reported successfully', { 
        parkId: variables.parkId,
        reason: variables.reason
      }, 'Parks')
    },
    onError: (error, variables) => {
      MobileLogger.logError(error, { 
        parkId: variables.parkId,
        reason: variables.reason
      }, 'Parks')
    },
    retry: 1,
  })
}

// Hook para obtener estadísticas del parque
export const useParkStats = (parkId, options = {}) => {
  return useQuery({
    queryKey: ['parks', 'stats', parkId],
    queryFn: () => parksService.getParkStats(parkId),
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000,
    enabled: !!parkId,
    retry: 2,
    ...options,
  })
}

// Hook para obtener reviews del parque
export const useParkReviews = (parkId, options = {}) => {
  return useQuery({
    queryKey: ['parks', 'reviews', parkId],
    queryFn: () => parksService.getParkReviews(parkId),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    enabled: !!parkId,
    retry: 2,
    ...options,
  })
}

// Hook para crear review de parque
export const useCreateParkReview = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ parkId, rating, comment }) => 
      parksService.createParkReview(parkId, rating, comment),
    onSuccess: (data, variables) => {
      // Invalidar reviews y stats del parque
      queryClient.invalidateQueries({ 
        queryKey: ['parks', 'reviews', variables.parkId] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['parks', 'stats', variables.parkId] 
      })
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.parks.detail(variables.parkId) 
      })
      
      MobileLogger.logInfo('Park review created', { 
        parkId: variables.parkId,
        rating: variables.rating
      }, 'Parks')
    },
    onError: (error, variables) => {
      MobileLogger.logError(error, { 
        parkId: variables.parkId
      }, 'Parks')
    },
    retry: 1,
  })
}

// Hook para prefetch de parques cercanos (usar con location)
export const usePrefetchNearbyParks = () => {
  const queryClient = useQueryClient()

  return (location, radius = 5) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.parks.nearby({ location, radius }),
      queryFn: () => parksService.getNearbyParks(location, radius),
      staleTime: 5 * 60 * 1000,
    })
  }
}

// Hook combinado para parque con datos relacionados
export const useParkWithDetails = (parkId, options = {}) => {
  const parkQuery = usePark(parkId, options)
  const statsQuery = useParkStats(parkId, { 
    enabled: !!parkId && options.includeStats 
  })
  const reviewsQuery = useParkReviews(parkId, { 
    enabled: !!parkId && options.includeReviews 
  })

  return {
    park: parkQuery,
    stats: statsQuery,
    reviews: reviewsQuery,
    isLoading: parkQuery.isLoading || 
               (options.includeStats && statsQuery.isLoading) ||
               (options.includeReviews && reviewsQuery.isLoading),
    error: parkQuery.error || statsQuery.error || reviewsQuery.error,
  }
}

export default {
  useParks,
  usePark,
  useNearbyParks,
  useSearchParks,
  useFavoriteParks,
  useFavoritePark,
  useReportPark,
  useParkStats,
  useParkReviews,
  useCreateParkReview,
  usePrefetchNearbyParks,
  useParkWithDetails,
}
