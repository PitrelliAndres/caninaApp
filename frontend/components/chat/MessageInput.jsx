/**
 * Optimized message input with validation, sanitization and performance features
 */
import React, { useState, useRef, useCallback, useEffect, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from "@/components/ui/button"
import { SendHorizonal, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

// Constants for validation
const MAX_MESSAGE_LENGTH = 1000
const MIN_MESSAGE_LENGTH = 1
const TYPING_DEBOUNCE_DELAY = 1000

// Input sanitization helper
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return ''
  
  // Basic sanitization - remove potential script tags and normalize whitespace
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
}

// Validation helper
const validateMessage = (text, t) => {
  const errors = []
  const warnings = []
  
  if (!text || text.trim().length < MIN_MESSAGE_LENGTH) {
    errors.push(t('chat.messageEmpty'))
  }
  
  if (text.length > MAX_MESSAGE_LENGTH) {
    errors.push(`${t('chat.messageTooLong')} (máximo ${MAX_MESSAGE_LENGTH} caracteres)`)
  }
  
  // Check for suspicious patterns (basic XSS protection)
  const suspiciousPatterns = [
    /<script/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:text\/html/gi
  ]
  
  suspiciousPatterns.forEach((pattern) => {
    if (pattern.test(text)) {
      warnings.push(t('chat.suspiciousContent'))
    }
  })
  
  return { errors, warnings, isValid: errors.length === 0 }
}

export const MessageInput = memo(({ 
  onSendMessage,
  onTyping,
  disabled = false,
  placeholder,
  maxLength = MAX_MESSAGE_LENGTH
}) => {
  const { t } = useTranslation()
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [validationErrors, setValidationErrors] = useState([])
  const textareaRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const lastTypingEmitRef = useRef(0)
  
  const { toast } = useToast()
  
  // Handle input change with debounced validation
  const handleInputChange = useCallback((e) => {
    const rawValue = e.target.value
    
    // Prevent input if it exceeds max length
    if (rawValue.length > maxLength) {
      toast({
        title: t('chat.messageTooLong'),
        description: `Máximo ${maxLength} caracteres permitidos`,
        variant: "destructive"
      })
      return
    }
    
    setMessage(rawValue)
    
    // Clear previous validation errors when user types
    if (validationErrors.length > 0) {
      setValidationErrors([])
    }
    
    // Emit typing event (debounced)
    if (onTyping) {
      const now = Date.now()
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      // Only emit if enough time has passed since last emit
      if (now - lastTypingEmitRef.current > TYPING_DEBOUNCE_DELAY) {
        onTyping()
        lastTypingEmitRef.current = now
      } else {
        // Set timeout to emit after debounce delay
        typingTimeoutRef.current = setTimeout(() => {
          onTyping()
          lastTypingEmitRef.current = Date.now()
        }, TYPING_DEBOUNCE_DELAY - (now - lastTypingEmitRef.current))
      }
    }
  }, [maxLength, validationErrors.length, onTyping, toast, t])
  
  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    
    if (isSending || disabled) return
    
    const trimmedMessage = message.trim()
    
    // Validate message
    const validation = validateMessage(trimmedMessage, t)
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      return
    }
    
    // Sanitize message
    const sanitizedMessage = sanitizeInput(trimmedMessage)
    
    if (!sanitizedMessage) {
      setValidationErrors([t('chat.invalidMessage')])
      return
    }
    
    // Show warnings if any
    if (validation.warnings.length > 0) {
      validation.warnings.forEach(warning => {
        toast({
          title: t('chat.warning'),
          description: warning,
          variant: "default"
        })
      })
    }
    
    try {
      setIsSending(true)
      setValidationErrors([])
      
      await onSendMessage(sanitizedMessage)
      
      // Clear input on successful send
      setMessage('')
      
      // Focus back to textarea
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 50)
      
    } catch (error) {
      console.error('Send message error:', error)
      
      toast({
        title: t('chat.sendError'),
        description: error.message || t('chat.couldNotSend'),
        variant: "destructive"
      })
      
      // Keep the message in input so user can retry
      
    } finally {
      setIsSending(false)
    }
  }, [message, isSending, disabled, onSendMessage, toast, t])
  
  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift+Enter adds new line (default behavior)
        return
      } else {
        // Enter sends message
        e.preventDefault()
        handleSubmit(e)
      }
    }
    
    // Escape clears input
    if (e.key === 'Escape') {
      setMessage('')
      setValidationErrors([])
    }
  }, [handleSubmit])
  
  // Auto-resize textarea based on content
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    // Reset height to calculate new height
    textarea.style.height = 'auto'
    
    // Set new height based on scroll height (max 5 lines)
    const maxHeight = 5 * 20 // approximately 5 lines
    const newHeight = Math.min(textarea.scrollHeight, maxHeight)
    textarea.style.height = `${newHeight}px`
  }, [])
  
  // Adjust height when message changes
  useEffect(() => {
    adjustTextareaHeight()
  }, [message, adjustTextareaHeight])
  
  // Character count
  const characterCount = message.length
  const isNearLimit = characterCount > maxLength * 0.8
  const isOverLimit = characterCount > maxLength
  
  // Check if send button should be disabled
  const isSendDisabled = disabled || 
    isSending || 
    !message.trim() || 
    isOverLimit || 
    validationErrors.length > 0
  
  return (
    <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <form onSubmit={handleSubmit} className="p-4">
        {/* Validation errors */}
        {validationErrors.length > 0 && (
          <div className="mb-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <div className="text-sm text-destructive">
                {validationErrors.map((error, index) => (
                  <div key={index}>{error}</div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder || t('chat.writePlaceholder')}
              disabled={disabled || isSending}
              className={cn(
                "w-full min-h-[44px] max-h-[120px] resize-none",
                "px-3 py-2 text-sm rounded-md border-0",
                "bg-muted/50 focus:bg-background",
                "transition-colors duration-200",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                isOverLimit && "border-destructive focus:border-destructive"
              )}
              style={{
                // Performance optimization
                contain: 'layout style'
              }}
            />
            
            {/* Character counter */}
            <div className={cn(
              "absolute bottom-2 right-2 text-xs tabular-nums transition-colors",
              isNearLimit ? (isOverLimit ? "text-destructive" : "text-orange-500") : "text-muted-foreground"
            )}>
              {characterCount}/{maxLength}
            </div>
          </div>
          
          <Button
            type="submit"
            size="icon"
            disabled={isSendDisabled}
            className={cn(
              "h-11 w-11 shrink-0",
              "transition-all duration-200",
              !isSendDisabled && "hover:scale-105"
            )}
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
            ) : (
              <SendHorizonal className="h-4 w-4" />
            )}
            <span className="sr-only">Enviar mensaje</span>
          </Button>
        </div>
        
        {/* Keyboard shortcuts hint */}
        <div className="mt-1 text-xs text-muted-foreground text-center">
          <span className="hidden sm:inline">
            Presiona Enter para enviar, Shift+Enter para nueva línea
          </span>
        </div>
      </form>
    </div>
  )
})

MessageInput.displayName = 'MessageInput'