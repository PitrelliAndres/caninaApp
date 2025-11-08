import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Text, ProgressBar } from 'react-native-paper'
import { useTranslation } from 'react-i18next'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'

export function OnboardingHeader({ title, subtitle, currentStep, totalSteps }) {
  const { t } = useTranslation()
  const progress = currentStep / totalSteps

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name="paw" size={48} color="#2563eb" />
      </View>
      
      <Text variant="headlineMedium" style={styles.title}>
        {title}
      </Text>
      
      {subtitle && (
        <Text variant="bodyLarge" style={styles.subtitle}>
          {subtitle}
        </Text>
      )}
      
      <View style={styles.progressContainer}>
        <Text variant="bodySmall" style={styles.progressText}>
          {t('onboarding.progress', { current: currentStep, total: totalSteps })}
        </Text>
        <ProgressBar progress={progress} style={styles.progressBar} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
  },
  progressContainer: {
    width: '100%',
  },
  progressText: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#666',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
})
