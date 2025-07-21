import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native'
import {
  Text,
  Avatar,
  Badge,
  Surface,
  useTheme,
} from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import Toast from 'react-native-toast-message'
import { formatDistanceToNow } from 'date-fns'
import { es, enUS } from 'date-fns/locale'

import { messageService } from '../../services/api/messages'

export function ChatsListScreen({ navigation }) {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const dateLocale = i18n.language === 'es' ? es : enUS

  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    try {
      setLoading(true)
      const response = await messageService.getConversations()
      setConversations(response.conversations || [])
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t('errors.generic'),
        text2: error.message,
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    loadConversations()
  }

  const handleChatPress = (conversation) => {
    navigation.navigate('Chat', {
      chatId: conversation.chat_id,
      user: conversation.user,
    })
  }

  const renderConversation = ({ item }) => (
    <TouchableOpacity onPress={() => handleChatPress(item)}>
      <Surface style={styles.conversationItem} elevation={0}>
        <View style={styles.avatarContainer}>
          <Avatar.Image
            size={56}
            source={{ uri: item.user.avatar || 'https://via.placeholder.com/56' }}
          />
          {item.user.is_online && (
            <View style={styles.onlineIndicator} />
          )}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text variant="titleMedium" style={styles.userName}>
              {item.user.nickname}
            </Text>
            <Text variant="bodySmall" style={styles.time}>
              {item.last_message_time ? 
                formatDistanceToNow(new Date(item.last_message_time), { 
                  addSuffix: true, 
                  locale: dateLocale 
                }) : ''
              }
            </Text>
          </View>

          <View style={styles.messageRow}>
            <Text 
              variant="bodyMedium" 
              style={styles.lastMessage}
              numberOfLines={1}
            >
              {item.last_message || t('chat.messages')}
            </Text>
            {item.unread > 0 && (
              <Badge style={styles.unreadBadge}>{item.unread}</Badge>
            )}
          </View>
        </View>
      </Surface>
    </TouchableOpacity>
  )

  const EmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="message-text-outline" size={64} color="#ccc" />
      <Text variant="headlineSmall" style={styles.emptyTitle}>
        {t('chat.messages')}
      </Text>
      <Text variant="bodyLarge" style={styles.emptyText}>
        {t('matches.noMatches')}
      </Text>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium">{t('chat.messages')}</Text>
      </View>

      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.chat_id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={!loading && conversations.length === 0 ? EmptyComponent : null}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  listContent: {
    flexGrow: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4caf50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontWeight: '600',
  },
  time: {
    color: '#666',
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    color: '#666',
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#2563eb',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 84,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
  },
})