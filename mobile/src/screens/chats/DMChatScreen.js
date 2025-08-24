import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import {
  Text,
  TextInput,
  IconButton,
  Avatar,
  Surface,
  useTheme,
  ActivityIndicator,
  Chip,
} from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import Toast from 'react-native-toast-message'
import { formatDistanceToNow } from 'date-fns'
import { es, enUS } from 'date-fns/locale'

import { messageService } from '../../services/api/messages'
import { useSelector } from 'react-redux'
import MobileLogger from '../../utils/logger'
import * as SecureStore from 'expo-secure-store'

export function DMChatScreen({ navigation, route }) {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  const { user } = useSelector((state) => state.user)
  const { conversationId, chatId, user: chatUser } = route.params
  const actualConversationId = conversationId || chatId  // Aceptar ambos nombres
  
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [otherUserTyping, setOtherUserTyping] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const [hasMatch, setHasMatch] = useState(true)
  const [error, setError] = useState(null)
  
  const flatListRef = useRef(null)
  const socketRef = useRef(null)
  
  // Auth status validation
  useEffect(() => {
    if (!user?.id) {
      // User not authenticated - handle appropriately
    }
  }, [user, actualConversationId])
  const typingTimeoutRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const dateLocale = i18n.language === 'es' ? es : enUS

  useEffect(() => {
    setupDMChat()
    
    return () => {
      cleanup()
    }
  }, [actualConversationId])

  const cleanup = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    messageService.removeAllListeners()
    messageService.sendTypingDM(actualConversationId, false) // Stop typing
  }

  const setupDMChat = async () => {
    // Iniciando configuración del chat DM
    try {
      setLoading(true)
      setConnectionStatus('connecting')
      
      // Check for realtime token first
      let realtimeToken = await SecureStore.getItemAsync('realtime_token')
      // Verificación de token de tiempo real
      
      if (!realtimeToken) {
        console.warn('No realtime token found, attempting to get new WebSocket token...')
        // Try to get a fresh WebSocket token
        try {
          const { apiClient } = await import('../../services/api/client')
          const authHeaders = await apiClient.getAuthHeaders()
          const wsTokenResponse = await fetch(`${apiClient.baseURL}/auth/ws-token`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              ...authHeaders
            }
          })
          
          if (wsTokenResponse.ok) {
            const wsTokenData = await wsTokenResponse.json()
            realtimeToken = wsTokenData.realtime_token
            await SecureStore.setItemAsync('realtime_token', realtimeToken)
            console.log('Mobile WebSocket token obtained successfully')
          } else {
            console.error('Failed to get mobile WebSocket token:', await wsTokenResponse.text())
          }
        } catch (tokenError) {
          console.error('Mobile token acquisition failed:', tokenError)
        }
      }
      
      // Connect to WebSocket
      socketRef.current = await messageService.connectWebSocket()
      
      if (!socketRef.current) {
        throw new Error('Could not establish WebSocket connection')
      }

      // Set up DM event listeners
      setupDMEventListeners()
      
      // Join the conversation
      const response = await messageService.joinConversation(actualConversationId)
      
      if (response && response.messages) {
        setMessages(response.messages)
        setConnectionStatus('connected')
        scrollToBottom()
        
        // Mark latest message as read if exists
        if (response.messages.length > 0) {
          const latestMessage = response.messages[response.messages.length - 1]
          messageService.markAsReadDM(actualConversationId, latestMessage.id)
        }
      }
      
    } catch (error) {
      MobileLogger.logError(error, { conversationId: actualConversationId }, 'DMChatScreen')
      handleDMError(error)
    } finally {
      setLoading(false)
    }
  }

  const setupDMEventListeners = () => {
    // Listen for new messages
    messageService.onNewDMMessage((data) => {
      if (data.conversationId === actualConversationId) {
        const newMsg = data.message
        
        // Processing incoming message
        
        setMessages(prev => {
          // Check if message already exists (pending from outbox)
          const existingIndex = prev.findIndex(msg => 
            msg.id === newMsg.id || 
            (msg.temp_id && msg.sender_id === newMsg.sender_id && msg.text === newMsg.text)
          )
          
          if (existingIndex !== -1) {
            // Update existing pending message with server data
            const updated = [...prev]
            updated[existingIndex] = {
              ...updated[existingIndex],
              id: newMsg.id,
              created_at: newMsg.created_at,
              time: newMsg.time,
              status: 'sent'
            }
            return updated
          } else {
            // Add new message (from other user or if outbox failed)
            return [...prev, newMsg]
          }
        })
        
        // Auto-mark as read if we're viewing the chat
        messageService.markAsReadDM(actualConversationId, newMsg.id)
        scrollToBottom()
      }
    })

    // Listen for typing indicators
    messageService.onDMTyping((data) => {
      if (data.conversationId === actualConversationId && data.userId !== user?.id) {
        setOtherUserTyping(data.isTyping)
        
        if (data.isTyping) {
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
          }
          
          typingTimeoutRef.current = setTimeout(() => {
            setOtherUserTyping(false)
          }, 3000)
        }
      }
    })

    // Listen for read receipts
    messageService.onDMReadReceipt((data) => {
      if (data.conversationId === actualConversationId) {
        setMessages(prev => 
          prev.map(msg => {
            if (msg.id <= data.upToMessageId && msg.sender_id === user?.id) {
              return { ...msg, is_read: true }
            }
            return msg
          })
        )
      }
    })

    // Listen for DM-specific errors
    messageService.onDMError((error) => {
      handleDMError(error)
    })

    // Connection status
    const socket = messageService.getSocket()
    if (socket) {
      socket.on('connect', () => setConnectionStatus('connected'))
      socket.on('disconnect', () => {
        setConnectionStatus('reconnecting')
        attemptReconnect()
      })
    }
  }

  const handleDMError = (error) => {
    const errorId = MobileLogger.logError(error, {
      conversationId: actualConversationId,
      errorCode: error.code
    }, 'DMChatScreen')
    
    if (error.code === 'NO_MATCH') {
      setHasMatch(false)
      setError(t('chat.dm.noMutualMatch'))
    } else if (error.code === 'BLOCKED') {
      setError(t('chat.dm.userBlocked'))
    } else if (error.code === 'UNAUTHORIZED') {
      setError(t('chat.dm.unauthorized'))
      navigation.goBack()
    } else {
      setError(error.message || t('chat.dm.messageFailedToSend'))
    }
  }

  const attemptReconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    reconnectTimeoutRef.current = setTimeout(() => {
      setupDMChat()
    }, 2000)
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true })
    }, 100)
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || sending || !hasMatch) return
    
    const messageText = newMessage.trim()
    setNewMessage('')
    setSending(true)
    
    // Stop typing indicator
    messageService.sendTypingDM(actualConversationId, false)
    
    try {
      const response = await messageService.sendDMMessage(actualConversationId, messageText)
      
      // Message will be added via dm:new event from server
      scrollToBottom()
      
    } catch (error) {
      console.error('Send message error:', error)
      // Restore message text for retry
      setNewMessage(messageText)
      handleDMError(error)
    } finally {
      setSending(false)
    }
  }

  const handleTextChange = (text) => {
    setNewMessage(text)
    
    // Send typing indicator
    if (text.length > 0 && hasMatch) {
      messageService.sendTypingDM(actualConversationId, true)
    } else {
      messageService.sendTypingDM(actualConversationId, false)
    }
  }

  const renderMessage = ({ item: message }) => {
    const isOwnMessage = message.sender_id === user?.id
    
    // Message ownership check
    
    const timeText = formatDistanceToNow(new Date(message.created_at), {
      addSuffix: true,
      locale: dateLocale
    })

    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        <Surface style={[
          styles.messageBubble,
          isOwnMessage 
            ? { backgroundColor: theme.colors.primary }
            : { backgroundColor: theme.colors.surface }
        ]}>
          <Text style={[
            styles.messageText,
            isOwnMessage && { color: theme.colors.onPrimary }
          ]}>
            {message.text}
          </Text>
          <View style={styles.messageInfo}>
            <Text style={[
              styles.timeText,
              isOwnMessage && { color: theme.colors.onPrimary }
            ]}>
              {timeText}
            </Text>
            {isOwnMessage && (
              <MaterialCommunityIcons
                name={
                  message.status === 'pending' ? 'clock-outline' :
                  message.status === 'failed' ? 'alert-circle-outline' :
                  message.is_read ? 'check-all' : 'check'
                }
                size={14}
                color={
                  message.status === 'pending' ? (isOwnMessage ? theme.colors.onPrimary : theme.colors.primary) :
                  message.status === 'failed' ? theme.colors.error :
                  isOwnMessage ? theme.colors.onPrimary : theme.colors.primary
                }
              />
            )}
          </View>
        </Surface>
      </View>
    )
  }

  const renderConnectionStatus = () => {
    if (connectionStatus === 'connected') return null

    const statusConfig = {
      connecting: { text: t('chat.dm.connecting'), color: theme.colors.primary },
      reconnecting: { text: t('chat.dm.reconnecting'), color: theme.colors.error },
    }

    const config = statusConfig[connectionStatus] || statusConfig.connecting

    return (
      <View style={styles.statusContainer}>
        <Chip 
          icon="wifi" 
          textStyle={{ color: config.color }}
          style={{ backgroundColor: theme.colors.background }}
        >
          {config.text}
        </Chip>
      </View>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            onPress={() => navigation.goBack()}
          />
          <View style={styles.headerInfo}>
            <Text variant="titleMedium">{chatUser?.name || t('common.loading')}</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text>{t('chat.loadingChat')}</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!hasMatch) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            onPress={() => navigation.goBack()}
          />
          <View style={styles.headerInfo}>
            <Text variant="titleMedium">{chatUser?.name}</Text>
          </View>
        </View>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons
            name="heart-broken"
            size={64}
            color={theme.colors.outline}
          />
          <Text variant="titleMedium" style={styles.errorTitle}>
            {t('chat.dm.unavailable_no_match')}
          </Text>
          <Text variant="bodyMedium" style={styles.errorText}>
            {t('matches.noMatches')}
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  if (error && !messages.length) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            onPress={() => navigation.goBack()}
          />
          <View style={styles.headerInfo}>
            <Text variant="titleMedium">{chatUser?.name}</Text>
          </View>
        </View>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons
            name="alert-circle"
            size={64}
            color={theme.colors.error}
          />
          <Text variant="titleMedium" style={styles.errorTitle}>
            {t('common.error')}
          </Text>
          <Text variant="bodyMedium" style={styles.errorText}>
            {error}
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            onPress={() => navigation.goBack()}
          />
          <Avatar.Image
            size={40}
            source={{ uri: chatUser?.profile_photo }}
            style={styles.avatar}
          />
          <View style={styles.headerInfo}>
            <Text variant="titleMedium">{chatUser?.name}</Text>
            {otherUserTyping && (
              <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
                {t('chat.dm.typing')}
              </Text>
            )}
          </View>
        </View>

        {renderConnectionStatus()}

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={scrollToBottom}
        />

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={newMessage}
            onChangeText={handleTextChange}
            placeholder={hasMatch ? t('chat.dm.placeholder') : t('chat.dm.unavailable_no_match')}
            multiline
            maxLength={4096}
            editable={hasMatch && connectionStatus === 'connected'}
          />
          <IconButton
            icon="send"
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending || !hasMatch || connectionStatus !== 'connected'}
            loading={sending}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatar: {
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  statusContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  errorTitle: {
    textAlign: 'center',
  },
  errorText: {
    textAlign: 'center',
    opacity: 0.7,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 8,
  },
  messageContainer: {
    marginVertical: 4,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    borderRadius: 16,
    padding: 12,
    maxWidth: '80%',
    elevation: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  messageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    opacity: 0.7,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    marginRight: 8,
    maxHeight: 100,
  },
})