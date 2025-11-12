// mobile/src/screens/onboarding/Step1Screen.js
import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native'
import {
  Text,
  TextInput,
  Button,
  HelperText,
  Avatar,
  IconButton,
  useTheme,
} from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import Toast from 'react-native-toast-message'

import { OnboardingHeader } from '../../components/onboarding/OnboardingHeader'
import { onboardingService } from '../../services/api/onboarding'

export function Step1Screen({ navigation, route }) {
  const { t } = useTranslation()
  const theme = useTheme()
  const { user } = route.params || {}
  
  const [formData, setFormData] = useState({
    name: user?.name || '',  // Autocompletado con nombre de Google
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const newErrors = {}

    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = t('onboarding.step1.nameMinLength')
    } else if (formData.name.trim().length > 30) {
      newErrors.name = t('onboarding.step1.nameMaxLength')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = async () => {
    if (!validate()) return

    try {
      setLoading(true)
      await onboardingService.saveStep('ONB_NAME', {
        name: formData.name.trim()
      })
      navigation.navigate('Step2', { step1Data: formData })
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

  const dynamicStyles = styles(theme)

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={dynamicStyles.container}
      >
        <OnboardingHeader
          title={t('onboarding.step1.title')}
          subtitle={t('onboarding.step1.subtitle')}
          currentStep={1}
          totalSteps={10}
        />

        <ScrollView
          style={dynamicStyles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Nombre editable (autocompletado de Google) */}
          <View style={dynamicStyles.inputGroup}>
            <TextInput
              label={t('onboarding.step1.nameLabel')}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              mode="outlined"
              style={dynamicStyles.input}
              error={!!errors.name}
            />
            <HelperText type={errors.name ? 'error' : 'info'}>
              {errors.name || t('onboarding.step1.nameHelp')}
            </HelperText>
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
  inputGroup: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: theme.colors.background,
  },
  photoSection: {
    marginTop: 24,
    alignItems: 'center',
  },
  photoLabel: {
    marginBottom: 16,
  },
  photoContainer: {
    position: 'relative',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
  },
  footer: {
    padding: 24,
    paddingBottom: 32,
  },
  button: {
    borderRadius: 8,
  },
})
