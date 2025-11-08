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
import { imageService } from '../../services/media/imageService'
import { useDebounce } from '../../hooks/useDebounce'
import { onboardingService } from '../../services/api/onboarding'

export function Step1Screen({ navigation, route }) {
  const { t } = useTranslation()
  const theme = useTheme()
  const { user } = route.params || {}
  
  const [formData, setFormData] = useState({
    nickname: '',
    age: '',
    avatar: user?.avatar || null,
  })
  const [errors, setErrors] = useState({})
  const [checkingNickname, setCheckingNickname] = useState(false)
  const [nicknameAvailable, setNicknameAvailable] = useState(null)
  const [loading, setLoading] = useState(false)
  
  const debouncedNickname = useDebounce(formData.nickname, 500)

  // Verificar disponibilidad del nickname
  useEffect(() => {
    if (!debouncedNickname || debouncedNickname.length < 3) {
      setNicknameAvailable(null)
      return
    }

    const checkNickname = async () => {
      try {
        setCheckingNickname(true)
        const response = await onboardingService.checkNickname(debouncedNickname)
        setNicknameAvailable(response.available)
      } catch (error) {
        console.error('Error checking nickname:', error)
      } finally {
        setCheckingNickname(false)
      }
    }

    checkNickname()
  }, [debouncedNickname])

  const handlePickImage = async () => {
    try {
      const result = await imageService.pickImageAsync({
        mediaType: 'photo',
        quality: 0.8,
      })

      if (!result.cancelled && result.assets && result.assets[0]) {
        setFormData({ ...formData, avatar: result.assets[0].uri })
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t('errors.generic'),
        text2: error.message,
      })
    }
  }

  const validate = () => {
    const newErrors = {}
    
    if (!formData.nickname || formData.nickname.length < 3) {
      newErrors.nickname = t('errors.nicknameFormat')
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.nickname)) {
      newErrors.nickname = t('errors.nicknameAlphanumeric')
    } else if (nicknameAvailable === false) {
      newErrors.nickname = t('onboarding.step1.nicknameTaken')
    }
    
    const age = parseInt(formData.age)
    if (!formData.age || isNaN(age) || age < 10 || age > 99) {
      newErrors.age = t('errors.ageRange', { min: 10, max: 99 })
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = async () => {
    if (!validate()) return
    
    try {
      setLoading(true)
      await onboardingService.submitStep1(formData)
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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <OnboardingHeader
          title={t('onboarding.step1.title')}
          subtitle={t('onboarding.step1.subtitle')}
          currentStep={1}
          totalSteps={3}
        />
        
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Nombre deshabilitado de Google */}
          <View style={styles.inputGroup}>
            <TextInput
              label={t('onboarding.step1.nameLabel')}
              value={user?.name || ''}
              disabled
              mode="outlined"
              style={styles.input}
            />
            <HelperText type="info">
              {t('onboarding.step1.nameDisabled')}
            </HelperText>
          </View>

          {/* Nickname */}
          <View style={styles.inputGroup}>
            <TextInput
              label={t('onboarding.step1.nicknameLabel')}
              value={formData.nickname}
              onChangeText={(text) => setFormData({ ...formData, nickname: text })}
              mode="outlined"
              style={styles.input}
              error={!!errors.nickname}
              right={
                checkingNickname ? (
                  <TextInput.Icon icon="loading" />
                ) : nicknameAvailable === true ? (
                  <TextInput.Icon icon="check-circle" iconColor="green" />
                ) : nicknameAvailable === false ? (
                  <TextInput.Icon icon="close-circle" iconColor="red" />
                ) : null
              }
            />
            <HelperText type={errors.nickname ? 'error' : 'info'}>
              {errors.nickname || t('onboarding.step1.nicknameHelp')}
            </HelperText>
          </View>

          {/* Edad */}
          <View style={styles.inputGroup}>
            <TextInput
              label={t('onboarding.step1.ageLabel')}
              value={formData.age}
              onChangeText={(text) => setFormData({ ...formData, age: text })}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
              error={!!errors.age}
            />
            {errors.age && (
              <HelperText type="error">{errors.age}</HelperText>
            )}
          </View>

          {/* Foto de perfil */}
          <View style={styles.photoSection}>
            <Text variant="titleMedium" style={styles.photoLabel}>
              {t('onboarding.step1.photoLabel')}
            </Text>
            
            <View style={styles.photoContainer}>
              <Avatar.Image
                size={100}
                source={
                  formData.avatar
                    ? { uri: formData.avatar }
                    : require('../../../assets/default-avatar.png')
                }
              />
              <IconButton
                icon="camera"
                mode="contained"
                onPress={handlePickImage}
                style={styles.cameraButton}
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            mode="contained"
            onPress={handleNext}
            loading={loading}
            disabled={loading || nicknameAvailable === false}
            style={styles.button}
          >
            {t('common.next')}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#fff',
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
    backgroundColor: '#2563eb',
  },
  footer: {
    padding: 24,
    paddingBottom: 32,
  },
  button: {
    borderRadius: 8,
  },
})
