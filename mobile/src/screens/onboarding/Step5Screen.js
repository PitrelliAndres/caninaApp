// mobile/src/screens/onboarding/Step5Screen.js
import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native'
import {
  Text,
  Button,
  useTheme,
} from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import Toast from 'react-native-toast-message'

import { OnboardingHeader } from '../../components/onboarding/OnboardingHeader'
import { onboardingService } from '../../services/api/onboarding'

const { width } = Dimensions.get('window')
const cardWidth = (width - 72) / 2 // 24px padding + 24px gap

const LOOKING_FOR_OPTIONS = [
  {
    value: 'SERIOUS_RELATIONSHIP',
    emoji: '❤️‍🔥',
    label: 'Pareja estable',
  },
  {
    value: 'RELATIONSHIP_OR_CASUAL',
    emoji: '😍',
    label: 'Pareja o algo casual',
  },
  {
    value: 'CASUAL_OR_RELATIONSHIP',
    emoji: '🥂',
    label: 'Algo casual o algo estable',
  },
  {
    value: 'CASUAL',
    emoji: '🎉',
    label: 'Algo casual',
  },
  {
    value: 'MAKE_FRIENDS',
    emoji: '👋',
    label: 'Hacer amigxs',
  },
  {
    value: 'NOT_SURE',
    emoji: '🤔',
    label: 'Todavía no sé qué quiero',
  },
]

export function Step5Screen({ navigation, route }) {
  const { t } = useTranslation()
  const theme = useTheme()
  const { step1Data, step2Data, step3Data, step4Data } = route.params || {}

  const [selectedOption, setSelectedOption] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleNext = async () => {
    try {
      setLoading(true)
      await onboardingService.saveStep('ONB_LOOKING_FOR', {
        lookingFor: selectedOption,
      })

      navigation.navigate('Step6', {
        step1Data,
        step2Data,
        step3Data,
        step4Data,
        step5Data: { lookingFor: selectedOption }
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
        title={t('onboarding.step5.title')}
        subtitle={t('onboarding.step5.subtitle')}
        currentStep={5}
        totalSteps={10}
        onBack={handlePrevious}
      />

      <ScrollView
        style={dynamicStyles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Grid 2x3 de opciones */}
        <View style={dynamicStyles.gridContainer}>
          {LOOKING_FOR_OPTIONS.map((option) => {
            const isSelected = selectedOption === option.value
            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  dynamicStyles.optionCard,
                  isSelected && dynamicStyles.optionCardSelected
                ]}
                onPress={() => setSelectedOption(option.value)}
              >
                <Text style={dynamicStyles.optionEmoji}>{option.emoji}</Text>
                <Text
                  variant="bodyMedium"
                  style={[
                    dynamicStyles.optionLabel,
                    isSelected && dynamicStyles.optionLabelSelected
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </ScrollView>

      <View style={dynamicStyles.footer}>
        <Button
          mode="contained"
          onPress={handleNext}
          loading={loading}
          disabled={loading || !selectedOption}
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
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 24,
    justifyContent: 'space-between',
  },
  optionCard: {
    width: cardWidth,
    aspectRatio: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryContainer,
  },
  optionEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  optionLabel: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
  },
  optionLabelSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  footer: {
    padding: 24,
    paddingBottom: 32,
  },
  button: {
    borderRadius: 8,
  },
})
