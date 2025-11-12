import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native'
import {
  Text,
  Card,
  Button,
  Chip,
  Avatar,
  useTheme,
} from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'

const { width } = Dimensions.get('window')

export function UserProfileScreen({ route, navigation }) {
  const { user } = route.params || {}
  const { t } = useTranslation()
  const theme = useTheme()
  const dynamicStyles = styles(theme)
  const [isLiked, setIsLiked] = useState(false)

  // Mock user data if not provided
  const profileUser = user || {
    id: 1,
    name: 'Usuario Demo',
    age: 28,
    bio: 'Amante de los perros y los parques',
    profilePicture: null,
    dogs: [
      {
        id: 1,
        name: 'Max',
        breed: 'Golden Retriever',
        age: 3,
        photo: null
      }
    ],
    interests: ['Correr', 'Caminatas', 'Fotografía'],
    location: 'Buenos Aires'
  }

  const handleLike = () => {
    setIsLiked(!isLiked)
    // TODO: Implement like/unlike logic
  }

  const handleMessage = () => {
    // TODO: Navigate to chat screen
    navigation.navigate('Chat', { user: profileUser })
  }

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={dynamicStyles.header}>
          {profileUser.profilePicture ? (
            <Image
              source={{ uri: profileUser.profilePicture }}
              style={dynamicStyles.profileImage}
            />
          ) : (
            <Avatar.Text
              size={120}
              label={profileUser.name?.charAt(0) || 'U'}
              style={dynamicStyles.avatar}
            />
          )}

          <Text variant="headlineMedium" style={dynamicStyles.userName}>
            {profileUser.name}
          </Text>

          {profileUser.age && (
            <Text variant="bodyLarge" style={dynamicStyles.userAge}>
              {profileUser.age} años
            </Text>
          )}

          {profileUser.location && (
            <Text variant="bodyMedium" style={dynamicStyles.location}>
              📍 {profileUser.location}
            </Text>
          )}
        </View>

        {profileUser.bio && (
          <Card style={dynamicStyles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={dynamicStyles.sectionTitle}>
                {t('profile.about')}
              </Text>
              <Text variant="bodyMedium" style={dynamicStyles.bio}>
                {profileUser.bio}
              </Text>
            </Card.Content>
          </Card>
        )}

        {profileUser.dogs && profileUser.dogs.length > 0 && (
          <Card style={dynamicStyles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={dynamicStyles.sectionTitle}>
                {t('profile.dogs')}
              </Text>
              {profileUser.dogs.map((dog) => (
                <View key={dog.id} style={dynamicStyles.dogItem}>
                  <View style={dynamicStyles.dogInfo}>
                    <Text variant="bodyLarge" style={dynamicStyles.dogName}>
                      {dog.name}
                    </Text>
                    <Text variant="bodyMedium" style={dynamicStyles.dogDetails}>
                      {dog.breed} • {dog.age} años
                    </Text>
                  </View>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {profileUser.interests && profileUser.interests.length > 0 && (
          <Card style={dynamicStyles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={dynamicStyles.sectionTitle}>
                {t('profile.interests')}
              </Text>
              <View style={dynamicStyles.interestsContainer}>
                {profileUser.interests.map((interest, index) => (
                  <Chip key={index} style={dynamicStyles.interestChip}>
                    {interest}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        <View style={dynamicStyles.buttonContainer}>
          <Button
            mode={isLiked ? "contained" : "outlined"}
            onPress={handleLike}
            icon={isLiked ? "heart" : "heart-outline"}
            style={[dynamicStyles.actionButton, isLiked && { backgroundColor: theme.colors.error }]}
          >
            {isLiked ? t('matches.liked') : t('matches.like')}
          </Button>

          <Button
            mode="contained"
            onPress={handleMessage}
            icon="message"
            style={dynamicStyles.actionButton}
          >
            {t('matches.message')}
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
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: theme.colors.background,
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  avatar: {
    marginBottom: 16,
  },
  userName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userAge: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: 8,
  },
  location: {
    color: theme.colors.onSurfaceVariant,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  bio: {
    lineHeight: 20,
  },
  dogItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dogInfo: {
    flex: 1,
  },
  dogName: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  dogDetails: {
    color: theme.colors.onSurfaceVariant,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  buttonContainer: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    borderRadius: 8,
  },
})
