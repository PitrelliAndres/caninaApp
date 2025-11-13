/**
 * Push Notification Service
 * Handles FCM (Firebase Cloud Messaging) for iOS and Android
 *
 * Features:
 * - Request notification permissions
 * - Register/update FCM tokens with backend
 * - Handle foreground/background notifications
 * - Deep linking to conversations
 * - Automatic token refresh
 *
 * Dependencies (install with):
 * npm install @react-native-firebase/app @react-native-firebase/messaging
 * npm install @notifee/react-native (for advanced notifications)
 */

import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, AndroidStyle } from '@notifee/react-native';
import { Platform, Alert } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import api from './api';

class PushNotificationService {
  constructor() {
    this.initialized = false;
    this.currentToken = null;
    this.unsubscribeTokenRefresh = null;
    this.unsubscribeOnMessage = null;
    this.unsubscribeOnNotificationOpenedApp = null;
    this.navigationRef = null; // Will be set from App.js
  }

  /**
   * Initialize push notifications
   * Call this once on app startup after user login
   */
  async initialize(userId) {
    if (this.initialized) {
      console.log('[PushNotificationService] Already initialized');
      return;
    }

    try {
      console.log('[PushNotificationService] Initializing...');

      // 1. Request permissions
      const hasPermission = await this.requestPermission();

      if (!hasPermission) {
        console.warn('[PushNotificationService] Notification permission denied');
        return;
      }

      // 2. Get FCM token
      const token = await this.getFCMToken();

      if (!token) {
        console.error('[PushNotificationService] Failed to get FCM token');
        return;
      }

      this.currentToken = token;

      // 3. Register token with backend
      await this.registerToken(token, userId);

      // 4. Setup notification handlers
      this.setupForegroundHandler();
      this.setupBackgroundHandler();
      this.setupNotificationOpenedHandler();

      // 5. Setup token refresh listener
      this.setupTokenRefreshListener(userId);

      // 6. Create notification channels (Android)
      if (Platform.OS === 'android') {
        await this.createNotificationChannels();
      }

      this.initialized = true;
      console.log('[PushNotificationService] Initialized successfully');

    } catch (error) {
      console.error('[PushNotificationService] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermission() {
    try {
      const authStatus = await messaging().requestPermission();

      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('[PushNotificationService] Notification permission granted:', authStatus);
      } else {
        console.log('[PushNotificationService] Notification permission denied');
      }

      return enabled;
    } catch (error) {
      console.error('[PushNotificationService] Permission request failed:', error);
      return false;
    }
  }

  /**
   * Get FCM token
   */
  async getFCMToken() {
    try {
      // Check if app can receive messages
      const enabled = await messaging().hasPermission();

      if (!enabled) {
        console.warn('[PushNotificationService] No permission to receive messages');
        return null;
      }

      // Get token
      const token = await messaging().getToken();
      console.log('[PushNotificationService] FCM Token:', token);

      return token;
    } catch (error) {
      console.error('[PushNotificationService] Get token failed:', error);
      return null;
    }
  }

  /**
   * Register FCM token with backend
   */
  async registerToken(token, userId) {
    try {
      const deviceInfo = {
        device_id: await DeviceInfo.getUniqueId(),
        app_version: DeviceInfo.getVersion(),
        os_version: await DeviceInfo.getBaseOs(),
        device_model: await DeviceInfo.getDeviceName(),
      };

      const response = await api.post('/api/v1/devices/register', {
        token,
        platform: Platform.OS, // 'ios' or 'android'
        ...deviceInfo,
      });

      console.log('[PushNotificationService] Token registered:', response.data);
      return response.data;
    } catch (error) {
      console.error('[PushNotificationService] Token registration failed:', error);
      throw error;
    }
  }

  /**
   * Setup foreground notification handler
   * Shows notifications when app is open
   */
  setupForegroundHandler() {
    this.unsubscribeOnMessage = messaging().onMessage(async (remoteMessage) => {
      console.log('[PushNotificationService] Foreground notification:', remoteMessage);

      // Display notification using Notifee for better UI
      await this.displayNotification(remoteMessage);
    });
  }

  /**
   * Setup background notification handler
   * Handles notifications when app is in background
   */
  setupBackgroundHandler() {
    // This must be called outside of component lifecycle
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('[PushNotificationService] Background notification:', remoteMessage);

      // Process notification in background
      // (e.g., update local database, show badge)
    });
  }

  /**
   * Setup notification opened handler
   * Handles when user taps on notification
   */
  setupNotificationOpenedHandler() {
    // Handle notification opened when app is in background
    this.unsubscribeOnNotificationOpenedApp = messaging().onNotificationOpenedApp(
      (remoteMessage) => {
        console.log('[PushNotificationService] Notification opened (background):', remoteMessage);
        this.handleNotificationOpen(remoteMessage);
      }
    );

    // Handle notification opened when app was quit
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('[PushNotificationService] Notification opened (quit):', remoteMessage);
          this.handleNotificationOpen(remoteMessage);
        }
      });
  }

  /**
   * Handle notification open (deep linking)
   */
  handleNotificationOpen(remoteMessage) {
    const { data } = remoteMessage;

    // Navigate based on notification type
    if (data?.type === 'message' && data?.conversation_id) {
      // Navigate to chat screen
      this.navigateToConversation(data.conversation_id, data.sender_id);
    } else if (data?.type === 'match' && data?.match_id) {
      // Navigate to matches screen
      this.navigateToMatches();
    }
  }

  /**
   * Navigate to conversation (deep link)
   */
  navigateToConversation(conversationId, senderId) {
    if (!this.navigationRef) {
      console.warn('[PushNotificationService] Navigation ref not set');
      return;
    }

    try {
      this.navigationRef.navigate('DMChat', {
        conversationId,
        userId: senderId,
      });
    } catch (error) {
      console.error('[PushNotificationService] Navigation failed:', error);
    }
  }

  /**
   * Navigate to matches screen
   */
  navigateToMatches() {
    if (!this.navigationRef) {
      console.warn('[PushNotificationService] Navigation ref not set');
      return;
    }

    try {
      this.navigationRef.navigate('Matches');
    } catch (error) {
      console.error('[PushNotificationService] Navigation failed:', error);
    }
  }

  /**
   * Display notification using Notifee (better UX)
   */
  async displayNotification(remoteMessage) {
    const { notification, data } = remoteMessage;

    try {
      // Get appropriate channel ID
      const channelId = data?.type === 'message' ? 'messages' : 'general';

      await notifee.displayNotification({
        title: notification?.title || 'ParkDog',
        body: notification?.body || '',
        data,
        android: {
          channelId,
          importance: AndroidImportance.HIGH,
          style: {
            type: AndroidStyle.MESSAGING,
            person: {
              name: data?.sender_name || 'User',
            },
            messages: [
              {
                text: notification?.body || '',
                timestamp: Date.now(),
              },
            ],
          },
          smallIcon: 'ic_notification',
          pressAction: {
            id: 'default',
          },
        },
        ios: {
          sound: 'default',
          badgeCount: data?.badge_count ? parseInt(data.badge_count) : undefined,
        },
      });
    } catch (error) {
      console.error('[PushNotificationService] Display notification failed:', error);
    }
  }

  /**
   * Create notification channels (Android 8.0+)
   */
  async createNotificationChannels() {
    try {
      // Messages channel (high priority)
      await notifee.createChannel({
        id: 'messages',
        name: 'Messages',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
      });

      // General channel (normal priority)
      await notifee.createChannel({
        id: 'general',
        name: 'General Notifications',
        importance: AndroidImportance.DEFAULT,
        sound: 'default',
      });

      console.log('[PushNotificationService] Notification channels created');
    } catch (error) {
      console.error('[PushNotificationService] Create channels failed:', error);
    }
  }

  /**
   * Setup token refresh listener
   */
  setupTokenRefreshListener(userId) {
    this.unsubscribeTokenRefresh = messaging().onTokenRefresh(async (newToken) => {
      console.log('[PushNotificationService] Token refreshed:', newToken);

      this.currentToken = newToken;

      // Re-register with backend
      try {
        await this.registerToken(newToken, userId);
      } catch (error) {
        console.error('[PushNotificationService] Token refresh registration failed:', error);
      }
    });
  }

  /**
   * Unregister token (on logout)
   */
  async unregisterToken() {
    if (!this.currentToken) return;

    try {
      await api.post('/api/v1/devices/unregister', {
        token: this.currentToken,
      });

      console.log('[PushNotificationService] Token unregistered');
    } catch (error) {
      console.error('[PushNotificationService] Token unregistration failed:', error);
    }
  }

  /**
   * Set navigation reference for deep linking
   */
  setNavigationRef(ref) {
    this.navigationRef = ref;
  }

  /**
   * Cleanup on logout
   */
  async cleanup() {
    if (!this.initialized) return;

    try {
      console.log('[PushNotificationService] Cleaning up...');

      // Unregister token
      await this.unregisterToken();

      // Unsubscribe listeners
      if (this.unsubscribeTokenRefresh) {
        this.unsubscribeTokenRefresh();
        this.unsubscribeTokenRefresh = null;
      }

      if (this.unsubscribeOnMessage) {
        this.unsubscribeOnMessage();
        this.unsubscribeOnMessage = null;
      }

      if (this.unsubscribeOnNotificationOpenedApp) {
        this.unsubscribeOnNotificationOpenedApp();
        this.unsubscribeOnNotificationOpenedApp = null;
      }

      this.currentToken = null;
      this.navigationRef = null;
      this.initialized = false;

      console.log('[PushNotificationService] Cleanup complete');
    } catch (error) {
      console.error('[PushNotificationService] Cleanup failed:', error);
    }
  }

  /**
   * Get current token
   */
  getCurrentToken() {
    return this.currentToken;
  }

  /**
   * Check if initialized
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * Test notification
   */
  async testNotification() {
    if (!this.currentToken) {
      Alert.alert('Error', 'No FCM token available');
      return;
    }

    try {
      await api.post('/api/v1/devices/test', {
        token: this.currentToken,
        title: 'Test Notification',
        body: 'This is a test notification from ParkDog',
      });

      Alert.alert('Success', 'Test notification sent');
    } catch (error) {
      console.error('[PushNotificationService] Test notification failed:', error);
      Alert.alert('Error', 'Failed to send test notification');
    }
  }
}

// Export singleton instance
const pushNotificationService = new PushNotificationService();

// Setup background handler at module level (required by Firebase)
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('[PushNotificationService] Background message:', remoteMessage);
});

export default pushNotificationService;
