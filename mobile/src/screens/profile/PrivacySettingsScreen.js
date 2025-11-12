import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native'
import {
  Text,
  Card,
  Button,
  Switch,
  List,
  Divider,
  useTheme,
} from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import AsyncStorage from '@react-native-async-storage/async-storage'

export function PrivacySettingsScreen({ navigation }) {
  const { t } = useTranslation()
  const theme = useTheme()
  const dynamicStyles = styles(theme)
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState({
    profileVisibility: true,
    showLocation: true,
    showLastSeen: true,
    allowMessages: true,
    showInDiscovery: true,
    shareWithMatches: true,
    dataCollection: true,
    pushNotifications: true,
    emailNotifications: false,
    locationSharing: true,
  })

  useEffect(() => {
    loadPrivacySettings()
  }, [])

  const loadPrivacySettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('privacySettings')
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings))
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error)
    }
  }

  const updateSetting = async (key, value) => {
    try {
      const newSettings = { ...settings, [key]: value }
      setSettings(newSettings)
      await AsyncStorage.setItem('privacySettings', JSON.stringify(newSettings))

      // TODO: Sync with backend API
      console.log('Privacy setting updated:', key, value)
    } catch (error) {
      console.error('Error saving privacy setting:', error)
      Alert.alert(t('common.error'), t('profile.settingsSaveError'))
    }
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      t('profile.deleteAccount'),
      t('profile.deleteAccountWarning'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('profile.deleteAccount'),
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              t('profile.confirmDeleteAccount'),
              t('profile.deleteAccountFinalWarning'),
              [
                {
                  text: t('common.cancel'),
                  style: 'cancel',
                },
                {
                  text: t('common.delete'),
                  style: 'destructive',
                  onPress: performAccountDeletion,
                },
              ]
            )
          },
        },
      ]
    )
  }

  const performAccountDeletion = async () => {
    setLoading(true)
    try {
      // TODO: Implement actual account deletion API call
      console.log('Deleting user account...')

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Clear all local data
      await AsyncStorage.clear()

      Alert.alert(
        t('profile.accountDeleted'),
        t('profile.accountDeletedMessage'),
        [{ text: t('common.ok'), onPress: () => navigation.navigate('Auth') }]
      )
    } catch (error) {
      console.error('Error deleting account:', error)
      Alert.alert(t('common.error'), t('profile.deleteAccountError'))
    } finally {
      setLoading(false)
    }
  }

  const exportData = async () => {
    Alert.alert(
      t('profile.exportData'),
      t('profile.exportDataDescription'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('profile.export'),
          onPress: async () => {
            try {
              // TODO: Implement data export functionality
              console.log('Exporting user data...')
              Alert.alert(t('common.success'), t('profile.exportDataSuccess'))
            } catch (error) {
              console.error('Error exporting data:', error)
              Alert.alert(t('common.error'), t('profile.exportDataError'))
            }
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Privacy */}
        <Card style={dynamicStyles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={dynamicStyles.sectionTitle}>
              {t('profile.profilePrivacy')}
            </Text>

            <List.Item
              title={t('profile.profileVisibility')}
              description={t('profile.profileVisibilityDescription')}
              left={props => <List.Icon {...props} icon="eye" />}
              right={() => (
                <Switch
                  value={settings.profileVisibility}
                  onValueChange={(value) => updateSetting('profileVisibility', value)}
                />
              )}
            />

            <Divider />

            <List.Item
              title={t('profile.showLocation')}
              description={t('profile.showLocationDescription')}
              left={props => <List.Icon {...props} icon="map-marker" />}
              right={() => (
                <Switch
                  value={settings.showLocation}
                  onValueChange={(value) => updateSetting('showLocation', value)}
                />
              )}
            />

            <Divider />

            <List.Item
              title={t('profile.showLastSeen')}
              description={t('profile.showLastSeenDescription')}
              left={props => <List.Icon {...props} icon="clock" />}
              right={() => (
                <Switch
                  value={settings.showLastSeen}
                  onValueChange={(value) => updateSetting('showLastSeen', value)}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Communication Privacy */}
        <Card style={dynamicStyles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={dynamicStyles.sectionTitle}>
              {t('profile.communicationPrivacy')}
            </Text>

            <List.Item
              title={t('profile.allowMessages')}
              description={t('profile.allowMessagesDescription')}
              left={props => <List.Icon {...props} icon="message" />}
              right={() => (
                <Switch
                  value={settings.allowMessages}
                  onValueChange={(value) => updateSetting('allowMessages', value)}
                />
              )}
            />

            <Divider />

            <List.Item
              title={t('profile.showInDiscovery')}
              description={t('profile.showInDiscoveryDescription')}
              left={props => <List.Icon {...props} icon="compass" />}
              right={() => (
                <Switch
                  value={settings.showInDiscovery}
                  onValueChange={(value) => updateSetting('showInDiscovery', value)}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Data Privacy */}
        <Card style={dynamicStyles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={dynamicStyles.sectionTitle}>
              {t('profile.dataPrivacy')}
            </Text>

            <List.Item
              title={t('profile.dataCollection')}
              description={t('profile.dataCollectionDescription')}
              left={props => <List.Icon {...props} icon="database" />}
              right={() => (
                <Switch
                  value={settings.dataCollection}
                  onValueChange={(value) => updateSetting('dataCollection', value)}
                />
              )}
            />

            <Divider />

            <List.Item
              title={t('profile.locationSharing')}
              description={t('profile.locationSharingDescription')}
              left={props => <List.Icon {...props} icon="crosshairs-gps" />}
              right={() => (
                <Switch
                  value={settings.locationSharing}
                  onValueChange={(value) => updateSetting('locationSharing', value)}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Data Management */}
        <Card style={dynamicStyles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={dynamicStyles.sectionTitle}>
              {t('profile.dataManagement')}
            </Text>

            <List.Item
              title={t('profile.exportData')}
              description={t('profile.exportDataDescription')}
              left={props => <List.Icon {...props} icon="download" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={exportData}
            />

            <Divider />

            <List.Item
              title={t('profile.deleteAccount')}
              description={t('profile.deleteAccountDescription')}
              left={props => <List.Icon {...props} icon="delete" color={theme.colors.error} />}
              right={props => <List.Icon {...props} icon="chevron-right" color={theme.colors.error} />}
              onPress={handleDeleteAccount}
              titleStyle={{ color: theme.colors.error }}
            />
          </Card.Content>
        </Card>

        <View style={dynamicStyles.infoContainer}>
          <Text variant="bodySmall" style={dynamicStyles.infoText}>
            {t('profile.privacyNotice')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoContainer: {
    padding: 16,
    marginBottom: 16,
  },
  infoText: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
  },
})
