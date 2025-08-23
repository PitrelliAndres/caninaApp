import { useState, useEffect, useRef } from 'react'
import { parkService } from '../services/api/parks'

export function useParks(filters = {}) {
  const [parks, setParks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const lastFiltersRef = useRef()
  const loadingRef = useRef(false)

  useEffect(() => {
    // Evitar requests múltiples si ya está cargando
    if (loadingRef.current) return
    
    // Solo cargar si los filtros realmente cambiaron
    const currentFiltersStr = JSON.stringify(filters)
    const lastFiltersStr = JSON.stringify(lastFiltersRef.current)
    
    if (currentFiltersStr !== lastFiltersStr) {
      lastFiltersRef.current = filters
      loadParks()
    }
  }, [filters])

  const loadParks = async () => {
    try {
      loadingRef.current = true
      setLoading(true)
      setError(null)
      
      let response
      if (filters.search) {
        response = await parkService.searchParks(filters.search, filters)
      } else if (filters.latitude && filters.longitude) {
        response = await parkService.getNearbyParks(filters.latitude, filters.longitude, filters.radius)
      } else {
        response = await parkService.getParks(filters)
      }
      
      setParks(response.parks || [])
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }

  return {
    parks,
    loading,
    error,
    refetch: loadParks,
  }
}