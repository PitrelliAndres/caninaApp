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
} from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import Toast from 'react-native-toast-message'
import { formatDistanceToNow } from 'date-fns'
import es from 'date-fns/locale/es'
import enUS from 'date-fns/locale/en-US'

import { messageService } from '../../services/api/messages'
import { useAuth } from '../../hooks/useAuth'

export function ChatScreen({ navigation, route }) {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  const dynamicStyles = styles(theme)
  const { user } = useAuth()
  const { chatId, user: chatUser } = route.params
  
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [otherUserTyping, setOtherUserTyping] = useState(false)
  const [isOnline, setIsOnline] = useState(chatUser?.is_online || false)
  
  const flatListRef = useRef(null)
  const socketRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const dateLocale = i18n.language === 'es' ? es : enUS

  useEffect(() => {
    setupChat()
    
    return () => {
      if (socketRef.current) {
        messageService.removeAllListeners()
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [chatId])

  const setupChat = async () => {
    try {
      setLoading(true)
      
      // Cargar mensajes
      await loadMessages()
      
      // Conectar WebSocket
      await connectWebSocket()
      
      // Marcar como leído
      messageService.markAsRead(chatId)
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t('errors.generic'),
        text2: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async () => {
    try {
      const response = await messageService.getChatMessages(chatId)
      setMessages(response.messages || [])
      
      // Scroll to bottom después de cargar
      setTimeout(() => {
        scrollToBottom()
      }, 100)
    } catch (error) {
      throw new Error(t('chat.errorLoadingMessages'))
    }
  }

  const connectWebSocket = async () => {
    try {
      socketRef.current = await messageService.connectWebSocket()
      
      if (!socketRef.current) {
        console.warn('Could not establish WebSocket connection')
        return
      }

      // Escuchar nuevos mensajes
      messageService.onNewMessage((data) => {
        if (data.chat_id === parseInt(chatId)) {
          setMessages(prev => [...prev, data.message])
          messageService.markAsRead(chatId)
          scrollToBottom()
        }
      })

      // Escuchar indicador de escritura
      messageService.onUserTyping((data) => {
        if (data.chat_id === parseInt(chatId) && data.user_id !== user?.id) {
          setOtherUserTyping(true)
          
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
          }
          
          typingTimeoutRef.current = setTimeout(() => {
            setOtherUserTyping(false)
          }, 3000)
        }
      })

      // Escuchar confirmación de lectura
      messageService.onMessagesRead((data) => {
        if (data.chat_id === parseInt(chatId)) {
          setMessages(prev => 
            prev.map(msg => ({
              ...msg,
              is_read: msg.sender_id === user?.id ? true : msg.is_read
            }))
          )
        }
      })

      // Escuchar estado online/offline
      messageService.onUserOnline((data) => {
        if (data.user_id === chatUser?.id) {
          setIsOnline(true)
        }
      })

      messageService.onUserOffline((data) => {
        if (data.user_id === chatUser?.id) {
          setIsOnline(false)
        }
      })

    } catch (error) {
      console.error('WebSocket setup error:', error)
    }
  }

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true })
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return
    
    const messageText = newMessage.trim()
    setNewMessage('')
    
    try {
      setSending(true)
      
      const response = await messageService.sendMessage(chatId, messageText)
      setMessages(prev => [...prev, response.message])
      
      setTimeout(() => {
        scrollToBottom()
      }, 100)
      
    } catch (error) {
      setNewMessage(messageText) // Restaurar mensaje en caso de error
      Toast.show({
        type: 'error',
        text1: t('chat.errorSending'),
        text2: error.message,
      })
    } finally {
      setSending(false)
    }
  }

  const handleTyping = () => {
    if (chatUser) {
      messageService.emitTyping(chatId, chatUser.id)
    }
  }

  const renderMessage = ({ item, index }) => {
    const isOwnMessage = item.sender_id === user?.id
    const showTime = index === 0 || 
      (messages[index - 1] && 
       new Date(item.created_at).getTime() - new Date(messages[index - 1].created_at).getTime() > 300000) // 5 minutes

    return (
      <View style={styles.messageContainer}>
        {showTime && (
          <Text style={styles.timeLabel}>
            {formatDistanceToNow(new Date(item.created_at), { 
              addSuffix: true, 
              locale: dateLocale 
            })}
          </Text>
        )}
        
        <View style={[
          styles.messageBubbleContainer,
          isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
        ]}>
          <Surface
            style={[
              styles.messageBubble,
              isOwnMessage ? styles.ownMessage : styles.otherMessage
            ]}
            elevation={1}
          >
            <Text style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText
            ]}>
              {item.text}
            </Text>
            
            <View style={styles.messageFooter}>
              <Text style={[
                styles.messageTime,
                isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
              ]}>
                {item.time}
              </Text>
              {isOwnMessage && (
                <MaterialCommunityIcons
                  name={item.is_read ? "check-all" : "check"}
                  size={16}
                  color={item.is_read ? theme.colors.primary : theme.colors.outline}
                />
              )}
            </View>
          </Surface>
        </View>
      </View>
    )
  }

  const renderTypingIndicator = () => {
    if (!otherUserTyping) return null
    
    return (
      <View style={styles.typingContainer}>
        <View style={styles.typingBubble}>
          <View style={styles.typingDots}>
            {[0, 1, 2].map(i => (
              <View
                key={i}
                style={[
                  styles.typingDot,
                  { animationDelay: `${i * 0.2}s` }
                ]}
              />
            ))}
          </View>
        </View>
        <Text style={styles.typingText}>
          {chatUser?.nickname} {t('chat.typing')}
        </Text>
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
            <Text variant="titleMedium">{chatUser?.nickname}</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text>{t('chat.loadingChat')}</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          onPress={() => navigation.goBack()}
        />
        <Avatar.Image
          size={40}
          source={{ uri: chatUser?.avatar || 'https://via.placeholder.com/40' }}
        />
        <View style={styles.headerInfo}>
          <Text variant="titleMedium">{chatUser?.nickname}</Text>
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusDot,
              { backgroundColor: isOnline ? theme.colors.primary : theme.colors.onSurfaceVariant }
            ]} />
            <Text variant="bodySmall" style={styles.statusText}>
              {isOnline ? t('chat.online') : t('chat.offline')}
            </Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id.toString()}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollToBottom()}
          showsVerticalScrollIndicator={false}
        />

        {renderTypingIndicator()}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder={t('chat.typeMessage')}
            style={styles.textInput}
            multiline
            maxLength={1000}
            onKeyPress={handleTyping}
            disabled={sending}
          />
          <IconButton
            icon="send"
            mode="contained"
            onPress={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            loading={sending}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: theme.colors.onSurfaceVariant,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
  },
  timeLabel: {
    textAlign: 'center',
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 8,
  },
  messageBubbleContainer: {
    maxWidth: '80%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  ownMessage: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  ownMessageText: {
    color: theme.colors.background,
  },
  otherMessageText: {
    color: theme.colors.onSurface,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 12,
    marginRight: 4,
  },
  ownMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  otherMessageTime: {
    color: theme.colors.onSurfaceVariant,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  typingBubble: {
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  typingDots: {
    flexDirection: 'row',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.onSurfaceVariant,
    marginHorizontal: 2,
  },
  typingText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  textInput: {
    flex: 1,
    marginRight: 8,
    maxHeight: 100,
  },
})