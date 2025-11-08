import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native'
import {
  Text,
  Button,
  Switch,
  Checkbox,
  useTheme,
  List,
  Divider,
} from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import Toast from 'react-native-toast-message'

import { OnboardingHeader } from '../../components/onboarding/OnboardingHeader'
import { onboardingService } from '../../services/api/onboarding'
import { fetchCurrentUser } from '../../store/slices/userSlice'

// Lista de intereses
const INTERESTS = [
  'Paseos largos',
  'Juegos en el parque',
  'Entrenamiento',
  'Socialización',
  'Deportes caninos',
  'Caminatas',
  'Fotografía de mascotas',
  'Cuidados y salud',
  'Adopción responsable',
  'Eventos caninos',
]

export function Step3Screen({ navigation, route }) {
  const { t } = useTranslation()
  const theme = useTheme()
  const dispatch = useDispatch()
  const { step1Data, step2Data } = route.params || {}
  
  const [preferences, setPreferences] = useState({
    isPublic: true,
    allowMatching: true,
    allowProximity: false,
    selectedInterests: [],
  })
  const [loading, setLoading] = useState(false)

  const handleSwitchChange = (name, value) => {
    setPreferences({ ...preferences, [name]: value })
  }

  const handleInterestToggle = (interest) => {
    const newInterests = preferences.selectedInterests.includes(interest)
      ? preferences.selectedInterests.filter(i => i !== interest)
      : [...preferences.selectedInterests, interest]
    
    setPreferences({ ...preferences, selectedInterests: newInterests })
  }

  const handleFinish = async () => {
    try {
      setLoading(true)
      
      // Enviar step 3
      await onboardingService.submitStep3({
        privacy: {
          public_profile: preferences.isPublic,
          enable_match: preferences.allowMatching,
          enable_proximity: preferences.allowProximity,
        },
        interests: preferences.selectedInterests,
      })
      
      // Actualizar estado del usuario
      await dispatch(fetchCurrentUser()).unwrap()

      Toast.show({
        type: 'success',
        text1: t('onboarding.complete'),
        text2: t('onboarding.welcomeMessage'),
      })

      // No necesitamos navegar manualmente
      // AppNavigator detectará que user.onboarded === true
      // y automáticamente mostrará MainNavigator
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
      <OnboardingHeader
        title={t('onboarding.step3.title')}
        subtitle={t('onboarding.step3.subtitle')}
        currentStep={3}
        totalSteps={3}
      />
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Sección de Privacidad */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            {t('onboarding.step3.privacySection')}
          </Text>
          
          <List.Item
            title={t('onboarding.step3.publicProfile')}
            description={t('onboarding.step3.publicProfileDesc')}
            right={() => (
              <Switch
                value={preferences.isPublic}
                onValueChange={(value) => handleSwitchChange('isPublic', value)}
                color={theme.colors.primary}
              />
            )}
            style={styles.listItem}
          />
          
          <Divider />
          
          <List.Item
            title={t('onboarding.step3.allowMatching')}
            description={t('onboarding.step3.allowMatchingDesc')}
            right={() => (
              <Switch
                value={preferences.allowMatching}
                onValueChange={(value) => handleSwitchChange('allowMatching', value)}
                color={theme.colors.primary}
              />
            )}
            style={styles.listItem}
          />
          
          <Divider />
          
          <List.Item
            title={t('onboarding.step3.allowProximity')}
            description={t('onboarding.step3.allowProximityDesc')}
            right={() => (
              <Switch
                value={preferences.allowProximity}
                onValueChange={(value) => handleSwitchChange('allowProximity', value)}
                color={theme.colors.primary}
              />
            )}
            style={styles.listItem}
          />
        </View>

        {/* Sección de Intereses */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            {t('onboarding.step3.interestsSection')}
          </Text>
          
          <View style={styles.interestsGrid}>
            {INTERESTS.map((interest) => (
              <View key={interest} style={styles.interestItem}>
                <Checkbox
                  status={preferences.selectedInterests.includes(interest) ? 'checked' : 'unchecked'}
                  onPress={() => handleInterestToggle(interest)}
                  color={theme.colors.primary}
                />
                <Text 
                  style={styles.interestLabel}
                  onPress={() => handleInterestToggle(interest)}
                >
                  {interest}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <Text variant="bodySmall" style={styles.note}>
          {t('onboarding.step3.note')}
        </Text>
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
            onPress={handleFinish}
            loading={loading}
            disabled={loading}
            style={[styles.button, styles.finishButton]}
          >
            {t('common.finish')}
          </Button>
        </View>
      </View>
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
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    paddingHorizontal: 24,
    marginBottom: 16,
    fontWeight: '600',
  },
  listItem: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  interestsGrid: {
    paddingHorizontal: 24,
  },
  interestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  interestLabel: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  note: {
    paddingHorizontal: 24,
    textAlign: 'center',
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  footer: {
    padding: 24,
    paddingBottom: 32,
    backgroundColor: '#fff',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  finishButton: {},
})
