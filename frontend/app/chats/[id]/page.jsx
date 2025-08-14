"use client"

import { useState, useEffect, useCallback } from "react"
import { Header } from "@/components/layout/header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { messageService } from "@/lib/api/messages"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { 
  setCurrentChat, 
  setMessages, 
  addMessage,
  selectCurrentChat,
  selectMessages,
  selectUserTyping,
  selectChatConnected
} from "@/lib/redux/features/chatSlice"

// Import optimized components
import { MessageList } from "@/components/chat/MessageList"
import { MessageInput } from "@/components/chat/MessageInput"
import { useWebSocket } from "@/hooks/useWebSocket"

export default function ChatPage() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const params = useParams()
  const chatId = parseInt(params.id)
  const { user } = useAuth()
  const { toast } = useToast()
  
  // Redux state
  const currentChat = useSelector(selectCurrentChat)
  const messages = useSelector(selectMessages)
  const isTyping = useSelector(state => state.chat.typing[chatId])
  const isConnected = useSelector(selectChatConnected)
  
  // Local state
  const [chatInfo, setChatInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const [lastCursor, setLastCursor] = useState(null)
  
  // WebSocket connection with optimized hook
  const { emitTyping, markAsRead } = useWebSocket()

  // Load initial chat data
  const loadChat = useCallback(async () => {
    try {
      setLoading(true)
      
      try {
        // Try to load from API first
        const [conversationsRes, messagesRes] = await Promise.all([
          messageService.getConversations(),
          messageService.getChatMessages(chatId, { limit: 50 })
        ])
        
        // Find chat info
        const chat = conversationsRes.conversations?.find(c => c.chat_id === chatId)
        if (chat) {
          setChatInfo(chat)
          dispatch(setCurrentChat(chat))
        }
        
        // Set messages in Redux
        const messagesList = messagesRes.messages || []
        dispatch(setMessages(messagesList))
        
        // Set pagination info
        setHasMoreMessages(messagesRes.pagination?.has_more || false)
        setLastCursor(messagesRes.pagination?.next_cursor)
        
        // Mark as read
        if (messagesList.length > 0) {
          markAsRead(chatId)
        }
      } catch (apiError) {
        console.error('API error, using dummy data:', apiError)
        
        // Use dummy data as fallback
        const { getDummyChatById } = await import("@/lib/dummy-messages")
        const dummyChat = getDummyChatById(chatId)
        
        if (dummyChat) {
          setChatInfo(dummyChat)
          dispatch(setCurrentChat(dummyChat))
          dispatch(setMessages(dummyChat.messages || []))
          setHasMoreMessages(false)
        }
      }
      
    } catch (error) {
      console.error('Load chat error:', error)
      toast({
        title: t('chat.errorLoadingChat', 'Error loading chat'),
        description: error.message || t('errors.generic', 'An error occurred'),
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [chatId, dispatch, markAsRead, toast, t])

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (loadingMore || !hasMoreMessages || !lastCursor) return
    
    try {
      setLoadingMore(true)
      
      const response = await messageService.getChatMessages(chatId, { 
        before: lastCursor,
        limit: 50 
      })
      
      const newMessages = response.messages || []
      
      if (newMessages.length > 0) {
        // Prepend messages to existing ones
        dispatch(setMessages([...newMessages, ...messages]))
        setLastCursor(response.pagination?.next_cursor)
        setHasMoreMessages(response.pagination?.has_more || false)
      } else {
        setHasMoreMessages(false)
      }
      
    } catch (error) {
      console.error('Load more messages error:', error)
      toast({
        title: t('chat.errorLoadingMessages'),
        description: error.message || t('errors.generic'),
        variant: "destructive"
      })
    } finally {
      setLoadingMore(false)
    }
  }, [chatId, loadingMore, hasMoreMessages, lastCursor, messages, dispatch, toast, t])

  // Send message handler
  const handleSendMessage = useCallback(async (messageText) => {
    if (!messageText.trim()) return
    
    try {
      const response = await messageService.sendMessage(chatId, messageText)
      
      // Message will be added via WebSocket, but add optimistically for better UX
      dispatch(addMessage(response.message))
      
      // Show warnings if any (development mode)
      if (response.warnings && response.warnings.length > 0) {
        response.warnings.forEach(warning => {
          console.warn('Message warning:', warning)
        })
      }
      
    } catch (error) {
      console.error('Send message error:', error)
      
      // Let MessageInput component handle the error display
      throw error
    }
  }, [chatId, dispatch])

  // Typing handler with debouncing
  const handleTyping = useCallback(() => {
    if (chatInfo?.user?.id) {
      emitTyping(chatId, chatInfo.user.id)
    }
  }, [chatId, chatInfo?.user?.id, emitTyping])

  // Load chat on mount or when chatId changes
  useEffect(() => {
    loadChat()
  }, [loadChat])

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
            <span className="text-lg text-muted-foreground">{t('chat.loadingChat', 'Cargando chat...')}</span>
          </div>
        </div>
      </div>
    )
  }

  // Chat not found state
  if (!chatInfo) {
    return (
      <div className="flex flex-col h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-muted-foreground mb-2">
              {t('chat.chatNotFound', 'Chat no encontrado')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('chat.chatNotFoundDescription', 'Esta conversación no existe o no tienes acceso a ella.')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      <Header />
      
      {/* Connection status indicator */}
      {!isConnected && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2">
          <div className="flex items-center gap-2 text-sm text-yellow-700">
            <div className="animate-pulse h-2 w-2 bg-yellow-500 rounded-full" />
            <span>Reconectando...</span>
          </div>
        </div>
      )}
      
      <div className="flex-1 flex flex-col min-h-0">
        {/* Chat header with optimized online status */}
        <div className="border-b px-4 py-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage 
                src={chatInfo.user.avatar || "/placeholder.svg"} 
                alt={chatInfo.user.nickname}
              />
              <AvatarFallback>
                {chatInfo.user.nickname?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold truncate">
                {chatInfo.user.nickname}
              </h1>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className={cn(
                  "h-2 w-2 rounded-full transition-colors duration-200", 
                  chatInfo.user.is_online ? "bg-green-500" : "bg-gray-400"
                )} />
                <span>
                  {chatInfo.user.is_online 
                    ? t('chat.online', 'En línea')
                    : t('chat.offline', 'Desconectado')
                  }
                </span>
              </div>
            </div>
            
            {/* Connection indicator */}
            <div className={cn(
              "h-2 w-2 rounded-full transition-colors duration-200",
              isConnected ? "bg-green-500" : "bg-red-500"
            )} />
          </div>
        </div>

        {/* Optimized message list with virtualization */}
        <MessageList
          messages={messages}
          currentUser={user}
          otherUser={chatInfo.user}
          isTyping={isTyping}
          onScrollToTop={loadMoreMessages}
          loading={loadingMore}
        />

        {/* Optimized message input */}
        <MessageInput
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          disabled={!isConnected}
          placeholder={t('chat.typeMessage', 'Escribe un mensaje...')}
        />
      </div>
    </div>
  )
}
