// mobile/src/screens/onboarding/Step9Screen.js
import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native'
import {
  Text,
  Button,
  Chip,
  useTheme,
} from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import Toast from 'react-native-toast-message'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

import { OnboardingHeader } from '../../components/onboarding/OnboardingHeader'
import { onboardingService } from '../../services/api/onboarding'

const MAX_INTERESTS = 10

const INTERESTS_CATEGORIES = [
  {
    id: 'outdoor',
    title: '🏕 Aire libre y aventura',
    interests: [
      { value: 'LONG_WALKS', label: 'Caminatas largas' },
      { value: 'HIKING_WITH_DOG', label: 'Senderismo con perro' },
      { value: 'MOUNTAINS', label: 'Ir a la montaña' },
      { value: 'CAMPING', label: 'Acampar' },
      { value: 'ROAD_TRIPS', label: 'Viajes de ruta con perro' },
      { value: 'DOG_BEACHES', label: 'Playas dog-friendly' },
      { value: 'BIG_PARKS', label: 'Parques grandes' },
      { value: 'AGILITY', label: 'Agility / deportes caninos' },
    ],
  },
  {
    id: 'social',
    title: '☕ Social y ciudad',
    interests: [
      { value: 'DOG_FRIENDLY_CAFES', label: 'Cafés dog-friendly' },
      { value: 'GROUP_WALKS', label: 'Paseos grupales' },
      { value: 'NEIGHBORHOOD_PARKS', label: 'Plazas del barrio' },
      { value: 'DOG_DATES', label: 'Dog dates (perros con perros)' },
      { value: 'DOG_EVENTS', label: 'Eventos para perros' },
      { value: 'AFTER_OFFICE', label: 'After office con perros' },
    ],
  },
  {
    id: 'wellness',
    title: '🌱 Bienestar y estilo de vida',
    interests: [
      { value: 'POSITIVE_TRAINING', label: 'Adiestramiento positivo' },
      { value: 'VOLUNTEERING', label: 'Voluntariado / refugios' },
      { value: 'ADOPTION', label: 'Adopciones y rescate' },
      { value: 'DOG_PHOTOGRAPHY', label: 'Fotografía de perros' },
      { value: 'DIY_PET_STUFF', label: 'Cosas DIY para mascotas' },
      { value: 'SLOW_WALKS', label: 'Slow walks / paseos tranquilos' },
    ],
  },
]

export function Step9Screen({ navigation, route }) {
  const { t } = useTranslation()
  const theme = useTheme()
  const {
    step1Data,
    step2Data,
    step3Data,
    step4Data,
    step5Data,
    step6Data,
    step7Data,
    step8Data
  } = route.params || {}

  const [selectedInterests, setSelectedInterests] = useState([])
  const [loading, setLoading] = useState(false)

  const toggleInterest = (interestValue) => {
    if (selectedInterests.includes(interestValue)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interestValue))
    } else {
      if (selectedInterests.length >= MAX_INTERESTS) {
        Toast.show({
          type: 'info',
          text1: t('onboarding.step9.maxInterestsReached'),
        })
        return
      }
      setSelectedInterests([...selectedInterests, interestValue])
    }
  }

  const handleNext = async () => {
    try {
      setLoading(true)
      await onboardingService.saveStep('ONB_INTERESTS_DOG', {
        interests: selectedInterests,
      })

      navigation.navigate('Step10', {
        step1Data,
        step2Data,
        step3Data,
        step4Data,
        step5Data,
        step6Data,
        step7Data,
        step8Data,
        step9Data: { interests: selectedInterests }
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
      await onboardingService.saveStep('ONB_INTERESTS_DOG', {
        interests: [],
      })

      navigation.navigate('Step10', {
        step1Data,
        step2Data,
        step3Data,
        step4Data,
        step5Data,
        step6Data,
        step7Data,
        step8Data,
        step9Data: { interests: [] }
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
        title={t('onboarding.step9.title')}
        subtitle={t('onboarding.step9.subtitle')}
        currentStep={9}
        totalSteps={10}
        onBack={handlePrevious}
        onSkip={handleSkip}
        showSkip={true}
      />

      <ScrollView
        style={dynamicStyles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Contador de intereses */}
        <View style={dynamicStyles.counterCard}>
          <Text variant="titleLarge" style={dynamicStyles.counterText}>
            {selectedInterests.length}/{MAX_INTERESTS}
          </Text>
          <Text variant="bodyMedium" style={dynamicStyles.counterLabel}>
            {t('onboarding.step9.interestsSelected')}
          </Text>
        </View>

        {/* Categorías de intereses */}
        {INTERESTS_CATEGORIES.map((category) => (
          <View key={category.id} style={dynamicStyles.category}>
            <Text variant="titleMedium" style={dynamicStyles.categoryTitle}>
              {category.title}
            </Text>

            <View style={dynamicStyles.chipsContainer}>
              {category.interests.map((interest) => {
                const isSelected = selectedInterests.includes(interest.value)
                return (
                  <Chip
                    key={interest.value}
                    selected={isSelected}
                    onPress={() => toggleInterest(interest.value)}
                    style={[
                      dynamicStyles.chip,
                      isSelected && dynamicStyles.chipSelected
                    ]}
                    textStyle={isSelected && dynamicStyles.chipTextSelected}
                  >
                    {interest.label}
                  </Chip>
                )
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={dynamicStyles.footer}>
        <Button
          mode="contained"
          onPress={handleNext}
          loading={loading}
          disabled={loading}
          style={dynamicStyles.button}
        >
          {t('common.next')} {selectedInterests.length}/{MAX_INTERESTS}
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
  counterCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.primaryContainer,
    padding: 20,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 24,
  },
  counterText: {
    fontWeight: '700',
    color: theme.colors.primary,
  },
  counterLabel: {
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  category: {
    marginBottom: 32,
  },
  categoryTitle: {
    marginBottom: 12,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: theme.colors.surface,
  },
  chipSelected: {
    backgroundColor: theme.colors.primaryContainer,
  },
  chipTextSelected: {
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
