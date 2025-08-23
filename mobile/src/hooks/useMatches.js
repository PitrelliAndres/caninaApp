import { useState, useEffect } from 'react'
import { matchService } from '../services/api/matches'

export function useMatches() {
  const [suggestions, setSuggestions] = useState([])
  const [mutualMatches, setMutualMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [suggestionsRes, mutualRes] = await Promise.all([
        matchService.getSuggestedMatches(),
        matchService.getMatches()
      ])
      
      setSuggestions(suggestionsRes.suggestions || [])
      setMutualMatches(mutualRes.matches || [])
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return {
    suggestions,
    mutualMatches,
    loading,
    error,
    refetch: loadData,
  }
}