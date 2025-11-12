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
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import Toast from 'react-native-toast-message'
import { formatDistanceToNow } from 'date-fns'
import es from 'date-fns/locale/es'
import enUS from 'date-fns/locale/en-US'

import { messageService } from '../../services/api/messages'

export function ChatsListScreen({ navigation }) {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  const dynamicStyles = styles(theme)
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
      <Surface style={dynamicStyles.conversationItem} elevation={0}>
        <View style={dynamicStyles.avatarContainer}>
          <Avatar.Image
            size={56}
            source={{ uri: item.user.avatar || 'https://via.placeholder.com/56' }}
          />
          {item.user.is_online && (
            <View style={dynamicStyles.onlineIndicator} />
          )}
        </View>

        <View style={dynamicStyles.conversationContent}>
          <View style={dynamicStyles.conversationHeader}>
            <Text variant="titleMedium" style={dynamicStyles.userName}>
              {item.user.nickname}
            </Text>
            <Text variant="bodySmall" style={dynamicStyles.time}>
              {item.last_message_time ?
                formatDistanceToNow(new Date(item.last_message_time), {
                  addSuffix: true,
                  locale: dateLocale
                }) : ''
              }
            </Text>
          </View>

          <View style={dynamicStyles.messageRow}>
            <Text
              variant="bodyMedium"
              style={dynamicStyles.lastMessage}
              numberOfLines={1}
            >
              {item.last_message || t('chat.messages')}
            </Text>
            {item.unread > 0 && (
              <Badge style={dynamicStyles.unreadBadge}>{item.unread}</Badge>
            )}
          </View>
        </View>
      </Surface>
    </TouchableOpacity>
  )

  const EmptyComponent = () => (
    <View style={dynamicStyles.emptyContainer}>
      <MaterialCommunityIcons name="message-text-outline" size={64} color={theme.colors.outline} />
      <Text variant="headlineSmall" style={dynamicStyles.emptyTitle}>
        {t('chat.messages')}
      </Text>
      <Text variant="bodyLarge" style={dynamicStyles.emptyText}>
        {t('matches.noMatches')}
      </Text>
    </View>
  )

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <Text variant="headlineMedium">{t('chat.messages')}</Text>
      </View>

      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.chat_id.toString()}
        contentContainerStyle={dynamicStyles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={!loading && conversations.length === 0 ? EmptyComponent : null}
        ItemSeparatorComponent={() => <View style={dynamicStyles.separator} />}
      />
    </SafeAreaView>
  )
}

const styles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  listContent: {
    flexGrow: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: theme.colors.background,
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
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: theme.colors.background,
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
    color: theme.colors.onSurfaceVariant,
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    color: theme.colors.onSurfaceVariant,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: theme.colors.primary,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.outline,
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
    color: theme.colors.onSurfaceVariant,
  },
})
