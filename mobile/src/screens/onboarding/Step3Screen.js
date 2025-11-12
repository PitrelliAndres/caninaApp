// mobile/src/screens/onboarding/Step3Screen.js
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

const GENDERS = [
  { value: 'MALE', label: 'Varón', icon: 'gender-male' },
  { value: 'FEMALE', label: 'Mujer', icon: 'gender-female' },
  { value: 'NON_BINARY', label: 'No binario / Extrabinario', icon: 'gender-non-binary' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefiero no decirlo', icon: 'help-circle' },
]

export function Step3Screen({ navigation, route }) {
  const { t } = useTranslation()
  const theme = useTheme()
  const { step1Data, step2Data } = route.params || {}

  const [selectedGenders, setSelectedGenders] = useState([])
  const [showGenderOnProfile, setShowGenderOnProfile] = useState(true)
  const [loading, setLoading] = useState(false)

  const toggleGender = (genderValue) => {
    if (selectedGenders.includes(genderValue)) {
      setSelectedGenders(selectedGenders.filter(g => g !== genderValue))
    } else {
      if (selectedGenders.length >= 3) {
        Toast.show({
          type: 'info',
          text1: t('onboarding.step3.maxGendersReached'),
        })
        return
      }
      setSelectedGenders([...selectedGenders, genderValue])
    }
  }

  const validate = () => {
    if (selectedGenders.length === 0) {
      Toast.show({
        type: 'error',
        text1: t('onboarding.step3.selectAtLeastOne'),
      })
      return false
    }
    return true
  }

  const handleNext = async () => {
    if (!validate()) return

    try {
      setLoading(true)
      await onboardingService.saveStep('ONB_GENDER', {
        genders: selectedGenders,
        showGenderOnProfile,
      })

      navigation.navigate('Step4', {
        step1Data,
        step2Data,
        step3Data: { genders: selectedGenders, showGenderOnProfile }
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
        title={t('onboarding.step3.title')}
        subtitle={t('onboarding.step3.subtitle')}
        currentStep={3}
        totalSteps={10}
        onBack={handlePrevious}
      />

      <ScrollView
        style={dynamicStyles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="bodyMedium" style={dynamicStyles.description}>
          {t('onboarding.step3.description')}
        </Text>

        {/* Lista de géneros */}
        <View style={dynamicStyles.optionsContainer}>
          {GENDERS.map((gender) => {
            const isSelected = selectedGenders.includes(gender.value)
            return (
              <TouchableOpacity
                key={gender.value}
                style={[
                  dynamicStyles.optionCard,
                  isSelected && dynamicStyles.optionCardSelected
                ]}
                onPress={() => toggleGender(gender.value)}
              >
                <View style={dynamicStyles.optionLeft}>
                  <Icon
                    name={gender.icon}
                    size={28}
                    color={isSelected ? theme.colors.primary : theme.colors.onSurfaceVariant}
                  />
                  <Text
                    variant="titleMedium"
                    style={[
                      dynamicStyles.optionLabel,
                      isSelected && dynamicStyles.optionLabelSelected
                    ]}
                  >
                    {gender.label}
                  </Text>
                </View>
                <Checkbox
                  status={isSelected ? 'checked' : 'unchecked'}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Toggle mostrar género en perfil */}
        <TouchableOpacity
          style={dynamicStyles.privacyCard}
          onPress={() => setShowGenderOnProfile(!showGenderOnProfile)}
        >
          <View style={dynamicStyles.privacyLeft}>
            <Icon name="eye" size={24} color={theme.colors.primary} />
            <View style={dynamicStyles.privacyTextContainer}>
              <Text variant="titleMedium">
                {t('onboarding.step3.showGenderToggle')}
              </Text>
              <Text variant="bodySmall" style={dynamicStyles.privacyDescription}>
                {t('onboarding.step3.showGenderDescription')}
              </Text>
            </View>
          </View>
          <Checkbox
            status={showGenderOnProfile ? 'checked' : 'unchecked'}
            color={theme.colors.primary}
          />
        </TouchableOpacity>

        {/* Enlace a política de uso de datos */}
        <TouchableOpacity style={dynamicStyles.infoLink}>
          <Icon name="information" size={20} color={theme.colors.primary} />
          <Text variant="bodySmall" style={dynamicStyles.infoLinkText}>
            {t('onboarding.step3.dataUsageLink')}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={dynamicStyles.footer}>
        <Button
          mode="contained"
          onPress={handleNext}
          loading={loading}
          disabled={loading || selectedGenders.length === 0}
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
  description: {
    marginTop: 16,
    marginBottom: 24,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionLabel: {
    marginLeft: 12,
    flex: 1,
  },
  optionLabelSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
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
  infoLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 12,
  },
  infoLinkText: {
    marginLeft: 8,
    color: theme.colors.primary,
  },
  footer: {
    padding: 24,
    paddingBottom: 32,
  },
  button: {
    borderRadius: 8,
  },
})
