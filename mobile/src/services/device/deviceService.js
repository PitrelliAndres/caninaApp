/**
 * Device Service
 * Pure React Native implementation using react-native-device-info
 * Replaces expo-device
 */

import DeviceInfo from 'react-native-device-info';
import { Platform } from 'react-native';

/**
 * Get device information
 * @returns {Promise<Object>} Device info object
 */
export const getDeviceInfo = async () => {
  try {
    const [
      deviceId,
      deviceName,
      systemName,
      systemVersion,
      brand,
      model,
      appVersion,
      buildNumber,
      bundleId,
      isEmulator,
    ] = await Promise.all([
      DeviceInfo.getUniqueId(),
      DeviceInfo.getDeviceName(),
      DeviceInfo.getSystemName(),
      DeviceInfo.getSystemVersion(),
      DeviceInfo.getBrand(),
      DeviceInfo.getModel(),
      DeviceInfo.getVersion(),
      DeviceInfo.getBuildNumber(),
      DeviceInfo.getBundleId(),
      DeviceInfo.isEmulator(),
    ]);

    return {
      deviceId,
      deviceName,
      systemName,
      systemVersion,
      brand,
      model,
      platform: Platform.OS,
      appVersion,
      buildNumber,
      bundleId,
      isEmulator,
    };
  } catch (error) {
    console.error('Error getting device info:', error);
    return null;
  }
};

/**
 * Get device type (phone, tablet, etc.)
 * @returns {Promise<string>}
 */
export const getDeviceType = async () => {
  try {
    const isTablet = await DeviceInfo.isTablet();
    return isTablet ? 'tablet' : 'phone';
  } catch (error) {
    console.error('Error getting device type:', error);
    return 'unknown';
  }
};

/**
 * Get device manufacturer
 * @returns {Promise<string>}
 */
export const getManufacturer = async () => {
  try {
    return await DeviceInfo.getManufacturer();
  } catch (error) {
    console.error('Error getting manufacturer:', error);
    return 'unknown';
  }
};

/**
 * Get app version
 * @returns {string}
 */
export const getAppVersion = () => {
  return DeviceInfo.getVersion();
};

/**
 * Get build number
 * @returns {string}
 */
export const getBuildNumber = () => {
  return DeviceInfo.getBuildNumber();
};

/**
 * Check if device is a tablet
 * @returns {Promise<boolean>}
 */
export const isTablet = async () => {
  try {
    return await DeviceInfo.isTablet();
  } catch (error) {
    console.error('Error checking if tablet:', error);
    return false;
  }
};

/**
 * Check if running on emulator/simulator
 * @returns {Promise<boolean>}
 */
export const isEmulator = async () => {
  try {
    return await DeviceInfo.isEmulator();
  } catch (error) {
    console.error('Error checking if emulator:', error);
    return false;
  }
};

/**
 * Get system name (iOS, Android, etc.)
 * @returns {string}
 */
export const getSystemName = () => {
  return DeviceInfo.getSystemName();
};

/**
 * Get system version
 * @returns {string}
 */
export const getSystemVersion = () => {
  return DeviceInfo.getSystemVersion();
};

/**
 * Get device unique ID
 * @returns {Promise<string>}
 */
export const getUniqueId = async () => {
  try {
    return await DeviceInfo.getUniqueId();
  } catch (error) {
    console.error('Error getting unique ID:', error);
    return null;
  }
};

/**
 * Get device model
 * @returns {string}
 */
export const getModel = () => {
  return DeviceInfo.getModel();
};

/**
 * Get device brand
 * @returns {string}
 */
export const getBrand = () => {
  return DeviceInfo.getBrand();
};

/**
 * Get bundle ID / package name
 * @returns {string}
 */
export const getBundleId = () => {
  return DeviceInfo.getBundleId();
};

/**
 * Check if device has notch
 * @returns {boolean}
 */
export const hasNotch = () => {
  return DeviceInfo.hasNotch();
};

/**
 * Get readable device name (e.g., "iPhone 14 Pro", "Samsung Galaxy S23")
 * @returns {Promise<string>}
 */
export const getReadableDeviceName = async () => {
  try {
    const [brand, model] = await Promise.all([
      DeviceInfo.getBrand(),
      DeviceInfo.getModel(),
    ]);
    return `${brand} ${model}`;
  } catch (error) {
    console.error('Error getting readable device name:', error);
    return 'Unknown Device';
  }
};

export default {
  getDeviceInfo,
  getDeviceType,
  getManufacturer,
  getAppVersion,
  getBuildNumber,
  isTablet,
  isEmulator,
  getSystemName,
  getSystemVersion,
  getUniqueId,
  getModel,
  getBrand,
  getBundleId,
  hasNotch,
  getReadableDeviceName,
};
