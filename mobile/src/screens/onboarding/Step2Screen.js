// mobile/src/screens/onboarding/Step2Screen.js
import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native'
import {
  Text,
  Button,
  HelperText,
  useTheme,
  Portal,
  Dialog,
  Switch,
} from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import Toast from 'react-native-toast-message'
import DateTimePicker from '@react-native-community/datetimepicker'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

import { OnboardingHeader } from '../../components/onboarding/OnboardingHeader'
import { onboardingService } from '../../services/api/onboarding'

const MIN_AGE = 18
const MAX_AGE = 120

// Función para calcular edad
const calculateAge = (birthdate) => {
  const today = new Date()
  const birth = new Date(birthdate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

// Función para calcular signo del zodíaco
const calculateZodiacSign = (birthdate) => {
  const date = new Date(birthdate)
  const month = date.getMonth() + 1
  const day = date.getDate()

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries'
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Tauro'
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Géminis'
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cáncer'
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo'
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo'
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra'
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Escorpio'
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagitario'
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricornio'
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Acuario'
  return 'Piscis'
}

export function Step2Screen({ navigation, route }) {
  const { t } = useTranslation()
  const theme = useTheme()
  const { step1Data } = route.params || {}

  const [birthdate, setBirthdate] = useState(new Date(2000, 0, 1))
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showZodiacSign, setShowZodiacSign] = useState(true)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const age = calculateAge(birthdate)
  const zodiacSign = calculateZodiacSign(birthdate)

  const formatDate = (date) => {
    const options = { day: 'numeric', month: 'short', year: 'numeric' }
    return date.toLocaleDateString('es-ES', options)
  }

  const validate = () => {
    const newErrors = {}

    if (age < MIN_AGE) {
      newErrors.age = t('onboarding.step2.underageError', { minAge: MIN_AGE })
      Toast.show({
        type: 'error',
        text1: t('onboarding.step2.underageError', { minAge: MIN_AGE }),
      })
      return false
    }

    if (age > MAX_AGE) {
      newErrors.age = t('onboarding.step2.invalidDate')
      return false
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (!validate()) return
    // Mostrar popup de confirmación
    setShowConfirmDialog(true)
  }

  const handleConfirm = async () => {
    try {
      setLoading(true)
      setShowConfirmDialog(false)

      await onboardingService.saveStep('ONB_BIRTHDATE', {
        birthdate: birthdate.toISOString().split('T')[0],
        age,
        zodiacSign,
        showZodiacSign,
      })

      navigation.navigate('Step3', {
        step1Data,
        step2Data: { birthdate, age, zodiacSign, showZodiacSign }
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

  const handleModify = () => {
    setShowConfirmDialog(false)
  }

  const handlePrevious = () => {
    navigation.goBack()
  }

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios')
    if (selectedDate) {
      setBirthdate(selectedDate)
    }
  }

  const dynamicStyles = styles(theme)

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={dynamicStyles.container}
      >
        <OnboardingHeader
          title={t('onboarding.step2.title')}
          subtitle={t('onboarding.step2.subtitle')}
          currentStep={2}
          totalSteps={10}
          onBack={handlePrevious}
        />

        <ScrollView
          style={dynamicStyles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Campo de fecha de nacimiento */}
          <TouchableOpacity
            style={dynamicStyles.dateCard}
            onPress={() => setShowDatePicker(true)}
          >
            <Icon name="calendar" size={24} color={theme.colors.primary} />
            <View style={dynamicStyles.dateTextContainer}>
              <Text variant="bodySmall" style={dynamicStyles.dateLabel}>
                {t('onboarding.step2.birthdateLabel')}
              </Text>
              <Text variant="titleLarge" style={dynamicStyles.dateValue}>
                {formatDate(birthdate)}
              </Text>
            </View>
            <Icon name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>

          {errors.age && (
            <HelperText type="error" visible={true}>
              {errors.age}
            </HelperText>
          )}

          {/* Mostrar edad calculada */}
          <View style={dynamicStyles.ageDisplay}>
            <Text variant="titleMedium">
              {t('onboarding.step2.yourAge', { age })}
            </Text>
          </View>

          {/* Card de signo astral */}
          <View style={dynamicStyles.zodiacCard}>
            <View style={dynamicStyles.zodiacHeader}>
              <Icon name="star-circle" size={32} color={theme.colors.primary} />
              <View style={dynamicStyles.zodiacTextContainer}>
                <Text variant="bodyMedium">
                  {t('onboarding.step2.zodiacLabel')}
                </Text>
                <Text variant="titleMedium" style={dynamicStyles.zodiacSign}>
                  {zodiacSign}
                </Text>
              </View>
            </View>

            <View style={dynamicStyles.zodiacToggle}>
              <Text variant="bodyMedium">
                {t('onboarding.step2.showZodiacToggle')}
              </Text>
              <Switch
                value={showZodiacSign}
                onValueChange={setShowZodiacSign}
                color={theme.colors.primary}
              />
            </View>

            <HelperText type="info">
              {t('onboarding.step2.zodiacHelp')}
            </HelperText>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={birthdate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              maximumDate={new Date()}
              minimumDate={new Date(1920, 0, 1)}
            />
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

        {/* Popup de confirmación de edad */}
        <Portal>
          <Dialog visible={showConfirmDialog} onDismiss={handleModify}>
            <Dialog.Icon icon="cake-variant" size={60} />
            <Dialog.Title style={dynamicStyles.dialogTitle}>
              {t('onboarding.step2.confirmTitle', { age })}
            </Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium" style={dynamicStyles.dialogText}>
                {t('onboarding.step2.confirmMessage')}
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={handleModify}>
                {t('onboarding.step2.modify')}
              </Button>
              <Button
                mode="contained"
                onPress={handleConfirm}
                loading={loading}
              >
                {t('onboarding.step2.confirm')}
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </KeyboardAvoidingView>
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
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 8,
  },
  dateTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  dateLabel: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  dateValue: {
    fontWeight: '600',
  },
  ageDisplay: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  zodiacCard: {
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderRadius: 12,
    marginTop: 24,
  },
  zodiacHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  zodiacTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  zodiacSign: {
    fontWeight: '600',
    marginTop: 4,
  },
  zodiacToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  footer: {
    padding: 24,
    paddingBottom: 32,
  },
  button: {
    borderRadius: 8,
  },
  dialogTitle: {
    textAlign: 'center',
  },
  dialogText: {
    textAlign: 'center',
  },
})
