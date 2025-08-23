// mobile/src/hooks/useAuth.js
import { useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { authService } from '../services/api/auth'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      // Check for stored token
      const token = await AsyncStorage.getItem('authToken')
      const userData = await AsyncStorage.getItem('userData')
      
      if (token && userData) {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        setIsAuthenticated(true)
        
        // Verify token is still valid
        try {
          const currentUser = await authService.getCurrentUser()
          setUser(currentUser)
        } catch (error) {
          // Token might be expired, clear storage
          await clearAuth()
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (token, userData) => {
    try {
      await AsyncStorage.setItem('authToken', token)
      await AsyncStorage.setItem('userData', JSON.stringify(userData))
      setUser(userData)
      setIsAuthenticated(true)
      return true
    } catch (error) {
      console.error('Error storing auth data:', error)
      return false
    }
  }

  const logout = async () => {
    try {
      await clearAuth()
      return true
    } catch (error) {
      console.error('Error during logout:', error)
      return false
    }
  }

  const clearAuth = async () => {
    await AsyncStorage.removeItem('authToken')
    await AsyncStorage.removeItem('userData')
    setUser(null)
    setIsAuthenticated(false)
  }

  const updateUser = async (updatedUser) => {
    try {
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser))
      setUser(updatedUser)
    } catch (error) {
      console.error('Error updating user data:', error)
    }
  }

  return {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    updateUser,
    clearAuth,
  }
}