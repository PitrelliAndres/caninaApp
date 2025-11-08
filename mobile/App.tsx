import React, { useEffect, useState } from 'react'
import { StatusBar } from 'react-native'
import { Provider as PaperProvider } from 'react-native-paper'
import { Provider as ReduxProvider } from 'react-redux'
import { NavigationContainer } from '@react-navigation/native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import { I18nextProvider } from 'react-i18next'

import { store } from './src/store'
import { theme } from './src/theme'
import i18n from './src/i18n'
import { AppNavigator } from './src/navigation/AppNavigator'
import { toastConfig } from './src/utils/toastConfig'
import { secureStorage } from './src/services/storage/secureStorage'
import { fetchCurrentUser } from './src/store/slices/userSlice'

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false)

  useEffect(() => {
    async function prepare() {
      try {
        // Check if user is logged in by verifying token
        const token = await secureStorage.getItemAsync('jwt_token')

        if (token) {
          // User has a token, fetch current user data
          try {
            await store.dispatch(fetchCurrentUser()).unwrap()
          } catch (error) {
            console.warn('Failed to restore session:', error)
            // Token might be expired, clear it
            await secureStorage.deleteItemAsync('jwt_token')
            await secureStorage.deleteItemAsync('refresh_token')
            await secureStorage.deleteItemAsync('realtime_token')
          }
        }

        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.warn('App initialization error:', error)
      } finally {
        setAppIsReady(true)
      }
    }

    prepare()
  }, [])

  // Show nothing while app is not ready
  if (!appIsReady) {
    return null
  }

  return (
    <ReduxProvider store={store}>
      <I18nextProvider i18n={i18n}>
        <PaperProvider theme={theme}>
          <SafeAreaProvider>
            <StatusBar
              barStyle={theme.dark ? 'light-content' : 'dark-content'}
              backgroundColor={theme.colors.surface}
              translucent={false}
            />
            <NavigationContainer>
              <AppNavigator />
              <Toast config={toastConfig} />
            </NavigationContainer>
          </SafeAreaProvider>
        </PaperProvider>
      </I18nextProvider>
    </ReduxProvider>
  )
}
