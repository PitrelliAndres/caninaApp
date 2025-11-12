// mobile/src/screens/onboarding/Step4Screen.js
import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native'
import {
  Text,
  Button,
  Checkbox,
  useTheme,
} from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import Toast from 'react-native-toast-message'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

import { OnboardingHeader } from '../../components/onboarding/OnboardingHeader'
import { onboardingService } from '../../services/api/onboarding'

const ORIENTATIONS = [
  {
    value: 'HETEROSEXUAL',
    label: 'Heterosexual',
    description: 'Persona que se siente atraída únicamente por personas del género opuesto',
  },
  {
    value: 'GAY',
    label: 'Gay',
    description: 'Hombre que se siente atraído por otros hombres',
  },
  {
    value: 'LESBIAN',
    label: 'Lesbiana',
    description: 'Mujer que se siente atraída por otras mujeres',
  },
  {
    value: 'BISEXUAL',
    label: 'Bisexual',
    description: 'Persona atraída por más de un género',
  },
  {
    value: 'ASEXUAL',
    label: 'Asexual',
    description: 'Persona que experimenta poca o ninguna atracción sexual',
  },
  {
    value: 'PANSEXUAL',
    label: 'Pansexual',
    description: 'Persona atraída por personas independientemente de su género',
  },
  {
    value: 'QUEER',
    label: 'Queer',
    description: 'Término amplio para identidades no heterosexuales',
  },
  {
    value: 'DEMISEXUAL',
    label: 'Demisexual',
    description: 'Persona que solo siente atracción sexual tras formar un vínculo emocional',
  },
]

export function Step4Screen({ navigation, route }) {
  const { t } = useTranslation()
  const theme = useTheme()
  const { step1Data, step2Data, step3Data } = route.params || {}

  const [selectedOrientations, setSelectedOrientations] = useState([])
  const [showOrientationOnProfile, setShowOrientationOnProfile] = useState(false)
  const [loading, setLoading] = useState(false)

  const toggleOrientation = (orientationValue) => {
    if (selectedOrientations.includes(orientationValue)) {
      setSelectedOrientations(selectedOrientations.filter(o => o !== orientationValue))
    } else {
      setSelectedOrientations([...selectedOrientations, orientationValue])
    }
  }

  const handleNext = async () => {
    try {
      setLoading(true)
      await onboardingService.saveStep('ONB_ORIENTATION', {
        orientations: selectedOrientations,
        showOrientationOnProfile,
        skipped: false,
      })

      navigation.navigate('Step5', {
        step1Data,
        step2Data,
        step3Data,
        step4Data: { orientations: selectedOrientations, showOrientationOnProfile }
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

  const handleSkip = async () => {
    try {
      setLoading(true)
      await onboardingService.saveStep('ONB_ORIENTATION', {
        orientations: [],
        showOrientationOnProfile: false,
        skipped: true,
      })

      navigation.navigate('Step5', {
        step1Data,
        step2Data,
        step3Data,
        step4Data: { orientations: [], showOrientationOnProfile: false, skipped: true }
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
        title={t('onboarding.step4.title')}
        subtitle={t('onboarding.step4.subtitle')}
        currentStep={4}
        totalSteps={10}
        onBack={handlePrevious}
        onSkip={handleSkip}
        showSkip={true}
      />

      <ScrollView
        style={dynamicStyles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Lista de orientaciones con descripciones */}
        <View style={dynamicStyles.optionsContainer}>
          {ORIENTATIONS.map((orientation) => {
            const isSelected = selectedOrientations.includes(orientation.value)
            return (
              <TouchableOpacity
                key={orientation.value}
                style={[
                  dynamicStyles.optionCard,
                  isSelected && dynamicStyles.optionCardSelected
                ]}
                onPress={() => toggleOrientation(orientation.value)}
              >
                <View style={dynamicStyles.optionContent}>
                  <View style={dynamicStyles.optionHeader}>
                    <Text
                      variant="titleMedium"
                      style={[
                        dynamicStyles.optionLabel,
                        isSelected && dynamicStyles.optionLabelSelected
                      ]}
                    >
                      {orientation.label}
                    </Text>
                    <Checkbox
                      status={isSelected ? 'checked' : 'unchecked'}
                      color={theme.colors.primary}
                    />
                  </View>
                  <Text variant="bodySmall" style={dynamicStyles.optionDescription}>
                    {orientation.description}
                  </Text>
                </View>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Toggle mostrar orientación en perfil */}
        {selectedOrientations.length > 0 && (
          <TouchableOpacity
            style={dynamicStyles.privacyCard}
            onPress={() => setShowOrientationOnProfile(!showOrientationOnProfile)}
          >
            <View style={dynamicStyles.privacyLeft}>
              <Icon name="eye" size={24} color={theme.colors.primary} />
              <View style={dynamicStyles.privacyTextContainer}>
                <Text variant="titleMedium">
                  {t('onboarding.step4.showOrientationToggle')}
                </Text>
                <Text variant="bodySmall" style={dynamicStyles.privacyDescription}>
                  {t('onboarding.step4.showOrientationDescription')}
                </Text>
              </View>
            </View>
            <Checkbox
              status={showOrientationOnProfile ? 'checked' : 'unchecked'}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        )}
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
  optionsContainer: {
    gap: 12,
    marginTop: 16,
  },
  optionCard: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryContainer,
  },
  optionContent: {
    gap: 8,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionLabel: {
    flex: 1,
  },
  optionLabelSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  optionDescription: {
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.primaryContainer,
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  privacyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  privacyTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  privacyDescription: {
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  footer: {
    padding: 24,
    paddingBottom: 32,
  },
  button: {
    borderRadius: 8,
  },
})
