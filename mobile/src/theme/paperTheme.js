import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper'
import { lightPalette, darkPalette } from './tokens/colors'
import { spacing } from './tokens/spacing'
import { typography } from './tokens/typography'

export const LightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,

    background: lightPalette.background,
    surface: lightPalette.surface,
    surfaceVariant: lightPalette.surface,

    primary: lightPalette.accentMain,
    onPrimary: '#FFFFFF',
    primaryContainer: lightPalette.accentSoft,
    onPrimaryContainer: lightPalette.textPrimary,

    secondary: lightPalette.secondaryMain,
    onSecondary: '#FFFFFF',
    secondaryContainer: lightPalette.secondarySoft,
    onSecondaryContainer: lightPalette.textPrimary,

    text: lightPalette.textPrimary,
    onSurface: lightPalette.textPrimary,
    onSurfaceVariant: lightPalette.textSecondary,
    onBackground: lightPalette.textPrimary,

    outline: lightPalette.border,
    outlineVariant: lightPalette.border,

    error: lightPalette.error,
    onError: '#FFFFFF',

    placeholder: lightPalette.placeholder,

    success: lightPalette.success,
    onSuccess: '#FFFFFF',

    elevation: {
      level0: 'transparent',
      level1: lightPalette.surface,
      level2: lightPalette.surface,
      level3: lightPalette.surface,
      level4: lightPalette.surface,
      level5: lightPalette.surface,
    },
  },
  spacing,
  typography,
  dark: false,
}

export const DarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,

    background: darkPalette.background,
    surface: darkPalette.surface,
    surfaceVariant: darkPalette.surface,

    primary: darkPalette.accentMain,
    onPrimary: '#FFFFFF',
    primaryContainer: darkPalette.accentSoft,
    onPrimaryContainer: darkPalette.textPrimary,

    secondary: darkPalette.secondaryMain,
    onSecondary: '#FFFFFF',
    secondaryContainer: darkPalette.secondarySoft,
    onSecondaryContainer: darkPalette.textPrimary,

    text: darkPalette.textPrimary,
    onSurface: darkPalette.textPrimary,
    onSurfaceVariant: darkPalette.textSecondary,
    onBackground: darkPalette.textPrimary,

    outline: darkPalette.border,
    outlineVariant: darkPalette.border,

    error: darkPalette.error,
    onError: '#FFFFFF',

    placeholder: darkPalette.placeholder,

    success: darkPalette.success,
    onSuccess: '#FFFFFF',

    elevation: {
      level0: 'transparent',
      level1: darkPalette.surface,
      level2: darkPalette.surface,
      level3: darkPalette.surface,
      level4: darkPalette.surface,
      level5: darkPalette.surface,
    },
  },
  spacing,
  typography,
  dark: true,
}
