/**
 * App.js Integration Example
 * Shows how to initialize the chat system in your main App component
 *
 * Copy this logic into your existing App.js or App.tsx file
 */

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { Provider } from 'react-redux';
import { store } from './store';
import chatIntegration from './services/chatIntegration';

// Your existing app imports
// import { NavigationContainer } from '@react-navigation/native';
// import RootNavigator from './navigation/RootNavigator';
// etc.

function App() {
  const [chatInitialized, setChatInitialized] = useState(false);
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    initializeChatSystem();

    return () => {
      // Cleanup on unmount
      chatIntegration.cleanup();
    };
  }, []);

  const initializeChatSystem = async () => {
    try {
      console.log('[App] Initializing chat system...');

      // Initialize SQLite + MessageSyncEngine + WebSocket integration
      await chatIntegration.initialize();

      // Get initial stats (optional, for debugging)
      const stats = await chatIntegration.getStats();
      console.log('[App] Chat stats:', stats);

      setChatInitialized(true);
      console.log('[App] Chat system ready');

    } catch (error) {
      console.error('[App] Chat initialization failed:', error);
      setInitError(error.message);

      // Don't block app startup - chat will work in degraded mode
      // (HTTP only, no offline support)
      setChatInitialized(true);
    }
  };

  // Optional: Show loading screen while initializing
  // if (!chatInitialized) {
  //   return (
  //     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
  //       <ActivityIndicator size="large" />
  //       <Text>Initializing chat...</Text>
  //     </View>
  //   );
  // }

  // Optional: Show error if initialization failed
  if (initError) {
    console.warn('[App] Chat running in degraded mode:', initError);
  }

  return (
    <Provider store={store}>
      {/* Your existing app structure */}
      {/* <NavigationContainer> */}
      {/*   <RootNavigator /> */}
      {/* </NavigationContainer> */}

      {/* Example: Show chat status in dev mode */}
      {__DEV__ && initError && (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'orange', padding: 8 }}>
          <Text style={{ color: 'white', fontSize: 12 }}>
            Chat: Degraded mode ({initError})
          </Text>
        </View>
      )}
    </Provider>
  );
}

export default App;

// ============================================
// LOGOUT HANDLER EXAMPLE
// ============================================

/**
 * When user logs out, clear all chat data
 * Add this to your logout handler
 */
export async function handleLogout() {
  try {
    // Clear auth tokens
    // await clearAuthTokens();

    // Clear chat data from SQLite
    await chatIntegration.clearAllData();

    // Navigate to login screen
    // navigation.navigate('Login');

  } catch (error) {
    console.error('[App] Logout failed:', error);
  }
}

// ============================================
// USAGE IN COMPONENTS
// ============================================

/**
 * Example: Get chat stats in a debug screen
 */
export async function getChatStats() {
  const stats = await chatIntegration.getStats();

  console.log('Chat Statistics:', {
    messages: stats.messages,
    conversations: stats.conversations,
    pendingMessages: stats.pendingMessages,
    unreadConversations: stats.unreadConversations,
    queueDepth: stats.queue.pending,
    isSyncing: stats.isSyncing,
    isOnline: stats.isOnline,
  });

  return stats;
}

// ============================================
// TESTING HELPERS
// ============================================

/**
 * Example: Test offline mode
 */
export function simulateOfflineMode() {
  // MessageSyncEngine will detect network state via NetInfo
  // You can test by toggling airplane mode or using dev tools

  console.log('Test offline mode:');
  console.log('1. Enable airplane mode');
  console.log('2. Send a message - it will be queued');
  console.log('3. Disable airplane mode');
  console.log('4. Message will auto-send after ~2-5 seconds');
}

/**
 * Example: Force sync
 */
export async function forceSync() {
  try {
    await store.dispatch(syncAllData()).unwrap();
    console.log('Sync completed successfully');
  } catch (error) {
    console.error('Sync failed:', error);
  }
}
