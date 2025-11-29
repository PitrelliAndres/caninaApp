/**
 * DM Chat Screen - Refactored for SQLite offline-first architecture
 * Now uses MessageSyncEngine and Redux async thunks
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  Text,
  TextInput,
  IconButton,
  Avatar,
  Surface,
  useTheme,
  ActivityIndicator,
  Chip,
  Button,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { formatDistanceToNow } from 'date-fns';
import es from 'date-fns/locale/es';
import enUS from 'date-fns/locale/en-US';

import { useDispatch, useSelector } from 'react-redux';
import {
  loadMessages,
  sendMessage,
  markConversationAsRead,
  retryFailedMessage,
  setCurrentConversation,
  clearCurrentConversation,
  setUserTyping,
  selectMessages,
  selectChatLoading,
  selectChatConnected,
  selectChatSyncing,
  selectUserTyping,
  selectCurrentConversation,
} from '../../store/slices/chatSlice';
import messageSyncEngine from '../../services/MessageSyncEngine';
import { messageService } from '../../services/api/messages';
import MobileLogger from '../../utils/logger';

export function DMChatScreen({ navigation, route }) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.user);
  const messages = useSelector(selectMessages);
  const loading = useSelector(selectChatLoading);
  const connected = useSelector(selectChatConnected);
  const syncing = useSelector(selectChatSyncing);
  const currentConversation = useSelector(selectCurrentConversation);

  const { conversationId, chatId, user: chatUser } = route.params;
  const actualConversationId = conversationId || chatId;

  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [hasMatch, setHasMatch] = useState(true);
  const [error, setError] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const dateLocale = i18n.language === 'es' ? es : enUS;

  // Check if other user is typing
  const otherUserTyping = useSelector((state) =>
    selectUserTyping(state, actualConversationId)
  );

  // ============================================
  // INITIALIZATION
  // ============================================

  useEffect(() => {
    if (!user?.id || !actualConversationId) {
      MobileLogger.logError(new Error('Missing user or conversation ID'), {
        userId: user?.id,
        conversationId: actualConversationId,
      }, 'DMChatScreen');
      navigation.goBack();
      return;
    }

    initializeChat();

    return () => {
      cleanup();
    };
  }, [actualConversationId]);

  const initializeChat = async () => {
    try {
      // Set current conversation in Redux
      dispatch(setCurrentConversation({
        id: actualConversationId,
        user1_id: user.id,
        user2_id: chatUser?.id,
        other_user_name: chatUser?.name,
        other_user_avatar: chatUser?.profile_photo,
        other_user_online: chatUser?.is_online || false,
      }));

      // Load messages from SQLite
      await dispatch(loadMessages({
        conversationId: actualConversationId,
        limit: 50,
      })).unwrap();

      // Connect WebSocket first
      await messageService.connectWebSocket();
      MobileLogger.logInfo('WebSocket connected for chat', {
        conversationId: actualConversationId,
      }, 'DMChatScreen');

      // Mark as read
      if (messages.length > 0) {
        const messageIds = messages
          .filter(m => m.sender_id !== user.id)
          .map(m => m.id);

        if (messageIds.length > 0) {
          dispatch(markConversationAsRead({
            conversationId: actualConversationId,
            messageIds,
          }));
        }
      }

      // Setup WebSocket listeners
      setupWebSocketListeners();

      // Scroll to bottom
      scrollToBottom();

    } catch (error) {
      MobileLogger.logError(error, {
        conversationId: actualConversationId,
      }, 'DMChatScreen');
      handleError(error);
    }
  };

  const cleanup = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing indicator
    messageService.sendTypingDM(actualConversationId, false);

    // Disconnect WebSocket
    messageService.disconnectWebSocket();

    // Clear current conversation
    dispatch(clearCurrentConversation());
  };

  // ============================================
  // WEBSOCKET INTEGRATION
  // ============================================

  const setupWebSocketListeners = () => {
    // Listen for new messages
    messageService.onNewDMMessage((data) => {
      if (data.conversationId === actualConversationId) {
        // MessageSyncEngine already saved to SQLite
        // Just reload messages from DB
        dispatch(loadMessages({
          conversationId: actualConversationId,
          limit: 50,
        }));

        // Mark as read
        messageService.markAsReadDM(actualConversationId, data.message.id);

        scrollToBottom();
      }
    });

    // Listen for typing indicators
    messageService.onDMTyping((data) => {
      if (data.conversationId === actualConversationId && data.userId !== user?.id) {
        dispatch(setUserTyping({
          conversationId: actualConversationId,
          userId: data.userId,
          isTyping: data.isTyping,
        }));

        if (data.isTyping) {
          // Auto-clear typing after 3 seconds
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }

          typingTimeoutRef.current = setTimeout(() => {
            dispatch(setUserTyping({
              conversationId: actualConversationId,
              userId: data.userId,
              isTyping: false,
            }));
          }, 3000);
        }
      }
    });

    // Listen for read receipts
    messageService.onDMReadReceipt((data) => {
      if (data.conversationId === actualConversationId) {
        // Reload messages to show updated read status
        dispatch(loadMessages({
          conversationId: actualConversationId,
          limit: 50,
        }));
      }
    });

    // Listen for DM-specific errors
    messageService.onDMError((error) => {
      handleError(error);
    });
  };

  // ============================================
  // MESSAGE HANDLING
  // ============================================

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending || !hasMatch) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Stop typing indicator
    messageService.sendTypingDM(actualConversationId, false);

    try {
      // Send via MessageSyncEngine (offline-first)
      await dispatch(sendMessage({
        conversationId: actualConversationId,
        content: messageText,
        receiverId: chatUser?.id || currentConversation?.user2_id,
        currentUserId: user.id,
      })).unwrap();

      // Reload messages to show optimistic update
      await dispatch(loadMessages({
        conversationId: actualConversationId,
        limit: 50,
      }));

      scrollToBottom();

    } catch (error) {
      console.error('[DMChatScreen] Send message error:', error);
      // Restore message text for retry
      setNewMessage(messageText);
      handleError(error);
    } finally {
      setSending(false);
    }
  };

  const handleRetryMessage = async (message) => {
    try {
      await dispatch(retryFailedMessage({
        tempId: message.temp_id,
      })).unwrap();

      // Reload messages
      await dispatch(loadMessages({
        conversationId: actualConversationId,
        limit: 50,
      }));

    } catch (error) {
      console.error('[DMChatScreen] Retry message error:', error);
      handleError(error);
    }
  };

  const handleTextChange = (text) => {
    setNewMessage(text);

    // Send typing indicator
    if (text.length > 0 && hasMatch && connected) {
      messageService.sendTypingDM(actualConversationId, true);
    } else {
      messageService.sendTypingDM(actualConversationId, false);
    }
  };

  const handleLoadMore = async () => {
    if (loadingMore || messages.length === 0) return;

    setLoadingMore(true);
    try {
      const oldestMessage = messages[0];

      await dispatch(loadMessages({
        conversationId: actualConversationId,
        limit: 50,
        beforeTimestamp: oldestMessage.created_at,
      })).unwrap();

    } catch (error) {
      console.error('[DMChatScreen] Load more error:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // ============================================
  // ERROR HANDLING
  // ============================================

  const handleError = (error) => {
    MobileLogger.logError(error, {
      conversationId: actualConversationId,
      errorCode: error.code,
    }, 'DMChatScreen');

    if (error.code === 'NO_MATCH') {
      setHasMatch(false);
      setError(t('chat.dm.noMutualMatch'));
    } else if (error.code === 'BLOCKED') {
      setError(t('chat.dm.userBlocked'));
    } else if (error.code === 'UNAUTHORIZED') {
      setError(t('chat.dm.unauthorized'));
      navigation.goBack();
    } else {
      setError(error.message || t('chat.dm.messageFailedToSend'));
    }
  };

  // ============================================
  // UI HELPERS
  // ============================================

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const getConnectionStatus = () => {
    if (!connected) return 'reconnecting';
    if (syncing) return 'syncing';
    return 'connected';
  };

  // ============================================
  // RENDERERS
  // ============================================

  const renderMessage = ({ item: message }) => {
    const isOwnMessage = message.sender_id === user?.id;

    const timeText = formatDistanceToNow(new Date(message.created_at), {
      addSuffix: true,
      locale: dateLocale,
    });

    // Determine message status
    const status = message.status || 'sent';
    const isFailed = status === 'failed';
    const isPending = status === 'pending';

    return (
      <View
        style={[
          styles(theme).messageContainer,
          isOwnMessage ? styles(theme).ownMessage : styles(theme).otherMessage,
        ]}
      >
        <Surface
          style={[
            styles(theme).messageBubble,
            isOwnMessage
              ? { backgroundColor: theme.colors.primary }
              : { backgroundColor: theme.colors.surface },
            isFailed && { backgroundColor: theme.colors.errorContainer },
          ]}
        >
          <Text
            style={[
              styles(theme).messageText,
              isOwnMessage && { color: theme.colors.onPrimary },
              isFailed && { color: theme.colors.error },
            ]}
          >
            {message.content || message.text}
          </Text>

          <View style={styles(theme).messageInfo}>
            <Text
              style={[
                styles(theme).timeText,
                isOwnMessage && { color: theme.colors.onPrimary },
              ]}
            >
              {timeText}
            </Text>

            {isOwnMessage && (
              <MaterialCommunityIcons
                name={
                  isPending
                    ? 'clock-outline'
                    : isFailed
                    ? 'alert-circle-outline'
                    : message.is_read || message.status === 'read'
                    ? 'check-all'
                    : 'check'
                }
                size={14}
                color={
                  isPending
                    ? isOwnMessage
                      ? theme.colors.onPrimary
                      : theme.colors.primary
                    : isFailed
                    ? theme.colors.error
                    : isOwnMessage
                    ? theme.colors.onPrimary
                    : theme.colors.primary
                }
              />
            )}
          </View>

          {/* Retry button for failed messages */}
          {isFailed && isOwnMessage && (
            <Button
              mode="text"
              onPress={() => handleRetryMessage(message)}
              compact
              textColor={theme.colors.error}
            >
              {t('chat.retry')}
            </Button>
          )}
        </Surface>
      </View>
    );
  };

  const renderConnectionStatus = () => {
    const status = getConnectionStatus();

    if (status === 'connected') return null;

    const statusConfig = {
      syncing: {
        text: t('chat.dm.syncing'),
        color: theme.colors.primary,
        icon: 'sync',
      },
      reconnecting: {
        text: t('chat.dm.reconnecting'),
        color: theme.colors.error,
        icon: 'wifi-off',
      },
    };

    const config = statusConfig[status] || statusConfig.reconnecting;

    return (
      <View style={styles(theme).statusContainer}>
        <Chip
          icon={config.icon}
          textStyle={{ color: config.color }}
          style={{ backgroundColor: theme.colors.background }}
        >
          {config.text}
        </Chip>
      </View>
    );
  };

  const renderListHeader = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles(theme).loadMoreContainer}>
        <ActivityIndicator size="small" />
        <Text variant="bodySmall">{t('common.loading')}</Text>
      </View>
    );
  };

  // ============================================
  // LOADING / ERROR STATES
  // ============================================

  if (loading && messages.length === 0) {
    return (
      <SafeAreaView style={styles(theme).container}>
        <View style={styles(theme).header}>
          <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
          <View style={styles(theme).headerInfo}>
            <Text variant="titleMedium">
              {chatUser?.name || t('common.loading')}
            </Text>
          </View>
        </View>
        <View style={styles(theme).loadingContainer}>
          <ActivityIndicator size="large" />
          <Text>{t('chat.loadingChat')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasMatch) {
    return (
      <SafeAreaView style={styles(theme).container}>
        <View style={styles(theme).header}>
          <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
          <View style={styles(theme).headerInfo}>
            <Text variant="titleMedium">{chatUser?.name}</Text>
          </View>
        </View>
        <View style={styles(theme).errorContainer}>
          <MaterialCommunityIcons
            name="heart-broken"
            size={64}
            color={theme.colors.outline}
          />
          <Text variant="titleMedium" style={styles(theme).errorTitle}>
            {t('chat.dm.unavailable_no_match')}
          </Text>
          <Text variant="bodyMedium" style={styles(theme).errorText}>
            {t('matches.noMatches')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && messages.length === 0) {
    return (
      <SafeAreaView style={styles(theme).container}>
        <View style={styles(theme).header}>
          <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
          <View style={styles(theme).headerInfo}>
            <Text variant="titleMedium">{chatUser?.name}</Text>
          </View>
        </View>
        <View style={styles(theme).errorContainer}>
          <MaterialCommunityIcons
            name="alert-circle"
            size={64}
            color={theme.colors.error}
          />
          <Text variant="titleMedium" style={styles(theme).errorTitle}>
            {t('common.error')}
          </Text>
          <Text variant="bodyMedium" style={styles(theme).errorText}>
            {error}
          </Text>
          <Button mode="contained" onPress={() => initializeChat()}>
            {t('common.retry')}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <SafeAreaView style={styles(theme).container}>
      <KeyboardAvoidingView
        style={styles(theme).container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles(theme).header}>
          <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
          <Avatar.Image
            size={40}
            source={{ uri: chatUser?.profile_photo || currentConversation?.other_user_avatar }}
            style={styles(theme).avatar}
          />
          <View style={styles(theme).headerInfo}>
            <Text variant="titleMedium">
              {chatUser?.name || currentConversation?.other_user_name}
            </Text>
            {otherUserTyping && (
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.primary }}
              >
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
          keyExtractor={(item) => item.id || item.temp_id}
          style={styles(theme).messagesList}
          contentContainerStyle={styles(theme).messagesContent}
          onContentSizeChange={scrollToBottom}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={renderListHeader}
        />

        {/* Input */}
        <View style={styles(theme).inputContainer}>
          <TextInput
            style={styles(theme).textInput}
            value={newMessage}
            onChangeText={handleTextChange}
            placeholder={
              hasMatch
                ? t('chat.dm.placeholder')
                : t('chat.dm.unavailable_no_match')
            }
            multiline
            maxLength={4096}
            editable={hasMatch && connected}
          />
          <IconButton
            icon="send"
            onPress={handleSendMessage}
            disabled={!newMessage.trim() || sending || !hasMatch || !connected}
            loading={sending}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
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
    loadMoreContainer: {
      alignItems: 'center',
      paddingVertical: 16,
      gap: 8,
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
      borderTopColor: theme.colors.outline,
    },
    textInput: {
      flex: 1,
      marginRight: 8,
      maxHeight: 100,
    },
  });
