"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useTranslation } from 'react-i18next'
import { messageService } from "@/lib/api/messages"
import { useAuth } from "@/hooks/use-auth"
import FrontendLogger from "@/lib/utils/logger"
import { cn } from "@/lib/utils"
import { 
  Send, 
  ArrowLeft, 
  AlertCircle, 
  HeartHandshake,
  Wifi,
  WifiOff
} from "lucide-react"

export function DMChat({ conversationId, user: chatUser, onBack }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [otherUserTyping, setOtherUserTyping] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const [hasMatch, setHasMatch] = useState(true)
  const [error, setError] = useState(null)
  
  const scrollAreaRef = useRef(null)
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)

  useEffect(() => {
    setupDMChat()
    
    return () => {
      cleanup()
    }
  }, [conversationId])

  const cleanup = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    messageService.removeAllListeners()
    messageService.sendTypingDM(conversationId, false)
  }

  const setupDMChat = async () => {
    try {
      setLoading(true)
      setConnectionStatus('connecting')
      setError(null)
      
      // Check for realtime token first
      let realtimeToken = localStorage.getItem('realtime_token')
      // Verificación de token de tiempo real
      
      if (!realtimeToken) {
        // No hay token de tiempo real, intentando obtener uno nuevo
        // Try to get a fresh WebSocket token
        try {
          const wsTokenResponse = await fetch('/api/auth/ws-token', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
            }
          })
          
          if (wsTokenResponse.ok) {
            const wsTokenData = await wsTokenResponse.json()
            realtimeToken = wsTokenData.realtime_token
            localStorage.setItem('realtime_token', realtimeToken)
            // Token WebSocket obtenido exitosamente
          } else {
            // Error al obtener token WebSocket
            // Fallback: try to refresh all tokens
            const refreshResponse = await fetch('/api/auth/refresh', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh_token: localStorage.getItem('refresh_token') })
            })
            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json()
              realtimeToken = refreshData.tokens?.realtime_token
              if (realtimeToken) localStorage.setItem('realtime_token', realtimeToken)
              // Resultado del fallback de refresco de token
            }
          }
        } catch (tokenError) {
          console.error('Token acquisition failed:', tokenError)
        }
      }
      
      // Connect WebSocket with realtime token
      const socket = messageService.connectWebSocket()
      
      if (!socket) {
        throw new Error('Could not establish WebSocket connection - no realtime token')
      }

      // Set up DM event listeners
      setupDMEventListeners()
      
      // Wait for socket to connect before joining (reduced timeout)
      await new Promise((resolve, reject) => {
        if (socket.connected) {
          resolve()
          return
        }
        
        // Reduced timeout to avoid conflict with Socket.IO timeout
        const timeout = setTimeout(() => {
          // Don't reject if socket is connecting, just resolve
          if (socket.connecting || socket.connected) {
            resolve()
          } else {
            reject(new Error('WebSocket connection timeout'))
          }
        }, 10000)
        
        socket.once('connect', () => {
          clearTimeout(timeout)
          resolve()
        })
        
        socket.once('connect_error', (error) => {
          clearTimeout(timeout)
          reject(error)
        })
      })
      
      // Join the conversation
      const response = await messageService.joinConversation(conversationId)
      
      if (response && response.messages) {
        setMessages(response.messages)
        setConnectionStatus('connected')
        scrollToBottom()
        
        // Mark latest message as read
        if (response.messages.length > 0) {
          const latestMessage = response.messages[response.messages.length - 1]
          messageService.markAsReadDM(conversationId, latestMessage.id)
        }
      }
      
    } catch (error) {
      console.error('DM Chat setup error:', error)
      handleDMError(error)
    } finally {
      setLoading(false)
    }
  }

  const setupDMEventListeners = () => {
    // Listen for new messages
    messageService.onNewDMMessage((data) => {
      if (data.conversationId === conversationId) {
        const newMsg = data.message
        
        // Prevent duplicates: only add if not exists in local outbox
        setMessages(prev => {
          const exists = prev.some(msg => 
            msg.id === newMsg.id || 
            (msg.temp_id && msg.sender_id === newMsg.sender_id && msg.text === newMsg.text)
          )
          
          if (exists) {
            // Replace temporary message with server response
            return prev.map(msg => 
              (msg.temp_id && msg.sender_id === newMsg.sender_id && msg.text === newMsg.text)
                ? { ...newMsg, status: 'delivered' }
                : msg
            )
          } else {
            // New message from other user
            return [...prev, newMsg]
          }
        })
        
        // Auto-mark as read
        messageService.markAsReadDM(conversationId, newMsg.id)
        scrollToBottom()
      }
    })

    // Listen for typing indicators
    messageService.onDMTyping((data) => {
      if (data.conversationId === conversationId && data.userId !== user?.id) {
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
      if (data.conversationId === conversationId) {
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

    // Listen for errors
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
    const errorId = FrontendLogger.logError(error, {
      conversationId,
      userId: user?.id,
      hasMatch,
      connectionStatus,
      errorCode: error.code
    }, 'DMChat')
    
    if (error.code === 'NO_MATCH') {
      setHasMatch(false)
      setError(t('chat.dm.noMutualMatch'))
    } else if (error.code === 'BLOCKED') {
      setError(t('chat.dm.userBlocked'))
    } else if (error.code === 'UNAUTHORIZED') {
      setError(t('chat.dm.unauthorized'))
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || sending || !hasMatch) return
    
    const messageText = newMessage.trim()
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Stop typing indicator
    messageService.sendTypingDM(conversationId, false)
    
    // Add message immediately to UI as pending
    const pendingMessage = {
      id: tempId,
      text: messageText,
      sender_id: user?.id,
      created_at: new Date().toISOString(),
      conversation_id: conversationId,
      status: 'pending',
      temp_id: tempId
    }
    
    setMessages(prev => [...prev, pendingMessage])
    setNewMessage('')
    setSending(true)
    scrollToBottom()
    
    try {
      // Send with client message ID for idempotency
      const response = await messageService.sendDMMessage(conversationId, messageText, tempId)
      
      // Update local message with server response on ACK
      setMessages(prev => 
        prev.map(msg => 
          msg.temp_id === tempId 
            ? { ...msg, id: response.serverId, status: 'sent', created_at: response.timestamp }
            : msg
        )
      )
      
    } catch (error) {
      console.error('Send message error:', error)
      
      // Mark message as failed in local outbox
      setMessages(prev => 
        prev.map(msg => 
          msg.temp_id === tempId 
            ? { ...msg, status: 'failed' }
            : msg
        )
      )
      
      setNewMessage(messageText) // Restore for retry
      handleDMError(error)
    } finally {
      setSending(false)
    }
  }

  const handleInputChange = (e) => {
    const text = e.target.value
    setNewMessage(text)
    
    // Send typing indicator
    if (text.length > 0 && hasMatch) {
      messageService.sendTypingDM(conversationId, true)
    } else {
      messageService.sendTypingDM(conversationId, false)
    }
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const ConnectionStatus = () => {
    if (connectionStatus === 'connected') return null

    const statusConfig = {
      connecting: { text: t('chat.dm.connecting'), icon: Wifi, variant: 'default' },
      reconnecting: { text: t('chat.dm.reconnecting'), icon: WifiOff, variant: 'destructive' },
    }

    const config = statusConfig[connectionStatus] || statusConfig.connecting
    const Icon = config.icon

    return (
      <div className="flex justify-center p-2">
        <Badge variant={config.variant} className="gap-2">
          <Icon className="h-3 w-3" />
          {config.text}
        </Badge>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 p-4 border-b">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar className="h-8 w-8">
            <AvatarImage src={chatUser?.profile_photo} />
            <AvatarFallback>{chatUser?.name?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{chatUser?.name || t('common.loading')}</h3>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{t('chat.loadingChat')}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!hasMatch) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 p-4 border-b">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar className="h-8 w-8">
            <AvatarImage src={chatUser?.profile_photo} />
            <AvatarFallback>{chatUser?.name?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{chatUser?.name}</h3>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <HeartHandshake className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              {t('chat.dm.unavailable_no_match')}
            </h3>
            <p className="text-muted-foreground">
              {t('matches.noMatches')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error && !messages.length) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 p-4 border-b">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar className="h-8 w-8">
            <AvatarImage src={chatUser?.profile_photo} />
            <AvatarFallback>{chatUser?.name?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{chatUser?.name}</h3>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <Alert className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Avatar className="h-8 w-8">
          <AvatarImage src={chatUser?.profile_photo} />
          <AvatarFallback>{chatUser?.name?.[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-semibold">{chatUser?.name}</h3>
          {otherUserTyping && (
            <p className="text-xs text-primary">{t('chat.dm.typing')}</p>
          )}
        </div>
      </div>

      <ConnectionStatus />

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => {
            const isOwnMessage = message.sender_id === user?.id
            return (
              <div
                key={message.id}
                className={cn(
                  "flex max-w-xs lg:max-w-md",
                  isOwnMessage ? "ml-auto" : "mr-auto"
                )}
              >
                <div
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm",
                    isOwnMessage
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <p>{message.text}</p>
                  <div className={cn(
                    "flex items-center gap-1 mt-1 text-xs",
                    isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}>
                    <span>{formatTime(message.created_at)}</span>
                    {isOwnMessage && (
                      <span className="ml-1">
                        {message.is_read ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4">
        <form onSubmit={sendMessage} className="flex gap-2">
          <Input
            placeholder={hasMatch ? t('chat.dm.placeholder') : t('chat.dm.unavailable_no_match')}
            value={newMessage}
            onChange={handleInputChange}
            disabled={!hasMatch || connectionStatus !== 'connected'}
            maxLength={4096}
            className="flex-1"
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={!newMessage.trim() || sending || !hasMatch || connectionStatus !== 'connected'}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}