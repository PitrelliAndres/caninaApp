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

import { loginWithGoogle } from '../../store/slices/userSlice'
import { PawIcon } from '../../components/icons/PawIcon'
import { LanguageSelector } from '../../components/common/LanguageSelector'

const { width } = Dimensions.get('window')

// Configurar Google Sign In
GoogleSignin.configure({
  webClientId: '301209986798-fuk4h414g85ljkaho0b4hgn6qgb4o16p.apps.googleusercontent.com',
  offlineAccess: true,
})

export function LoginScreen({ navigation }) {
  const { t } = useTranslation()
  const theme = useTheme()
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(false)

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
      console.log('Google Sign-In successful:', userInfo)
      
      // Verificar que tenemos la información necesaria
      if (!userInfo?.data?.idToken && !userInfo?.data?.accessToken) {
        throw new Error('No se pudo obtener el token de Google')
      }
      
      // Usar el token que esté disponible (idToken es preferido para autenticación)
      const googleToken = userInfo.data.idToken || userInfo.data.accessToken
      console.log('Using Google token:', googleToken ? 'Token available' : 'No token')
      
      if (!googleToken) {
        throw new Error('Google token required')
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
    <SafeAreaView style={styles.container}>
      <View style={styles.languageSelector}>
        <LanguageSelector />
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Surface style={styles.iconContainer} elevation={2}>
            <PawIcon size={60} color={theme.colors.primary} />
          </Surface>
          
          <Text variant="headlineLarge" style={styles.title}>
            {t('auth.loginTitle')}
          </Text>
          
          <Text variant="bodyLarge" style={styles.subtitle}>
            {t('auth.loginSubtitle')}
          </Text>
        </View>

        <Surface style={styles.featuresCard} elevation={1}>
          <Text variant="titleMedium" style={styles.featuresTitle}>
            {t('auth.whatCanYouDo')}
          </Text>
          
          {features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Text style={styles.featureBullet}>✓</Text>
              <Text variant="bodyMedium" style={styles.featureText}>
                {feature}
              </Text>
            </View>
          ))}
        </Surface>

        <View style={styles.loginSection}>
          <Button
            mode="contained"
            onPress={handleGoogleLogin}
            loading={loading}
            disabled={loading}
            style={styles.loginButton}
            contentStyle={styles.loginButtonContent}
            icon="google"
          >
            {loading ? t('auth.loggingIn') : t('auth.loginWithGoogle')}
          </Button>
          
          <Text variant="bodySmall" style={styles.termsText}>
            {t('auth.termsAccept')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    backgroundColor: '#e3f2fd',
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
    color: '#666',
    paddingHorizontal: 32,
  },
  featuresCard: {
    padding: 24,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
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
    color: '#4caf50',
    fontSize: 18,
    marginRight: 12,
    fontWeight: 'bold',
  },
  featureText: {
    flex: 1,
    color: '#333',
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
    color: '#666',
  },
})