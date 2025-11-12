// mobile/src/screens/onboarding/Step6Screen.js
import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native'
import {
  Text,
  Button,
  useTheme,
} from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import Toast from 'react-native-toast-message'
import Slider from '@react-native-community/slider'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

import { OnboardingHeader } from '../../components/onboarding/OnboardingHeader'
import { onboardingService } from '../../services/api/onboarding'

export function Step6Screen({ navigation, route }) {
  const { t } = useTranslation()
  const theme = useTheme()
  const { step1Data, step2Data, step3Data, step4Data, step5Data } = route.params || {}

  const [distance, setDistance] = useState(25)
  const [loading, setLoading] = useState(false)

  const handleNext = async () => {
    try {
      setLoading(true)
      await onboardingService.saveStep('ONB_DISTANCE', {
        maxDistanceKm: distance,
      })

      navigation.navigate('Step7', {
        step1Data,
        step2Data,
        step3Data,
        step4Data,
        step5Data,
        step6Data: { maxDistanceKm: distance }
      })
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t('errors.generic'),
        text2: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePrevious = () => {
    navigation.goBack()
  }

  const dynamicStyles = styles(theme)

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <OnboardingHeader
        title={t('onboarding.step6.title')}
        subtitle={t('onboarding.step6.subtitle')}
        currentStep={6}
        totalSteps={10}
        onBack={handlePrevious}
      />

      <ScrollView
        style={dynamicStyles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Card de visualización de distancia */}
        <View style={dynamicStyles.distanceCard}>
          <Icon name="map-marker-radius" size={48} color={theme.colors.primary} />
          <Text variant="displaySmall" style={dynamicStyles.distanceValue}>
            {distance} km
          </Text>
          <Text variant="bodyMedium" style={dynamicStyles.distanceLabel}>
            {t('onboarding.step6.distanceLabel')}
          </Text>
        </View>

        {/* Slider */}
        <View style={dynamicStyles.sliderContainer}>
          <View style={dynamicStyles.sliderLabels}>
            <Text variant="bodySmall" style={dynamicStyles.sliderLabelText}>1 km</Text>
            <Text variant="bodySmall" style={dynamicStyles.sliderLabelText}>100 km</Text>
          </View>

          <Slider
            style={dynamicStyles.slider}
            minimumValue={1}
            maximumValue={100}
            step={1}
            value={distance}
            onValueChange={setDistance}
            minimumTrackTintColor={theme.colors.primary}
            maximumTrackTintColor={theme.colors.surface}
            thumbTintColor={theme.colors.primary}
          />
        </View>

        {/* Información adicional */}
        <View style={dynamicStyles.infoCard}>
          <Icon name="information-outline" size={24} color={theme.colors.onSurfaceVariant} />
          <Text variant="bodyMedium" style={dynamicStyles.infoText}>
            {t('onboarding.step6.infoText')}
          </Text>
        </View>
      </ScrollView>

      <View style={dynamicStyles.footer}>
        <Button
          mode="contained"
          onPress={handleNext}
          loading={loading}
          disabled={loading}
          style={dynamicStyles.button}
        >
          {t('common.next')}
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
    paddingHorizontal: 24,
  },
  distanceCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 32,
    borderRadius: 16,
    marginTop: 24,
  },
  distanceValue: {
    fontWeight: '700',
    color: theme.colors.primary,
    marginTop: 16,
  },
  distanceLabel: {
    color: theme.colors.onSurfaceVariant,
    marginTop: 8,
  },
  sliderContainer: {
    marginTop: 32,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sliderLabelText: {
    color: theme.colors.onSurfaceVariant,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryContainer,
    padding: 16,
    borderRadius: 12,
    marginTop: 32,
    gap: 12,
  },
  infoText: {
    flex: 1,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
  },
  footer: {
    padding: 24,
    paddingBottom: 32,
  },
  button: {
    borderRadius: 8,
  },
})
