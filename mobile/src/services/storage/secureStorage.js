/**
 * Secure Storage Service - Native React Native implementation  
 * Replaces expo-secure-store with react-native-keychain
 */

import * as Keychain from 'react-native-keychain';

class SecureStorageService {
  constructor() {
    // Default keychain options
    this.defaultOptions = {
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE,
      accessGroup: 'com.parkdog.app.shared',
      authenticatePrompt: 'Autenticar para acceder a datos seguros',
      service: 'ParkDogApp',
      storage: Keychain.STORAGE_TYPE.KC, // Use Keychain on iOS, EncryptedSharedPreferences on Android
    };
  }

  /**
   * Store a secure item (equivalent to expo-secure-store setItemAsync)
   */
  async setItemAsync(key, value, options = {}) {
    try {
      const config = {
        ...this.defaultOptions,
        ...options,
        service: key, // Use key as service name for individual storage
      };

      const result = await Keychain.setInternetCredentials(
        key,
        key, // username
        value, // password (our actual value)
        config
      );

      if (result === false) {
        throw new Error('Failed to store secure item');
      }

      return result;
    } catch (error) {
      console.error(`SecureStorage setItem error for key "${key}":`, error);
      throw this.formatError(error);
    }
  }

  /**
   * Retrieve a secure item (equivalent to expo-secure-store getItemAsync)
   */
  async getItemAsync(key, options = {}) {
    try {
      const config = {
        ...this.defaultOptions,
        ...options,
        service: key,
      };

      const credentials = await Keychain.getInternetCredentials(key, config);

      if (credentials === false) {
        return null; // Item doesn't exist
      }

      return credentials.password; // Return the stored value
    } catch (error) {
      console.error(`SecureStorage getItem error for key "${key}":`, error);
      
      // Return null for user cancellation (biometric prompt cancelled)
      if (error.message?.includes('UserCancel') || error.message?.includes('UserFallback')) {
        return null;
      }
      
      throw this.formatError(error);
    }
  }

  /**
   * Delete a secure item (equivalent to expo-secure-store deleteItemAsync)
   */
  async deleteItemAsync(key, options = {}) {
    try {
      const config = {
        ...this.defaultOptions,
        ...options,
        service: key,
      };

      const result = await Keychain.resetInternetCredentials(key, config);
      return result;
    } catch (error) {
      console.error(`SecureStorage deleteItem error for key "${key}":`, error);
      // Don't throw on delete errors - item might not exist
      return false;
    }
  }

  /**
   * Check if an item exists
   */
  async hasItemAsync(key, options = {}) {
    try {
      const value = await this.getItemAsync(key, options);
      return value !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear all stored items (use with caution)
   */
  async clearAll() {
    try {
      const result = await Keychain.resetGenericPassword(this.defaultOptions);
      return result;
    } catch (error) {
      console.error('SecureStorage clearAll error:', error);
      throw this.formatError(error);
    }
  }

  /**
   * Get security level information
   */
  async getSecurityLevel() {
    try {
      const securityLevel = await Keychain.getSecurityLevel();
      return {
        level: securityLevel,
        isBiometryAvailable: await Keychain.getSupportedBiometryType() !== null,
        biometryType: await Keychain.getSupportedBiometryType(),
      };
    } catch (error) {
      console.warn('Could not get security level:', error);
      return {
        level: 'NONE',
        isBiometryAvailable: false,
        biometryType: null,
      };
    }
  }

  /**
   * Store credentials specifically (username/password pair)
   */
  async setCredentials(service, username, password, options = {}) {
    try {
      const config = {
        ...this.defaultOptions,
        ...options,
        service,
      };

      const result = await Keychain.setInternetCredentials(
        service,
        username,
        password,
        config
      );

      return result;
    } catch (error) {
      console.error(`SecureStorage setCredentials error for service "${service}":`, error);
      throw this.formatError(error);
    }
  }

  /**
   * Get credentials specifically
   */
  async getCredentials(service, options = {}) {
    try {
      const config = {
        ...this.defaultOptions,
        ...options,
        service,
      };

      const credentials = await Keychain.getInternetCredentials(service, config);

      if (credentials === false) {
        return null;
      }

      return {
        username: credentials.username,
        password: credentials.password,
        service: credentials.service,
      };
    } catch (error) {
      console.error(`SecureStorage getCredentials error for service "${service}":`, error);
      
      if (error.message?.includes('UserCancel') || error.message?.includes('UserFallback')) {
        return null;
      }
      
      throw this.formatError(error);
    }
  }

  /**
   * Batch operations for better performance
   */
  async setMultiple(items, options = {}) {
    const results = {};
    
    for (const [key, value] of Object.entries(items)) {
      try {
        results[key] = await this.setItemAsync(key, value, options);
      } catch (error) {
        results[key] = { error: error.message };
      }
    }
    
    return results;
  }

  async getMultiple(keys, options = {}) {
    const results = {};
    
    for (const key of keys) {
      try {
        results[key] = await this.getItemAsync(key, options);
      } catch (error) {
        results[key] = null;
      }
    }
    
    return results;
  }

  /**
   * Format error for consistency
   */
  formatError(error) {
    // Map react-native-keychain errors to expo-secure-store-like errors
    const errorMessage = error.message || 'Unknown secure storage error';
    
    if (errorMessage.includes('UserCancel')) {
      return new Error('User cancelled authentication');
    }
    
    if (errorMessage.includes('BiometryNotAvailable')) {
      return new Error('Biometry not available');
    }
    
    if (errorMessage.includes('BiometryNotEnrolled')) {
      return new Error('Biometry not enrolled');
    }
    
    if (errorMessage.includes('DeviceLockedPermanently')) {
      return new Error('Device permanently locked');
    }
    
    return new Error(errorMessage);
  }

  /**
   * Migration helper from AsyncStorage to SecureStorage
   */
  async migrateFromAsyncStorage(key, AsyncStorage) {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value !== null) {
        await this.setItemAsync(key, value);
        await AsyncStorage.removeItem(key);
        console.log(`Migrated ${key} from AsyncStorage to SecureStorage`);
        return true;
      }
      return false;
    } catch (error) {
      console.warn(`Failed to migrate ${key} from AsyncStorage:`, error);
      return false;
    }
  }
}

// Export singleton instance
export const secureStorage = new SecureStorageService();
export default secureStorage;
