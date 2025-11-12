import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Text, ProgressBar, useTheme } from 'react-native-paper'
import { useTranslation } from 'react-i18next'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'

export function OnboardingHeader({ title, subtitle, currentStep, totalSteps }) {
  const { t } = useTranslation()
  const theme = useTheme()
  const progress = currentStep / totalSteps
  const dynamicStyles = styles(theme)

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.iconContainer}>
        <MaterialCommunityIcons name="paw" size={48} color={theme.colors.primary} />
      </View>

      <Text variant="headlineMedium" style={dynamicStyles.title}>
        {title}
      </Text>

      {subtitle && (
        <Text variant="bodyLarge" style={dynamicStyles.subtitle}>
          {subtitle}
        </Text>
      )}

      <View style={dynamicStyles.progressContainer}>
        <Text variant="bodySmall" style={dynamicStyles.progressText}>
          {t('onboarding.progress', { current: currentStep, total: totalSteps })}
        </Text>
        <ProgressBar progress={progress} style={dynamicStyles.progressBar} />
      </View>
    </View>
  )
}

const styles = (theme) => StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primaryContainer,
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
    color: theme.colors.onSurfaceVariant,
    marginBottom: 24,
  },
  progressContainer: {
    width: '100%',
  },
  progressText: {
    textAlign: 'center',
    marginBottom: 8,
    color: theme.colors.onSurfaceVariant,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
})
