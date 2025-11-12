import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  FlatList,
} from 'react-native'
import {
  Text,
  Card,
  Avatar,
  Button,
  useTheme,
} from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'

export function MyMatchesScreen({ navigation }) {
  const { t } = useTranslation()
  const theme = useTheme()
  const dynamicStyles = styles(theme)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(false)

  const mockMatches = [
    {
      id: 1,
      user: {
        id: 101,
        name: 'María',
        nickname: 'María',
        age: 28,
        avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b147',
        lastMessage: '¡Hola! Luna se divirtió mucho en el parque',
        lastMessageTime: '5 min',
      },
      dog: { name: 'Luna', breed: 'Golden Retriever', age: 3 },
      park_name: 'Parque Centenario',
      matchedAt: '2024-01-15',
      status: 'active'
    },
    {
      id: 2,
      user: {
        id: 102,
        name: 'Carlos',
        nickname: 'Carlos',
        age: 32,
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
        lastMessage: '¿Vamos al Parque Sarmiento mañana?',
        lastMessageTime: '1 h',
      },
      dog: { name: 'Max', breed: 'Labrador', age: 2 },
      park_name: 'Parque Sarmiento',
      matchedAt: '2024-01-10',
      status: 'active'
    },
    {
      id: 3,
      user: {
        id: 103,
        name: 'Ana',
        nickname: 'Ana',
        age: 25,
        avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80',
        lastMessage: 'Perfecto! Coco está emocionado por conocer nuevos amigos',
        lastMessageTime: '2 h',
      },
      dog: { name: 'Coco', breed: 'Border Collie', age: 4 },
      park_name: 'Parque Rivadavia',
      matchedAt: '2024-01-08',
      status: 'active'
    },
    {
      id: 4,
      user: {
        id: 104,
        name: 'Diego',
        nickname: 'Diego',
        age: 29,
        avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
        lastMessage: 'Rocky necesita más ejercicio, ¿organizamos una sesión de entrenamiento?',
        lastMessageTime: '1 día',
      },
      dog: { name: 'Rocky', breed: 'Pastor Alemán', age: 5 },
      park_name: 'Parque Chacabuco',
      matchedAt: '2024-01-05',
      status: 'active'
    }
  ]

  useEffect(() => {
    loadMatches()
  }, [])

  const loadMatches = async () => {
    setLoading(true)
    try {
      // TODO: Replace with real API call
      setTimeout(() => {
        setMatches(mockMatches)
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Error loading matches:', error)
      setLoading(false)
    }
  }

  const handleMatchPress = (match) => {
    navigation.navigate('UserProfile', { user: match.user })
  }

  const handleChatPress = (match) => {
    navigation.navigate('ChatsTab', {
      screen: 'Chat',
      params: {
        user: match.user,
        matchId: match.id
      }
    })
  }

  const renderMatch = ({ item }) => (
    <Card style={dynamicStyles.matchCard}>
      <Card.Content style={dynamicStyles.cardContent}>
        <View style={dynamicStyles.matchInfo}>
          {item.user.avatar_url ? (
            <Avatar.Image
              size={50}
              source={{ uri: item.user.avatar_url }}
              style={dynamicStyles.avatar}
            />
          ) : (
            <Avatar.Text
              size={50}
              label={item.user.name.charAt(0)}
              style={dynamicStyles.avatar}
            />
          )}

          <View style={dynamicStyles.textContainer}>
            <Text variant="titleMedium" style={dynamicStyles.userName}>
              {item.user.name}, {item.user.age}
            </Text>
            {item.dog && (
              <Text variant="bodyMedium" style={dynamicStyles.dogInfo}>
                Con {item.dog.name} ({item.dog.breed})
              </Text>
            )}
            {item.user.lastMessage && (
              <Text variant="bodySmall" style={dynamicStyles.lastMessage} numberOfLines={2}>
                {item.user.lastMessage}
              </Text>
            )}
            {item.user.lastMessageTime && (
              <Text variant="bodySmall" style={dynamicStyles.timestamp}>
                Hace {item.user.lastMessageTime}
              </Text>
            )}
          </View>
        </View>

        <View style={dynamicStyles.buttonsContainer}>
          <Button
            mode="outlined"
            onPress={() => handleMatchPress(item)}
            style={dynamicStyles.button}
            compact
          >
            Perfil
          </Button>
          <Button
            mode="contained"
            onPress={() => handleChatPress(item)}
            style={dynamicStyles.button}
            compact
            icon="message"
          >
            Chat
          </Button>
        </View>
      </Card.Content>
    </Card>
  )

  const EmptyComponent = () => (
    <View style={dynamicStyles.emptyContainer}>
      <Text variant="headlineSmall" style={dynamicStyles.emptyTitle}>
        {t('matches.noMatches')}
      </Text>
      <Text variant="bodyMedium" style={dynamicStyles.emptyText}>
        {t('matches.noMatchesDescription')}
      </Text>
      <Button
        mode="contained"
        onPress={() => navigation.navigate('DiscoverTab')}
        style={dynamicStyles.discoverButton}
      >
        {t('matches.startDiscovering')}
      </Button>
    </View>
  )

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <FlatList
        data={matches}
        renderItem={renderMatch}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={dynamicStyles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={loadMatches}
        ListEmptyComponent={EmptyComponent}
      />
    </SafeAreaView>
  )
}

const styles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  listContent: {
    flexGrow: 1,
    padding: 16,
  },
  matchCard: {
    marginBottom: 12,
    elevation: 2,
  },
  cardContent: {
    padding: 16,
  },
  matchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  userName: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  dogInfo: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  lastMessage: {
    color: theme.colors.onSurface,
    marginBottom: 2,
  },
  timestamp: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
    marginBottom: 24,
    lineHeight: 20,
  },
  discoverButton: {
    borderRadius: 8,
  },
})
