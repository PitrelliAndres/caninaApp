import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native'
import {
  Text,
  Card,
  Button,
  TextInput,
  Avatar,
  useTheme,
} from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { imageService } from '../../services/media/imageService'

export function EditProfileScreen({ navigation, route }) {
  const { t } = useTranslation()
  const theme = useTheme()
  const dynamicStyles = styles(theme)
  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    bio: '',
    location: '',
    phone: '',
    profilePicture: null,
  })

  // Mock user data - replace with real user data
  const mockUser = {
    id: 1,
    name: 'Usuario Demo',
    email: 'usuario@parkdog.com',
    bio: 'Amante de los perros y los parques. Me encanta conocer gente nueva y que nuestras mascotas jueguen juntas.',
    location: 'Buenos Aires, Argentina',
    phone: '+54 11 1234-5678',
    profilePicture: null,
  }

  useEffect(() => {
    loadProfileData()
  }, [])

  const loadProfileData = async () => {
    try {
      // TODO: Replace with real API call
      setProfileData(mockUser)
    } catch (error) {
      console.error('Error loading profile data:', error)
      Alert.alert(t('common.error'), t('profile.loadError'))
    }
  }

  const handleImagePicker = async () => {
    const options = [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.takePhoto'),
        onPress: () => openCamera()
      },
      {
        text: t('profile.chooseFromLibrary'),
        onPress: () => openImageLibrary()
      },
    ]

    Alert.alert(t('profile.selectPhoto'), t('profile.selectPhotoDescription'), options)
  }

  const openCamera = async () => {
    const result = await imageService.takePhotoAsync({
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 1000,
      maxWidth: 1000,
      quality: 0.8,
    })

    if (!result.cancelled && result.uri) {
      setProfileData(prev => ({
        ...prev,
        profilePicture: result.uri
      }))
    }
  }

  const openImageLibrary = async () => {
    const result = await imageService.pickImageAsync({
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 1000,
      maxWidth: 1000,
      quality: 0.8,
    })

    if (!result.cancelled && result.uri) {
      setProfileData(prev => ({
        ...prev,
        profilePicture: result.uri
      }))
    }
  }

  const handleSave = async () => {
    if (!profileData.name.trim()) {
      Alert.alert(t('common.error'), t('profile.nameRequired'))
      return
    }

    if (!profileData.email.trim()) {
      Alert.alert(t('common.error'), t('profile.emailRequired'))
      return
    }

    setLoading(true)
    try {
      // TODO: Replace with real API call
      console.log('Saving profile data:', profileData)

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      Alert.alert(
        t('common.success'),
        t('profile.profileUpdated'),
        [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
      )
    } catch (error) {
      console.error('Error saving profile:', error)
      Alert.alert(t('common.error'), t('profile.saveError'))
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Card style={dynamicStyles.card}>
          <Card.Content>
            {/* Profile Picture */}
            <View style={dynamicStyles.avatarContainer}>
              <TouchableOpacity onPress={handleImagePicker}>
                {profileData.profilePicture ? (
                  <Avatar.Image
                    size={100}
                    source={{ uri: profileData.profilePicture }}
                    style={dynamicStyles.avatar}
                  />
                ) : (
                  <Avatar.Text
                    size={100}
                    label={profileData.name?.charAt(0) || 'U'}
                    style={dynamicStyles.avatar}
                  />
                )}
                <View style={dynamicStyles.cameraIcon}>
                  <Avatar.Icon
                    size={30}
                    icon="camera"
                    style={dynamicStyles.cameraButton}
                  />
                </View>
              </TouchableOpacity>
              <Text variant="bodySmall" style={dynamicStyles.avatarHint}>
                {t('profile.tapToChangePhoto')}
              </Text>
            </View>

            {/* Form Fields */}
            <TextInput
              label={t('profile.name')}
              value={profileData.name}
              onChangeText={(text) => updateField('name', text)}
              style={dynamicStyles.input}
              mode="outlined"
            />

            <TextInput
              label={t('profile.email')}
              value={profileData.email}
              onChangeText={(text) => updateField('email', text)}
              style={dynamicStyles.input}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              label={t('profile.bio')}
              value={profileData.bio}
              onChangeText={(text) => updateField('bio', text)}
              style={dynamicStyles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
              placeholder={t('profile.bioPlaceholder')}
            />

            <TextInput
              label={t('profile.location')}
              value={profileData.location}
              onChangeText={(text) => updateField('location', text)}
              style={dynamicStyles.input}
              mode="outlined"
              placeholder={t('profile.locationPlaceholder')}
            />

            <TextInput
              label={t('profile.phone')}
              value={profileData.phone}
              onChangeText={(text) => updateField('phone', text)}
              style={dynamicStyles.input}
              mode="outlined"
              keyboardType="phone-pad"
              placeholder={t('profile.phonePlaceholder')}
            />
          </Card.Content>
        </Card>

        <View style={dynamicStyles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={loading}
            disabled={loading}
            style={dynamicStyles.saveButton}
            contentStyle={dynamicStyles.buttonContent}
          >
            {t('profile.saveChanges')}
          </Button>

          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            disabled={loading}
            style={dynamicStyles.cancelButton}
            contentStyle={dynamicStyles.buttonContent}
          >
            {t('common.cancel')}
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
  card: {
    margin: 16,
    elevation: 2,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    marginBottom: 8,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 8,
    right: -5,
  },
  cameraButton: {
    backgroundColor: theme.colors.primary,
  },
  avatarHint: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  buttonContainer: {
    padding: 16,
    gap: 12,
  },
  saveButton: {
    borderRadius: 8,
  },
  cancelButton: {
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
})
