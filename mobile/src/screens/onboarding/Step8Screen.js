// mobile/src/screens/onboarding/Step8Screen.js
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
  Chip,
  useTheme,
} from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import Toast from 'react-native-toast-message'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

import { OnboardingHeader } from '../../components/onboarding/OnboardingHeader'
import { onboardingService } from '../../services/api/onboarding'

const HABITS_SECTIONS = [
  {
    id: 'walkFrequency',
    title: '¿Cada cuánto salís a pasear con tu perro?',
    icon: 'dog-side',
    options: [
      { value: 'SEVERAL_TIMES_DAY', label: 'Varias veces por día' },
      { value: 'DAILY', label: 'Una vez por día' },
      { value: 'WEEKENDS_ONLY', label: 'Solo los findes' },
      { value: 'WHEN_I_HAVE_TIME', label: 'Cuando tengo tiempo' },
      { value: 'NO_DOG_YET', label: 'Todavía no tengo perro, quiero unirme igual' },
    ],
  },
  {
    id: 'walkTypes',
    title: '¿Qué tipo de paseo preferís?',
    icon: 'hiking',
    options: [
      { value: 'CALM_WALKS', label: 'Paseos tranquilos' },
      { value: 'RUNNING', label: 'Salir a correr' },
      { value: 'DOG_PARKS', label: 'Parques para perros' },
      { value: 'HIKING', label: 'Senderismo / naturaleza' },
      { value: 'URBAN', label: 'Paseos urbanos (ciudad)' },
      { value: 'BEACHES', label: 'Playas dog-friendly' },
    ],
  },
  {
    id: 'dogSociability',
    title: '¿Cómo se lleva tu perro con otros perros?',
    icon: 'paw',
    options: [
      { value: 'VERY_SOCIAL', label: 'Muy sociable' },
      { value: 'SHY', label: 'Tímido al principio' },
      { value: 'PREFERS_HUMANS', label: 'Prefiere humanos' },
      { value: 'IN_TRAINING', label: 'En proceso de adaptación' },
      { value: 'NO_DOG', label: 'No tengo perro (todavía)' },
    ],
  },
  {
    id: 'otherPets',
    title: '¿Tenés más mascotas?',
    icon: 'cat',
    options: [
      { value: 'DOG', label: 'Perro' },
      { value: 'CAT', label: 'Gato' },
      { value: 'OTHER', label: 'Otros' },
      { value: 'ONLY_DOG', label: 'Solo mi perro' },
      { value: 'NONE_YET', label: 'Ninguna por ahora' },
    ],
  },
]

export function Step8Screen({ navigation, route }) {
  const { t } = useTranslation()
  const theme = useTheme()
  const {
    step1Data,
    step2Data,
    step3Data,
    step4Data,
    step5Data,
    step6Data,
    step7Data
  } = route.params || {}

  const [selections, setSelections] = useState({
    walkFrequency: [],
    walkTypes: [],
    dogSociability: [],
    otherPets: [],
  })
  const [loading, setLoading] = useState(false)

  const toggleSelection = (sectionId, value) => {
    setSelections(prev => {
      const current = prev[sectionId] || []
      if (current.includes(value)) {
        return {
          ...prev,
          [sectionId]: current.filter(v => v !== value)
        }
      } else {
        return {
          ...prev,
          [sectionId]: [...current, value]
        }
      }
    })
  }

  const getSectionsAnswered = () => {
    return Object.values(selections).filter(section => section.length > 0).length
  }

  const handleNext = async () => {
    try {
      setLoading(true)
      await onboardingService.saveStep('ONB_HABITS_DOG', {
        walkFrequency: selections.walkFrequency,
        walkTypes: selections.walkTypes,
        dogSociability: selections.dogSociability,
        otherPets: selections.otherPets,
        sectionsAnswered: getSectionsAnswered(),
      })

      navigation.navigate('Step9', {
        step1Data,
        step2Data,
        step3Data,
        step4Data,
        step5Data,
        step6Data,
        step7Data,
        step8Data: selections
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
      await onboardingService.saveStep('ONB_HABITS_DOG', {
        walkFrequency: [],
        walkTypes: [],
        dogSociability: [],
        otherPets: [],
        sectionsAnswered: 0,
      })

      navigation.navigate('Step9', {
        step1Data,
        step2Data,
        step3Data,
        step4Data,
        step5Data,
        step6Data,
        step7Data,
        step8Data: { walkFrequency: [], walkTypes: [], dogSociability: [], otherPets: [] }
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

  const sectionsAnswered = getSectionsAnswered()
  const dynamicStyles = styles(theme)

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <OnboardingHeader
        title={t('onboarding.step8.title')}
        subtitle={t('onboarding.step8.subtitle')}
        currentStep={8}
        totalSteps={10}
        onBack={handlePrevious}
        onSkip={handleSkip}
        showSkip={true}
      />

      <ScrollView
        style={dynamicStyles.content}
        showsVerticalScrollIndicator={false}
      >
        {HABITS_SECTIONS.map((section) => (
          <View key={section.id} style={dynamicStyles.section}>
            <View style={dynamicStyles.sectionHeader}>
              <Icon name={section.icon} size={24} color={theme.colors.primary} />
              <Text variant="titleMedium" style={dynamicStyles.sectionTitle}>
                {section.title}
              </Text>
            </View>

            <View style={dynamicStyles.chipsContainer}>
              {section.options.map((option) => {
                const isSelected = selections[section.id]?.includes(option.value)
                return (
                  <Chip
                    key={option.value}
                    selected={isSelected}
                    onPress={() => toggleSelection(section.id, option.value)}
                    style={[
                      dynamicStyles.chip,
                      isSelected && dynamicStyles.chipSelected
                    ]}
                    textStyle={isSelected && dynamicStyles.chipTextSelected}
                  >
                    {option.label}
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
          {t('common.next')} {sectionsAnswered}/4
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
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    flex: 1,
    lineHeight: 22,
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
