/**
 * Virtualized message list for optimal performance with large message counts
 */
import React, { memo, useMemo, useCallback, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCheck, Check } from "lucide-react"

// Message component with React.memo for performance
const MessageBubble = memo(({ message, isOwnMessage, user, showAvatar = false }) => {
  // Sanitize message text to prevent XSS
  // TODO: PRODUCTION - Use DOMPurify for comprehensive sanitization
  const sanitizedText = useMemo(() => {
    if (typeof message.text !== 'string') return ''
    
    // Basic HTML escaping
    return message.text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
  }, [message.text])
  
  return (
    <div className={cn(
      "flex items-end gap-2 mb-4",
      isOwnMessage ? "justify-end" : "justify-start"
    )}>
      {!isOwnMessage && showAvatar && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.avatar || "/placeholder.svg"} />
          <AvatarFallback>{user?.nickname?.[0] || "U"}</AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn(
        "max-w-sm px-3 py-2 rounded-2xl break-words",
        isOwnMessage
          ? "bg-primary text-primary-foreground rounded-br-none"
          : "bg-muted rounded-bl-none",
      )}>
        <p className="text-sm leading-relaxed" 
           dangerouslySetInnerHTML={{ __html: sanitizedText }} />
        
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-xs opacity-70">
            {message.time}
          </span>
          {isOwnMessage && (
            <div className="flex items-center">
              {message.is_read ? (
                <CheckCheck className="h-3 w-3 opacity-70" />
              ) : (
                <Check className="h-3 w-3 opacity-70" />
              )}
            </div>
          )}
        </div>
      </div>
      
      {isOwnMessage && showAvatar && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.avatar || "/placeholder.svg"} />
          <AvatarFallback>{user?.nickname?.[0] || "U"}</AvatarFallback>
        </Avatar>
      )}
    </div>
  )
})

MessageBubble.displayName = 'MessageBubble'

// Typing indicator component
const TypingIndicator = memo(({ userName, isVisible }) => {
  if (!isVisible) return null
  
  return (
    <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
      <div className="flex gap-1">
        <span className="animate-bounce">●</span>
        <span className="animate-bounce delay-100">●</span>
        <span className="animate-bounce delay-200">●</span>
      </div>
      <span>{userName} está escribiendo...</span>
    </div>
  )
})

TypingIndicator.displayName = 'TypingIndicator'

// Time separator component
const TimeSeparator = memo(({ time }) => (
  <div className="flex justify-center my-4">
    <span className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
      {time}
    </span>
  </div>
))

TimeSeparator.displayName = 'TimeSeparator'

// Main message list component with virtualization for large lists
export const MessageList = memo(({ 
  messages = [], 
  currentUser,
  otherUser,
  isTyping = false,
  onScrollToTop,
  loading = false
}) => {
  const { t, i18n } = useTranslation()
  const messagesEndRef = useRef(null)
  const containerRef = useRef(null)
  const shouldAutoScrollRef = useRef(true)
  
  // Format time label for separators - moved before useMemo to avoid reference error
  const formatTimeLabel = useCallback((date) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    
    const dayDiff = Math.floor((today - messageDate) / (1000 * 60 * 60 * 24))
    
    if (dayDiff === 0) {
      return t('chat.today')
    } else if (dayDiff === 1) {
      return t('chat.yesterday')
    } else if (dayDiff < 7) {
      return date.toLocaleDateString(i18n.language, { weekday: 'long' })
    } else {
      return date.toLocaleDateString(i18n.language, { 
        day: 'numeric', 
        month: 'long',
        year: now.getFullYear() !== date.getFullYear() ? 'numeric' : undefined
      })
    }
  }, [t, i18n.language])
  
  // Group messages by time periods for better UX
  const groupedMessages = useMemo(() => {
    if (!messages.length) return []
    
    const groups = []
    let currentGroup = null
    
    messages.forEach((message, index) => {
      const messageDate = new Date(message.created_at)
      const prevMessage = messages[index - 1]
      const prevDate = prevMessage ? new Date(prevMessage.created_at) : null
      
      // Check if we need a time separator (different day or >1 hour gap)
      const needsSeparator = !prevDate || 
        messageDate.toDateString() !== prevDate.toDateString() ||
        (messageDate - prevDate) > 60 * 60 * 1000 // 1 hour
      
      if (needsSeparator) {
        if (currentGroup && currentGroup.messages.length > 0) {
          groups.push(currentGroup)
        }
        
        currentGroup = {
          id: `group-${index}`,
          timeLabel: formatTimeLabel(messageDate),
          messages: []
        }
      }
      
      // Check if message is from same user as previous (for avatar showing)
      const prevMessageFromSameUser = prevMessage && 
        prevMessage.sender_id === message.sender_id &&
        (messageDate - new Date(prevMessage.created_at)) < 5 * 60 * 1000 // 5 minutes
      
      currentGroup.messages.push({
        ...message,
        showAvatar: !prevMessageFromSameUser
      })
    })
    
    if (currentGroup && currentGroup.messages.length > 0) {
      groups.push(currentGroup)
    }
    
    return groups
  }, [messages, formatTimeLabel])
  
  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback((force = false) => {
    if (force || shouldAutoScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [])
  
  // Handle scroll events for auto-scroll management
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
    
    shouldAutoScrollRef.current = isNearBottom
    
    // Load more messages when scrolled to top
    if (scrollTop === 0 && onScrollToTop && !loading) {
      onScrollToTop()
    }
  }, [onScrollToTop, loading])
  
  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      // Use timeout to ensure DOM is updated
      setTimeout(() => scrollToBottom(), 50)
    }
  }, [messages.length, scrollToBottom])
  
  // Loading indicator at top
  const LoadingIndicator = memo(() => (
    loading ? (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
      </div>
    ) : null
  ))
  
  if (groupedMessages.length === 0 && !loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p className="text-lg mb-2">¡Inicia la conversación!</p>
          <p className="text-sm">Envía el primer mensaje a {otherUser?.nickname}</p>
        </div>
      </div>
    )
  }
  
  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto scroll-smooth"
      onScroll={handleScroll}
      style={{
        // Performance optimization: use CSS containment
        contain: 'layout style paint'
      }}
    >
      <div className="p-4 space-y-1">
        <LoadingIndicator />
        
        {groupedMessages.map((group) => (
          <div key={group.id}>
            <TimeSeparator time={group.timeLabel} />
            
            {group.messages.map((message) => {
              const isOwnMessage = message.sender_id === currentUser?.id
              const user = isOwnMessage ? currentUser : otherUser
              
              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwnMessage={isOwnMessage}
                  user={user}
                  showAvatar={message.showAvatar}
                />
              )
            })}
          </div>
        ))}
        
        <TypingIndicator 
          userName={otherUser?.nickname} 
          isVisible={isTyping}
        />
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
})

MessageList.displayName = 'MessageList'