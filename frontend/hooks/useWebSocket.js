/**
 * WebSocket hook with performance optimizations and error recovery
 */
import { useEffect, useRef, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { messageService } from '@/lib/api/messages'
import {
  setConnected,
  addMessage,
  markMessagesAsRead,
  setUserTyping,
  updateUserOnlineStatus,
} from '@/lib/redux/features/chatSlice'

const RECONNECT_INTERVALS = [1000, 2000, 5000, 10000, 30000] // Progressive backoff
const MAX_RECONNECT_ATTEMPTS = 5
const HEARTBEAT_INTERVAL = 30000 // 30 seconds

export function useWebSocket() {
  const dispatch = useDispatch()
  const socketRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const heartbeatIntervalRef = useRef(null)
  const reconnectAttemptRef = useRef(0)
  const isConnectingRef = useRef(false)
  
  // Debounced typing emission
  const typingTimeoutRef = useRef(null)
  const lastTypingEmitRef = useRef(0)
  const TYPING_DEBOUNCE_DELAY = 1000 // 1 second
  
  const connect = useCallback(async () => {
    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current || (socketRef.current && socketRef.current.connected)) {
      return
    }
    
    try {
      isConnectingRef.current = true
      
      const token = localStorage.getItem('jwt_token')
      if (!token) {
        console.warn('No JWT token available for WebSocket connection')
        return
      }
      
      // Connect to WebSocket
      const socket = messageService.connectWebSocket(token)
      if (!socket) {
        throw new Error('Failed to create WebSocket connection')
      }
      
      socketRef.current = socket
      
      // Connection event handlers
      socket.on('connect', () => {
        console.log('WebSocket connected successfully')
        dispatch(setConnected(true))
        reconnectAttemptRef.current = 0
        isConnectingRef.current = false
        
        // Start heartbeat
        startHeartbeat()
      })
      
      socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason)
        dispatch(setConnected(false))
        isConnectingRef.current = false
        
        // Stop heartbeat
        stopHeartbeat()
        
        // Auto-reconnect if not manually disconnected
        if (reason !== 'io client disconnect') {
          scheduleReconnect()
        }
      })
      
      socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error)
        dispatch(setConnected(false))
        isConnectingRef.current = false
        
        scheduleReconnect()
      })
      
      // Message event handlers with performance optimizations
      socket.on('new_message', (data) => {
        if (data?.message) {
          // Validate message data before dispatching
          if (validateMessageData(data.message)) {
            dispatch(addMessage(data.message))
          }
        }
      })
      
      socket.on('messages_read', (data) => {
        if (data?.chat_id && data?.reader_id) {
          dispatch(markMessagesAsRead({
            chatId: data.chat_id,
            userId: data.reader_id
          }))
        }
      })
      
      socket.on('user_typing', (data) => {
        if (data?.chat_id && data?.user_id) {
          dispatch(setUserTyping({
            chatId: data.chat_id,
            userId: data.user_id,
            isTyping: true
          }))
          
          // Auto-clear typing after 3 seconds
          setTimeout(() => {
            dispatch(setUserTyping({
              chatId: data.chat_id,
              userId: data.user_id,
              isTyping: false
            }))
          }, 3000)
        }
      })
      
      socket.on('user_online', (data) => {
        if (data?.user_id) {
          dispatch(updateUserOnlineStatus({
            userId: data.user_id,
            isOnline: true
          }))
        }
      })
      
      socket.on('user_offline', (data) => {
        if (data?.user_id) {
          dispatch(updateUserOnlineStatus({
            userId: data.user_id,
            isOnline: false
          }))
        }
      })
      
      // Reconnection success handler
      socket.on('reconnect', () => {
        console.log('WebSocket reconnected successfully')
        reconnectAttemptRef.current = 0
      })
      
    } catch (error) {
      console.error('WebSocket connection failed:', error)
      isConnectingRef.current = false
      scheduleReconnect()
    }
  }, [dispatch])
  
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    stopHeartbeat()
    
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
    
    dispatch(setConnected(false))
    isConnectingRef.current = false
  }, [dispatch])
  
  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached')
      return
    }
    
    const delay = RECONNECT_INTERVALS[Math.min(reconnectAttemptRef.current, RECONNECT_INTERVALS.length - 1)]
    
    console.log(`Scheduling reconnection attempt ${reconnectAttemptRef.current + 1} in ${delay}ms`)
    
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttemptRef.current++
      connect()
    }, delay)
  }, [connect])
  
  const startHeartbeat = useCallback(() => {
    heartbeatIntervalRef.current = setInterval(() => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('ping', Date.now())
      }
    }, HEARTBEAT_INTERVAL)
  }, [])
  
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }
  }, [])
  
  // Optimized typing emission with debouncing
  const emitTyping = useCallback((chatId, otherUserId) => {
    if (!socketRef.current?.connected) return
    
    const now = Date.now()
    
    // Debounce typing events
    if (now - lastTypingEmitRef.current < TYPING_DEBOUNCE_DELAY) {
      // Clear existing timeout and set new one
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        messageService.emitTyping(chatId, otherUserId)
        lastTypingEmitRef.current = Date.now()
      }, TYPING_DEBOUNCE_DELAY - (now - lastTypingEmitRef.current))
    } else {
      // Emit immediately
      messageService.emitTyping(chatId, otherUserId)
      lastTypingEmitRef.current = now
    }
  }, [])
  
  const markAsRead = useCallback((chatId) => {
    if (socketRef.current?.connected) {
      messageService.markAsRead(chatId)
    }
  }, [])
  
  // Validate message data to prevent XSS
  const validateMessageData = useCallback((message) => {
    if (!message || typeof message !== 'object') return false
    if (!message.id || !message.sender_id || !message.text) return false
    if (typeof message.text !== 'string') return false
    
    // Basic XSS protection - strip HTML tags
    // TODO: PRODUCTION - Use DOMPurify for comprehensive sanitization
    if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(message.text)) {
      console.warn('Potentially malicious message detected and blocked')
      return false
    }
    
    return true
  }, [])
  
  // Initialize connection on mount
  useEffect(() => {
    connect()
    
    // Cleanup on unmount
    return () => {
      disconnect()
    }
  }, [connect, disconnect])
  
  // Reconnect when auth token changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'jwt_token') {
        if (e.newValue && !socketRef.current?.connected) {
          connect()
        } else if (!e.newValue) {
          disconnect()
        }
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [connect, disconnect])
  
  // Handle page visibility changes (performance optimization)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden - reduce activity
        stopHeartbeat()
      } else {
        // Page is visible again - resume activity
        if (socketRef.current?.connected) {
          startHeartbeat()
        } else {
          connect()
        }
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [connect, startHeartbeat, stopHeartbeat])
  
  return {
    isConnected: socketRef.current?.connected || false,
    socket: socketRef.current,
    emitTyping,
    markAsRead,
    connect,
    disconnect
  }
}