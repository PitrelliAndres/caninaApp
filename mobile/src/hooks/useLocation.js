/**
 * useLocation Hook
 * Pure React Native implementation using locationService
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import locationService from '../services/location/locationService';

export function useLocation() {
  const { t } = useTranslation();
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const requestPermission = async () => {
    try {
      setLoading(true);
      setError(null);

      const granted = await locationService.requestLocationPermission();

      if (!granted) {
        const errorMsg = t('permissions.location.message');
        setError(errorMsg);
        Toast.show({
          type: 'info',
          text1: t('permissions.location.title'),
          text2: errorMsg,
        });
        return false;
      }

      const currentLocation = await locationService.getCurrentPosition();
      setLocation({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      });

      return true;
    } catch (error) {
      setError(error.message);
      Toast.show({
        type: 'error',
        text1: t('errors.generic'),
        text2: error.message,
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const watchLocation = (callback) => {
    return locationService.watchPosition(
      (position) => {
        callback({
          coords: {
            latitude: position.latitude,
            longitude: position.longitude,
            accuracy: position.accuracy,
            altitude: position.altitude,
            heading: position.heading,
            speed: position.speed,
          },
          timestamp: position.timestamp,
        });
      },
      (error) => {
        setError(error.message);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 10, // meters
        interval: 10000, // ms
      }
    );
  };

  return {
    location,
    loading,
    error,
    requestPermission,
    watchLocation,
  };
}
