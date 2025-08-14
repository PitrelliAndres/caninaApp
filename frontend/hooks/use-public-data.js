/**
 * Hook for handling public data with authentication-based limiting
 * Provides different data access levels based on user authentication status
 */
import { useAuth } from './use-auth'
import { SecurityConfig } from '@/lib/config/security'

export function usePublicData() {
  const { isAuthenticated, user } = useAuth()
  
  const filterPublicData = (data, options = {}) => {
    const { 
      allowedPublicFields = [],
      sensitiveFields = [],
      requireAuth = false 
    } = options
    
    // If data limiting is disabled in config, return full data
    if (!SecurityConfig.privacy.limitPublicData) {
      return data
    }
    
    // If authentication is required and user is not authenticated
    if (requireAuth && !isAuthenticated) {
      return null
    }
    
    // If user is authenticated, return full data
    if (isAuthenticated) {
      return data
    }
    
    // For unauthenticated users, filter sensitive data
    if (Array.isArray(data)) {
      return data.map(item => filterSingleItem(item, allowedPublicFields, sensitiveFields))
    }
    
    return filterSingleItem(data, allowedPublicFields, sensitiveFields)
  }
  
  const filterSingleItem = (item, allowedFields, sensitiveFields) => {
    if (!item || typeof item !== 'object') return item
    
    const filtered = { ...item }
    
    // Remove sensitive fields
    sensitiveFields.forEach(field => {
      delete filtered[field]
    })
    
    // If allowedFields is specified, only include those fields
    if (allowedFields.length > 0) {
      const allowedOnly = {}
      allowedFields.forEach(field => {
        if (filtered[field] !== undefined) {
          allowedOnly[field] = filtered[field]
        }
      })
      return allowedOnly
    }
    
    return filtered
  }
  
  const getParksData = (parks) => {
    return filterPublicData(parks, {
      allowedPublicFields: [
        'id', 'name', 'description', 'address', 'neighborhood',
        'latitude', 'longitude', 'amenities', 'size', 'is_active'
      ],
      sensitiveFields: [
        'created_at', 'updated_at', 'admin_notes', 'active_visits_today'
      ]
    })
  }
  
  const getUserData = (userData) => {
    return filterPublicData(userData, {
      requireAuth: true,
      sensitiveFields: [
        'email', 'google_id', 'last_login', 'ip_address', 'device_info'
      ]
    })
  }
  
  const getVisitData = (visits) => {
    return filterPublicData(visits, {
      requireAuth: true // Visits always require authentication
    })
  }
  
  const getMatchData = (matches) => {
    return filterPublicData(matches, {
      requireAuth: true // Matches always require authentication
    })
  }
  
  const getPublicStats = (stats) => {
    if (!isAuthenticated && SecurityConfig.privacy.limitPublicData) {
      // Return limited stats for unauthenticated users
      return {
        total_parks: stats?.total_parks || 0,
        total_active_users: Math.floor((stats?.total_active_users || 0) / 10) * 10, // Round to nearest 10
        // TODO: Remove sensitive metrics for public display
        last_updated: null
      }
    }
    
    return stats
  }
  
  const shouldShowFeature = (feature) => {
    if (!isAuthenticated) {
      // Features that should be hidden from unauthenticated users
      const authOnlyFeatures = [
        'messaging', 'matching', 'profile_editing', 
        'visit_scheduling', 'location_sharing'
      ]
      
      return !authOnlyFeatures.includes(feature)
    }
    
    return true
  }
  
  const getLimitedPreview = (fullData, previewFields = ['id', 'name']) => {
    if (isAuthenticated) return fullData
    
    // Provide limited preview for unauthenticated users
    if (Array.isArray(fullData)) {
      return fullData.slice(0, 3).map(item => {
        const preview = {}
        previewFields.forEach(field => {
          preview[field] = item[field]
        })
        return preview
      })
    }
    
    const preview = {}
    previewFields.forEach(field => {
      preview[field] = fullData?.[field]
    })
    return preview
  }
  
  return {
    filterPublicData,
    getParksData,
    getUserData,
    getVisitData,
    getMatchData,
    getPublicStats,
    shouldShowFeature,
    getLimitedPreview,
    isAuthenticated,
    authStatus: {
      isAuthenticated,
      userRole: user?.role,
      isOnboarded: user?.onboarded,
      canAccessFullData: isAuthenticated && user?.onboarded
    }
  }
}

// Utility function for API responses
export function withAuthDataLimiting(apiResponse, filterOptions = {}) {
  const { isAuthenticated } = useAuth()
  
  if (!isAuthenticated && SecurityConfig.privacy.limitPublicData) {
    return {
      ...apiResponse,
      data: filterPublicData(apiResponse.data, filterOptions),
      meta: {
        ...apiResponse.meta,
        limited: true,
        message: 'Limited data for unauthenticated users'
      }
    }
  }
  
  return apiResponse
}