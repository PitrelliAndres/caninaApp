import React, { useEffect, useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import { Provider as PaperProvider } from 'react-native-paper'
import { Provider as ReduxProvider } from 'react-redux'
import { NavigationContainer } from '@react-navigation/native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import * as SplashScreen from 'expo-splash-screen'
import * as Font from 'expo-font'
import { I18nextProvider } from 'react-i18next'

import { store } from './src/store'
import { theme } from './src/theme'
import i18n from './src/i18n'
import { AppNavigator } from './src/navigation/AppNavigator'
import { toastConfig } from './src/utils/toastConfig'

// Mantener splash screen visible mientras cargamos recursos
SplashScreen.preventAutoHideAsync()

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false)

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-cargar fuentes
        await Font.loadAsync({
          'Roboto-Regular': require('./assets/fonts/Roboto-Regular.ttf'),
          'Roboto-Medium': require('./assets/fonts/Roboto-Medium.ttf'),
          'Roboto-Bold': require('./assets/fonts/Roboto-Bold.ttf'),
        })
      } catch (e) {
        console.warn(e)
      } finally {
        setAppIsReady(true)
      }
    }

    prepare()
  }, [])

  const onLayoutRootView = React.useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync()
    }
  }, [appIsReady])

  if (!appIsReady) {
    return null
  }

  return (
    <ReduxProvider store={store}>
      <I18nextProvider i18n={i18n}>
        <PaperProvider theme={theme}>
          <SafeAreaProvider onLayout={onLayoutRootView}>
            <NavigationContainer>
              <StatusBar style="auto" />
              <AppNavigator />
              <Toast config={toastConfig} />
            </NavigationContainer>
          </SafeAreaProvider>
        </PaperProvider>
      </I18nextProvider>
    </ReduxProvider>
  )
}
