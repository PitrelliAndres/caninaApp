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
  Avatar,
  List,
  Switch,
  Divider,
  useTheme,
} from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import AsyncStorage from '@react-native-async-storage/async-storage'

export function ProfileScreen({ navigation }) {
  const { t } = useTranslation()
  const theme = useTheme()
  const [user, setUser] = useState(null)
  const [darkMode, setDarkMode] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const dynamicStyles = styles(theme)

  // Mock user data - replace with real user data from context/state
  const mockUser = {
    id: 1,
    name: 'Usuario Demo',
    email: 'usuario@parkdog.com',
    profilePicture: null,
    joinDate: '2024-01-15',
    dogs: [
      {
        id: 1,
        name: 'Max',
        breed: 'Golden Retriever',
        age: 3
      }
    ],
    stats: {
      visits: 25,
      matches: 12,
      connections: 8
    }
  }

  useEffect(() => {
    loadUserData()
    loadSettings()
  }, [])

  const loadUserData = async () => {
    try {
      // TODO: Replace with real API call
      setUser(mockUser)
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const loadSettings = async () => {
    try {
      const darkModeValue = await AsyncStorage.getItem('darkMode')
      const notificationsValue = await AsyncStorage.getItem('notifications')

      if (darkModeValue !== null) {
        setDarkMode(JSON.parse(darkModeValue))
      }
      if (notificationsValue !== null) {
        setNotifications(JSON.parse(notificationsValue))
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const handleDarkModeToggle = async () => {
    try {
      const newValue = !darkMode
      setDarkMode(newValue)
      await AsyncStorage.setItem('darkMode', JSON.stringify(newValue))
      // TODO: Apply dark mode theme
    } catch (error) {
      console.error('Error saving dark mode setting:', error)
    }
  }

  const handleNotificationsToggle = async () => {
    try {
      const newValue = !notifications
      setNotifications(newValue)
      await AsyncStorage.setItem('notifications', JSON.stringify(newValue))
    } catch (error) {
      console.error('Error saving notifications setting:', error)
    }
  }

  const handleLogout = () => {
    Alert.alert(
      t('profile.logout'),
      t('profile.logoutConfirmation'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('profile.logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Clear auth tokens and user data
              await AsyncStorage.multiRemove(['authToken', 'userData'])
              // TODO: Navigate to login screen
              navigation.navigate('Auth')
            } catch (error) {
              console.error('Error during logout:', error)
            }
          },
        },
      ]
    )
  }

  if (!user) {
    return (
      <SafeAreaView style={dynamicStyles.container}>
        <View style={dynamicStyles.loadingContainer}>
          <Text variant="bodyLarge">{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <Card style={dynamicStyles.profileCard}>
          <Card.Content style={dynamicStyles.profileContent}>
            <Avatar.Text
              size={80}
              label={user.name?.charAt(0) || 'U'}
              style={dynamicStyles.avatar}
            />
            <View style={dynamicStyles.userInfo}>
              <Text variant="headlineSmall" style={dynamicStyles.userName}>
                {user.name}
              </Text>
              <Text variant="bodyMedium" style={dynamicStyles.userEmail}>
                {user.email}
              </Text>
              <Text variant="bodySmall" style={dynamicStyles.joinDate}>
                {t('profile.memberSince')} {new Date(user.joinDate).toLocaleDateString()}
              </Text>
            </View>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('EditProfile')}
              style={dynamicStyles.editButton}
              compact
            >
              {t('profile.edit')}
            </Button>
          </Card.Content>
        </Card>

        {/* Stats */}
        <Card style={dynamicStyles.statsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={dynamicStyles.sectionTitle}>
              {t('profile.stats')}
            </Text>
            <View style={dynamicStyles.statsContainer}>
              <View style={dynamicStyles.statItem}>
                <Text variant="headlineSmall" style={dynamicStyles.statNumber}>
                  {user.stats.visits}
                </Text>
                <Text variant="bodySmall" style={dynamicStyles.statLabel}>
                  {t('profile.visits')}
                </Text>
              </View>
              <View style={dynamicStyles.statItem}>
                <Text variant="headlineSmall" style={dynamicStyles.statNumber}>
                  {user.stats.matches}
                </Text>
                <Text variant="bodySmall" style={dynamicStyles.statLabel}>
                  {t('profile.matches')}
                </Text>
              </View>
              <View style={dynamicStyles.statItem}>
                <Text variant="headlineSmall" style={dynamicStyles.statNumber}>
                  {user.stats.connections}
                </Text>
                <Text variant="bodySmall" style={dynamicStyles.statLabel}>
                  {t('profile.connections')}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Settings */}
        <Card style={dynamicStyles.settingsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={dynamicStyles.sectionTitle}>
              {t('profile.settings')}
            </Text>

            <List.Item
              title={t('profile.darkMode')}
              description={t('profile.darkModeDescription')}
              left={props => <List.Icon {...props} icon="brightness-6" />}
              right={() => (
                <Switch
                  value={darkMode}
                  onValueChange={handleDarkModeToggle}
                />
              )}
            />

            <Divider />

            <List.Item
              title={t('profile.notifications')}
              description={t('profile.notificationsDescription')}
              left={props => <List.Icon {...props} icon="bell" />}
              right={() => (
                <Switch
                  value={notifications}
                  onValueChange={handleNotificationsToggle}
                />
              )}
            />

            <Divider />

            <List.Item
              title={t('profile.privacy')}
              description={t('profile.privacyDescription')}
              left={props => <List.Icon {...props} icon="shield-account" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('PrivacySettings')}
            />
          </Card.Content>
        </Card>

        {/* Actions */}
        <View style={dynamicStyles.actionsContainer}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('MyVisits')}
            style={dynamicStyles.actionButton}
            icon="calendar"
          >
            {t('profile.myVisits')}
          </Button>

          <Button
            mode="outlined"
            onPress={() => navigation.navigate('MyMatches')}
            style={dynamicStyles.actionButton}
            icon="heart"
          >
            {t('profile.myMatches')}
          </Button>

          <Button
            mode="outlined"
            onPress={handleLogout}
            style={[dynamicStyles.actionButton, dynamicStyles.logoutButton]}
            textColor={theme.colors.error}
            icon="logout"
          >
            {t('profile.logout')}
          </Button>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    margin: 16,
    elevation: 2,
  },
  profileContent: {
    alignItems: 'center',
    padding: 20,
  },
  avatar: {
    marginBottom: 12,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  joinDate: {
    color: theme.colors.onSurfaceVariant,
  },
  editButton: {
    borderRadius: 8,
  },
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  settingsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  actionsContainer: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    borderRadius: 8,
  },
  logoutButton: {
    borderColor: theme.colors.error,
  },
})
