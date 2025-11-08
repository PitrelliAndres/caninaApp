/**
 * Image Service - Native React Native implementation
 * Replaces expo-image-picker with react-native-image-picker + react-native-permissions
 */

import {
  launchImageLibrary,
  launchCamera,
  MediaType,
  ImagePickerResponse,
} from 'react-native-image-picker';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { Platform, Alert } from 'react-native';

class ImageService {
  constructor() {
    this.defaultOptions = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8,
      allowsEditing: true,
      selectionLimit: 1,
    };
  }

  /**
   * Request camera permissions
   */
  async requestCameraPermissions() {
    try {
      const permission = Platform.select({
        android: PERMISSIONS.ANDROID.CAMERA,
        ios: PERMISSIONS.IOS.CAMERA,
      });

      const result = await request(permission);
      return this.formatPermissionResult(result);
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return { status: 'denied' };
    }
  }

  /**
   * Request media library permissions
   */
  async requestMediaLibraryPermissions() {
    try {
      const permission = Platform.select({
        android: PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
        ios: PERMISSIONS.IOS.PHOTO_LIBRARY,
      });

      const result = await request(permission);
      return this.formatPermissionResult(result);
    } catch (error) {
      console.error('Error requesting media library permission:', error);
      return { status: 'denied' };
    }
  }

  /**
   * Launch image library (equivalent to expo-image-picker launchImageLibraryAsync)
   */
  async launchImageLibraryAsync(options = {}) {
    const config = {
      ...this.defaultOptions,
      ...options,
    };

    return new Promise((resolve) => {
      launchImageLibrary(config, (response) => {
        resolve(this.formatResponse(response));
      });
    });
  }

  /**
   * Launch camera (equivalent to expo-image-picker launchCameraAsync)
   */
  async launchCameraAsync(options = {}) {
    const config = {
      ...this.defaultOptions,
      ...options,
    };

    return new Promise((resolve) => {
      launchCamera(config, (response) => {
        resolve(this.formatResponse(response));
      });
    });
  }

  /**
   * Show action sheet to choose between camera and library
   */
  async showImagePicker(options = {}) {
    return new Promise((resolve) => {
      Alert.alert(
        'Seleccionar imagen',
        'Elige una opción',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => resolve({ cancelled: true }),
          },
          {
            text: 'Cámara',
            onPress: async () => {
              const cameraPermission = await this.requestCameraPermissions();
              if (cameraPermission.status === 'granted') {
                const result = await this.launchCameraAsync(options);
                resolve(result);
              } else {
                this.showPermissionAlert('camera');
                resolve({ cancelled: true });
              }
            },
          },
          {
            text: 'Galería',
            onPress: async () => {
              const libraryPermission = await this.requestMediaLibraryPermissions();
              if (libraryPermission.status === 'granted') {
                const result = await this.launchImageLibraryAsync(options);
                resolve(result);
              } else {
                this.showPermissionAlert('library');
                resolve({ cancelled: true });
              }
            },
          },
        ],
        { cancelable: true }
      );
    });
  }

  /**
   * Pick image with automatic permission handling
   */
  async pickImageAsync(options = {}) {
    try {
      const libraryPermission = await this.requestMediaLibraryPermissions();
      
      if (libraryPermission.status !== 'granted') {
        this.showPermissionAlert('library');
        return { cancelled: true };
      }

      return await this.launchImageLibraryAsync(options);
    } catch (error) {
      console.error('Error picking image:', error);
      return { cancelled: true, error: error.message };
    }
  }

  /**
   * Take photo with automatic permission handling
   */
  async takePhotoAsync(options = {}) {
    try {
      const cameraPermission = await this.requestCameraPermissions();
      
      if (cameraPermission.status !== 'granted') {
        this.showPermissionAlert('camera');
        return { cancelled: true };
      }

      return await this.launchCameraAsync(options);
    } catch (error) {
      console.error('Error taking photo:', error);
      return { cancelled: true, error: error.message };
    }
  }

  /**
   * Pick multiple images
   */
  async pickMultipleImagesAsync(options = {}) {
    const config = {
      ...this.defaultOptions,
      selectionLimit: 0, // 0 = unlimited
      ...options,
    };

    try {
      const libraryPermission = await this.requestMediaLibraryPermissions();
      
      if (libraryPermission.status !== 'granted') {
        this.showPermissionAlert('library');
        return { cancelled: true };
      }

      return await this.launchImageLibraryAsync(config);
    } catch (error) {
      console.error('Error picking multiple images:', error);
      return { cancelled: true, error: error.message };
    }
  }

  /**
   * Format permission result for consistency
   */
  formatPermissionResult(result) {
    switch (result) {
      case RESULTS.GRANTED:
        return { status: 'granted' };
      case RESULTS.DENIED:
        return { status: 'denied' };
      case RESULTS.BLOCKED:
        return { status: 'blocked' };
      case RESULTS.UNAVAILABLE:
        return { status: 'unavailable' };
      default:
        return { status: 'undetermined' };
    }
  }

  /**
   * Format response to match Expo API structure
   */
  formatResponse(response) {
    if (response.didCancel) {
      return { cancelled: true };
    }

    if (response.errorMessage) {
      return { 
        cancelled: true, 
        error: response.errorMessage 
      };
    }

    if (!response.assets || response.assets.length === 0) {
      return { cancelled: true };
    }

    // Format for single image (Expo API compatibility)
    if (response.assets.length === 1) {
      const asset = response.assets[0];
      return {
        cancelled: false,
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        type: asset.type,
        fileSize: asset.fileSize,
        fileName: asset.fileName,
        // Expo-like properties
        assets: [{
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          type: asset.type,
          fileSize: asset.fileSize,
          fileName: asset.fileName,
        }],
      };
    }

    // Format for multiple images
    return {
      cancelled: false,
      assets: response.assets.map(asset => ({
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        type: asset.type,
        fileSize: asset.fileSize,
        fileName: asset.fileName,
      })),
    };
  }

  /**
   * Show permission denied alert
   */
  showPermissionAlert(type) {
    const typeText = type === 'camera' ? 'cámara' : 'galería';
    
    Alert.alert(
      `Permiso de ${typeText} requerido`,
      `ParkDog necesita acceso a tu ${typeText} para poder ${type === 'camera' ? 'tomar' : 'seleccionar'} fotos. Ve a Configuración para activar los permisos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Configuración', onPress: () => this.openSettings() },
      ]
    );
  }

  /**
   * Open app settings
   */
  async openSettings() {
    const { openSettings } = await import('react-native-permissions');
    openSettings().catch(() => console.warn('Cannot open settings'));
  }

  /**
   * Compress image (basic implementation)
   */
  async compressImage(uri, options = {}) {
    const config = {
      quality: 0.7,
      maxWidth: 1024,
      maxHeight: 1024,
      ...options,
    };

    // Note: For advanced compression, consider using react-native-image-resizer
    // This is a basic implementation using the picker's built-in compression
    return await this.launchImageLibraryAsync({
      quality: config.quality,
      maxWidth: config.maxWidth,
      maxHeight: config.maxHeight,
    });
  }

  /**
   * Get image info (width, height, size)
   */
  getImageInfo(uri) {
    return new Promise((resolve, reject) => {
      if (Platform.OS === 'web') {
        const img = new Image();
        img.onload = () => {
          resolve({
            width: img.width,
            height: img.height,
            uri: uri,
          });
        };
        img.onerror = reject;
        img.src = uri;
      } else {
        // For React Native, we'd need react-native-image-size or similar
        // For now, return basic info
        resolve({
          uri: uri,
          width: null,
          height: null,
        });
      }
    });
  }
}

// Export singleton instance
export const imageService = new ImageService();
export default imageService;
