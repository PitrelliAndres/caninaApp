import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
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
import { Picker } from '@react-native-picker/picker'

import { OnboardingHeader } from '../../components/onboarding/OnboardingHeader'
import { imageService } from '../../services/media/imageService'
import { onboardingService } from '../../services/api/onboarding'

// Lista de razas de perros
const DOG_BREEDS = [
  'Mestizo',
  'Labrador Retriever',
  'Golden Retriever',
  'Bulldog Francés',
  'Bulldog Inglés',
  'Beagle',
  'Poodle',
  'Yorkshire Terrier',
  'Dachshund',
  'Boxer',
  'Cocker Spaniel',
  'Schnauzer',
  'Chihuahua',
  'Pug',
  'Maltés',
  'Shih Tzu',
  'Border Collie',
  'Husky Siberiano',
  'Gran Danés',
  'Rottweiler',
  'Pastor Alemán',
  'Otro',
]

export function Step2Screen({ navigation, route }) {
  const { t } = useTranslation()
  const theme = useTheme()
  const { step1Data } = route.params || {}
  
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    breed: 'Mestizo',
    avatar: null,
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

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
    
    if (!formData.name || formData.name.length < 2) {
      newErrors.name = t('errors.dogNameMin')
    }
    
    const age = parseInt(formData.age)
    if (!formData.age || isNaN(age) || age < 0 || age > 25) {
      newErrors.age = t('errors.dogAgeRange')
    }
    
    if (!formData.breed) {
      newErrors.breed = t('onboarding.step2.requiredFields')
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = async () => {
    if (!validate()) return
    
    try {
      setLoading(true)
      await onboardingService.submitStep2({ dog: formData })
      navigation.navigate('Step3', { 
        step1Data, 
        step2Data: formData 
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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <OnboardingHeader
          title={t('onboarding.step2.title')}
          subtitle={t('onboarding.step2.subtitle')}
          currentStep={2}
          totalSteps={3}
        />
        
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Nombre del perro */}
          <View style={styles.inputGroup}>
            <TextInput
              label={t('onboarding.step2.dogNameLabel')}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              mode="outlined"
              style={styles.input}
              error={!!errors.name}
            />
            {errors.name && (
              <HelperText type="error">{errors.name}</HelperText>
            )}
          </View>

          {/* Edad del perro */}
          <View style={styles.inputGroup}>
            <TextInput
              label={t('onboarding.step2.dogAgeLabel')}
              value={formData.age}
              onChangeText={(text) => setFormData({ ...formData, age: text })}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
              error={!!errors.age}
            />
            <HelperText type={errors.age ? 'error' : 'info'}>
              {errors.age || t('onboarding.step2.dogAgeHelp')}
            </HelperText>
          </View>

          {/* Raza */}
          <View style={styles.inputGroup}>
            <Text variant="titleMedium" style={styles.label}>
              {t('onboarding.step2.breedLabel')}
            </Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.breed}
                onValueChange={(value) => setFormData({ ...formData, breed: value })}
                style={styles.picker}
              >
                {DOG_BREEDS.map((breed) => (
                  <Picker.Item key={breed} label={breed} value={breed} />
                ))}
              </Picker>
            </View>
            {errors.breed && (
              <HelperText type="error">{errors.breed}</HelperText>
            )}
          </View>

          {/* Foto del perro */}
          <View style={styles.photoSection}>
            <Text variant="titleMedium" style={styles.photoLabel}>
              {t('onboarding.step2.dogPhotoLabel')}
            </Text>
            
            <View style={styles.photoContainer}>
              <Avatar.Image
                size={100}
                source={
                  formData.avatar
                    ? { uri: formData.avatar }
                    : require('../../../assets/default-dog.png')
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
          <View style={styles.buttonRow}>
            <Button
              mode="outlined"
              onPress={handlePrevious}
              style={[styles.button, styles.previousButton]}
              disabled={loading}
            >
              {t('common.previous')}
            </Button>
            <Button
              mode="contained"
              onPress={handleNext}
              loading={loading}
              disabled={loading}
              style={[styles.button, styles.nextButton]}
            >
              {t('common.next')}
            </Button>
          </View>
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
  label: {
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
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
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 8,
  },
  previousButton: {
    borderColor: '#2563eb',
  },
  nextButton: {},
})
