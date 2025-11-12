// mobile/src/screens/auth/LoginScreen.js
import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native'
import {
  Text,
  Button,
  Surface,
  useTheme,
} from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import Toast from 'react-native-toast-message'
import Config from '../../config/Config'

import { loginWithGoogle } from '../../store/slices/userSlice'
import { PawIcon } from '../../components/icons/PawIcon'
import { LanguageSelector } from '../../components/common/LanguageSelector'

const { width } = Dimensions.get('window')

// Configurar Google Sign In
GoogleSignin.configure({
  webClientId: Config.GOOGLE_WEB_CLIENT_ID,
  offlineAccess: true,
  scopes: ['profile', 'email'],
  forceCodeForRefreshToken: true,
})

export function LoginScreen({ navigation }) {
  const { t } = useTranslation()
  const theme = useTheme()
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(false)
  const dynamicStyles = styles(theme)

  const features = [
    t('auth.features.registerVisits'),
    t('auth.features.meetOwners'),
    t('auth.features.matchInterests'),
    t('auth.features.chatCoordinate'),
  ]

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)

      // Verificar servicios de Google Play
      await GoogleSignin.hasPlayServices()

      // Realizar login
      const userInfo = await GoogleSignin.signIn()
      console.log('Google Sign-In successful:', JSON.stringify(userInfo, null, 2))

      // En @react-native-google-signin/google-signin v16+, el token está en data.idToken
      const googleToken = userInfo?.data?.idToken || userInfo?.idToken
      console.log('Token structure:', {
        hasData: !!userInfo?.data,
        hasIdToken: !!userInfo?.idToken,
        hasDataIdToken: !!userInfo?.data?.idToken,
        tokenAvailable: !!googleToken
      })

      if (!googleToken) {
        console.error('Token not found in userInfo:', JSON.stringify(userInfo, null, 2))
        throw new Error('No se pudo obtener el token de Google')
      }

      // Enviar al backend
      const result = await dispatch(loginWithGoogle(googleToken)).unwrap()

      if (result.user.onboarded) {
        navigation.replace('Main')
      } else {
        navigation.replace('Onboarding')
      }
    } catch (error) {
      console.error('Login error:', error)

      // Manejar cancelación del usuario
      if (error.code === 'SIGN_IN_CANCELLED') {
        Toast.show({
          type: 'info',
          text1: t('auth.loginCancelled'),
          text2: t('auth.tryAgain'),
        })
        return
      }

      Toast.show({
        type: 'error',
        text1: t('auth.loginError'),
        text2: error.message || t('errors.generic'),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <View style={dynamicStyles.languageSelector}>
        <LanguageSelector />
      </View>

      <ScrollView
        contentContainerStyle={dynamicStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={dynamicStyles.header}>
          <Surface style={dynamicStyles.iconContainer} elevation={2}>
            <PawIcon size={60} color={theme.colors.primary} />
          </Surface>

          <Text variant="headlineLarge" style={dynamicStyles.title}>
            {t('auth.loginTitle')}
          </Text>

          <Text variant="bodyLarge" style={dynamicStyles.subtitle}>
            {t('auth.loginSubtitle')}
          </Text>
        </View>

        <Surface style={dynamicStyles.featuresCard} elevation={1}>
          <Text variant="titleMedium" style={dynamicStyles.featuresTitle}>
            {t('auth.whatCanYouDo')}
          </Text>

          {features.map((feature, index) => (
            <View key={index} style={dynamicStyles.featureItem}>
              <Text style={dynamicStyles.featureBullet}>✓</Text>
              <Text variant="bodyMedium" style={dynamicStyles.featureText}>
                {feature}
              </Text>
            </View>
          ))}
        </Surface>

        <View style={dynamicStyles.loginSection}>
          <Button
            mode="contained"
            onPress={handleGoogleLogin}
            loading={loading}
            disabled={loading}
            style={dynamicStyles.loginButton}
            contentStyle={dynamicStyles.loginButtonContent}
            icon="google"
          >
            {loading ? t('auth.loggingIn') : t('auth.loginWithGoogle')}
          </Button>

          <Text variant="bodySmall" style={dynamicStyles.termsText}>
            {t('auth.termsAccept')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  languageSelector: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
    paddingHorizontal: 32,
  },
  featuresCard: {
    padding: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    marginBottom: 32,
  },
  featuresTitle: {
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureBullet: {
    color: theme.colors.primary,
    fontSize: 18,
    marginRight: 12,
    fontWeight: 'bold',
  },
  featureText: {
    flex: 1,
    color: theme.colors.onSurface,
  },
  loginSection: {
    alignItems: 'center',
  },
  loginButton: {
    width: '100%',
    borderRadius: 8,
  },
  loginButtonContent: {
    paddingVertical: 8,
  },
  termsText: {
    marginTop: 16,
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
  },
})
