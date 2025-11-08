import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper'

const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2563eb',
    secondary: '#7c3aed',
    tertiary: '#059669',
    error: '#dc2626',
  },
}

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    tertiary: '#10b981',
    error: '#ef4444',
  },
}

export { lightTheme as theme, darkTheme }

