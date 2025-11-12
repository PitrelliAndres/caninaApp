// mobile/src/screens/onboarding/Step7Screen.js
import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
  Linking,
} from 'react-native'
import {
  Text,
  Button,
  useTheme,
} from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import Toast from 'react-native-toast-message'
import Geolocation from '@react-native-community/geolocation'
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

import { OnboardingHeader } from '../../components/onboarding/OnboardingHeader'
import { onboardingService } from '../../services/api/onboarding'

export function Step7Screen({ navigation, route }) {
  const { t } = useTranslation()
  const theme = useTheme()
  const { step1Data, step2Data, step3Data, step4Data, step5Data, step6Data } = route.params || {}

  const [loading, setLoading] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const requestLocationPermission = async () => {
    try {
      const permission = Platform.select({
        android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
        ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
      })

      const result = await request(permission)

      if (result === RESULTS.GRANTED) {
        return true
      } else {
        setPermissionDenied(true)
        return false
      }
    } catch (error) {
      console.error('Error requesting location permission:', error)
      return false
    }
  }

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          })
        },
        (error) => {
          reject(error)
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      )
    })
  }

  const handleAllow = async () => {
    try {
      setLoading(true)

      // 1. Solicitar permiso
      const permissionGranted = await requestLocationPermission()

      if (!permissionGranted) {
        Toast.show({
          type: 'error',
          text1: t('onboarding.step7.permissionDenied'),
          text2: t('onboarding.step7.permissionDeniedMessage'),
        })
        return
      }

      // 2. Obtener ubicación actual
      const location = await getCurrentLocation()

      // 3. Guardar en backend
      await onboardingService.saveStep('ONB_LOCATION_PERMISSION', {
        locationPermissionGranted: true,
        lat: location.lat,
        lng: location.lng,
        accuracy: location.accuracy,
      })

      // 4. Navegar a siguiente paso
      navigation.navigate('Step8', {
        step1Data,
        step2Data,
        step3Data,
        step4Data,
        step5Data,
        step6Data,
        step7Data: { locationPermissionGranted: true, ...location }
      })

    } catch (error) {
      console.error('Location error:', error)
      Toast.show({
        type: 'error',
        text1: t('errors.locationError'),
        text2: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenSettings = () => {
    Linking.openSettings()
  }

  const handlePrevious = () => {
    navigation.goBack()
  }

  const dynamicStyles = styles(theme)

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <OnboardingHeader
        title={t('onboarding.step7.title')}
        subtitle={t('onboarding.step7.subtitle')}
        currentStep={7}
        totalSteps={10}
        onBack={handlePrevious}
      />

      <ScrollView
        style={dynamicStyles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={dynamicStyles.contentContainer}
      >
        {/* Ilustración de ubicación */}
        <View style={dynamicStyles.illustrationContainer}>
          <View style={dynamicStyles.iconCircle}>
            <Icon name="map-marker" size={80} color={theme.colors.primary} />
          </View>
        </View>

        {/* Explicación */}
        <Text variant="bodyLarge" style={dynamicStyles.description}>
          {t('onboarding.step7.description')}
        </Text>

        {/* Lista de beneficios */}
        <View style={dynamicStyles.benefitsContainer}>
          <View style={dynamicStyles.benefitItem}>
            <Icon name="account-multiple" size={24} color={theme.colors.primary} />
            <Text variant="bodyMedium" style={dynamicStyles.benefitText}>
              {t('onboarding.step7.benefit1')}
            </Text>
          </View>

          <View style={dynamicStyles.benefitItem}>
            <Icon name="dog" size={24} color={theme.colors.primary} />
            <Text variant="bodyMedium" style={dynamicStyles.benefitText}>
              {t('onboarding.step7.benefit2')}
            </Text>
          </View>

          <View style={dynamicStyles.benefitItem}>
            <Icon name="map-marker-radius" size={24} color={theme.colors.primary} />
            <Text variant="bodyMedium" style={dynamicStyles.benefitText}>
              {t('onboarding.step7.benefit3')}
            </Text>
          </View>
        </View>

        {/* Advertencia si fue denegado */}
        {permissionDenied && (
          <View style={dynamicStyles.warningCard}>
            <Icon name="alert-circle" size={24} color={theme.colors.primary} />
            <View style={dynamicStyles.warningTextContainer}>
              <Text variant="titleSmall" style={dynamicStyles.warningTitle}>
                {t('onboarding.step7.permissionRequired')}
              </Text>
              <Text variant="bodySmall" style={dynamicStyles.warningText}>
                {t('onboarding.step7.permissionRequiredMessage')}
              </Text>
              <Button
                mode="text"
                onPress={handleOpenSettings}
                style={dynamicStyles.settingsButton}
              >
                {t('onboarding.step7.openSettings')}
              </Button>
            </View>
          </View>
        )}

        {/* Enlace de privacidad */}
        <View style={dynamicStyles.privacyLink}>
          <Icon name="shield-check" size={20} color={theme.colors.onSurfaceVariant} />
          <Text variant="bodySmall" style={dynamicStyles.privacyLinkText}>
            {t('onboarding.step7.privacyLink')}
          </Text>
        </View>
      </ScrollView>

      <View style={dynamicStyles.footer}>
        <Button
          mode="contained"
          onPress={handleAllow}
          loading={loading}
          disabled={loading}
          style={dynamicStyles.button}
          icon="check"
        >
          {t('onboarding.step7.allowButton')}
        </Button>
      </View>
    </SafeAreaView>
  )
}

const styles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: theme.colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  description: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
    lineHeight: 24,
    marginBottom: 32,
  },
  benefitsContainer: {
    gap: 20,
    marginBottom: 24,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  benefitText: {
    flex: 1,
    color: theme.colors.onSurface,
    lineHeight: 20,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primaryContainer,
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  warningText: {
    color: theme.colors.onSurfaceVariant,
    lineHeight: 18,
  },
  settingsButton: {
    marginTop: 8,
  },
  privacyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    padding: 12,
  },
  privacyLinkText: {
    color: theme.colors.onSurfaceVariant,
  },
  footer: {
    padding: 24,
    paddingBottom: 32,
  },
  button: {
    borderRadius: 8,
  },
})
