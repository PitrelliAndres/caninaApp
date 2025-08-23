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
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          {profileUser.profilePicture ? (
            <Image 
              source={{ uri: profileUser.profilePicture }} 
              style={styles.profileImage}
            />
          ) : (
            <Avatar.Text 
              size={120} 
              label={profileUser.name?.charAt(0) || 'U'} 
              style={styles.avatar}
            />
          )}
          
          <Text variant="headlineMedium" style={styles.userName}>
            {profileUser.name}
          </Text>
          
          {profileUser.age && (
            <Text variant="bodyLarge" style={styles.userAge}>
              {profileUser.age} años
            </Text>
          )}
          
          {profileUser.location && (
            <Text variant="bodyMedium" style={styles.location}>
              📍 {profileUser.location}
            </Text>
          )}
        </View>

        {profileUser.bio && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                {t('profile.about')}
              </Text>
              <Text variant="bodyMedium" style={styles.bio}>
                {profileUser.bio}
              </Text>
            </Card.Content>
          </Card>
        )}

        {profileUser.dogs && profileUser.dogs.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                {t('profile.dogs')}
              </Text>
              {profileUser.dogs.map((dog) => (
                <View key={dog.id} style={styles.dogItem}>
                  <View style={styles.dogInfo}>
                    <Text variant="bodyLarge" style={styles.dogName}>
                      {dog.name}
                    </Text>
                    <Text variant="bodyMedium" style={styles.dogDetails}>
                      {dog.breed} • {dog.age} años
                    </Text>
                  </View>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {profileUser.interests && profileUser.interests.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                {t('profile.interests')}
              </Text>
              <View style={styles.interestsContainer}>
                {profileUser.interests.map((interest, index) => (
                  <Chip key={index} style={styles.interestChip}>
                    {interest}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        <View style={styles.buttonContainer}>
          <Button
            mode={isLiked ? "contained" : "outlined"}
            onPress={handleLike}
            icon={isLiked ? "heart" : "heart-outline"}
            style={[styles.actionButton, isLiked && { backgroundColor: theme.colors.error }]}
          >
            {isLiked ? t('matches.liked') : t('matches.like')}
          </Button>
          
          <Button
            mode="contained"
            onPress={handleMessage}
            icon="message"
            style={styles.actionButton}
          >
            {t('matches.message')}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
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
    color: '#666',
    marginBottom: 8,
  },
  location: {
    color: '#666',
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
    color: '#666',
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