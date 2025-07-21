import { useState, useEffect } from 'react'
import * as Location from 'expo-location'
import { useTranslation } from 'react-i18next'
import Toast from 'react-native-toast-message'

export function useLocation() {
  const { t } = useTranslation()
  const [location, setLocation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const requestPermission = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { status } = await Location.requestForegroundPermissionsAsync()
      
      if (status !== 'granted') {
        setError(t('permissions.location.message'))
        Toast.show({
          type: 'info',
          text1: t('permissions.location.title'),
          text2: t('permissions.location.message'),
        })
        return false
      }

      const currentLocation = await Location.getCurrentPositionAsync({})
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      })
      
      return true
    } catch (error) {
      setError(error.message)
      Toast.show({
        type: 'error',
        text1: t('errors.generic'),
        text2: error.message,
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  const watchLocation = (callback) => {
    return Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
        distanceInterval: 10,
      },
      callback
    )
  }

  return {
    location,
    loading,
    error,
    requestPermission,
    watchLocation,
  }
}