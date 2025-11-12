import React, { createContext, useContext, useMemo, useState } from 'react'
import { useColorScheme } from 'react-native'
import { Provider as PaperProvider } from 'react-native-paper'
import { LightTheme, DarkTheme } from './paperTheme'

const AppThemeContext = createContext(null)

export function AppThemeProvider({ children }) {
  const systemScheme = useColorScheme()
  const [mode, setMode] = useState('system')

  const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark'

  const theme = useMemo(() => (isDark ? DarkTheme : LightTheme), [isDark])

  const value = useMemo(
    () => ({ mode, setMode, isDark, theme }),
    [mode, isDark, theme],
  )

  return (
    <AppThemeContext.Provider value={value}>
      <PaperProvider theme={theme}>{children}</PaperProvider>
    </AppThemeContext.Provider>
  )
}

export function useAppTheme() {
  const ctx = useContext(AppThemeContext)
  if (!ctx) {
    throw new Error('useAppTheme debe usarse dentro de AppThemeProvider')
  }
  return ctx
}
