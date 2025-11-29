/**
 * Location Service
 * Pure React Native implementation using @react-native-community/geolocation
 */

import Geolocation from '@react-native-community/geolocation';
import { Platform, PermissionsAndroid } from 'react-native';

/**
 * Request location permissions
 * @returns {Promise<boolean>} true if granted
 */
export const requestLocationPermission = async () => {
  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Permiso de Ubicación',
          message: 'ParkDog necesita acceso a tu ubicación para encontrar parques cercanos.',
          buttonNeutral: 'Preguntar después',
          buttonNegative: 'Cancelar',
          buttonPositive: 'Aceptar',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    // iOS: permissions handled in Info.plist, always return true
    return true;
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
};

/**
 * Get current position
 * @param {Object} options - Geolocation options
 * @returns {Promise<{latitude: number, longitude: number, accuracy: number}>}
 */
export const getCurrentPosition = (options = {}) => {
  return new Promise((resolve, reject) => {
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 10000,
      ...options,
    };

    Geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        console.error('Error getting current position:', error);
        reject(error);
      },
      defaultOptions
    );
  });
};

/**
 * Watch position changes
 * @param {Function} callback - Called on each position update
 * @param {Function} errorCallback - Called on errors
 * @param {Object} options - Geolocation options
 * @returns {number} watchId - Use to clear the watch later
 */
export const watchPosition = (callback, errorCallback, options = {}) => {
  const defaultOptions = {
    enableHighAccuracy: true,
    distanceFilter: 10, // meters
    interval: 5000, // ms
    fastestInterval: 2000, // ms
    ...options,
  };

  return Geolocation.watchPosition(
    (position) => {
      callback({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp,
      });
    },
    (error) => {
      console.error('Error watching position:', error);
      if (errorCallback) errorCallback(error);
    },
    defaultOptions
  );
};

/**
 * Clear position watch
 * @param {number} watchId - ID returned by watchPosition
 */
export const clearWatch = (watchId) => {
  Geolocation.clearWatch(watchId);
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

/**
 * Convert degrees to radians
 * @param {number} degrees
 * @returns {number} radians
 */
const toRad = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Format distance for display
 * @param {number} meters - Distance in meters
 * @returns {string} Formatted string (e.g., "1.2 km" or "350 m")
 */
export const formatDistance = (meters) => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
};

/**
 * Check if location services are enabled
 * @returns {Promise<boolean>}
 */
export const isLocationEnabled = async () => {
  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return granted;
    }
    // iOS: assume enabled if permission was granted before
    return true;
  } catch (error) {
    console.error('Error checking location status:', error);
    return false;
  }
};

export default {
  requestLocationPermission,
  getCurrentPosition,
  watchPosition,
  clearWatch,
  calculateDistance,
  formatDistance,
  isLocationEnabled,
};
