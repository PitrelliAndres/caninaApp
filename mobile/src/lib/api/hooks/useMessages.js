import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { messagesService } from '../../services/api/messages'
import { queryKeys, invalidateQueries } from '../queryClient'
import { selectCurrentChat } from '../../store/slices/chatSlice'
import { useSocketActions } from '../socketReduxIntegration'
import MobileLogger from '../../utils/logger'

// Hook para obtener conversaciones
export const useConversations = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.messages.all(),
    queryFn: messagesService.getConversations,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 10 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false, // Mobile no tiene window focus
    ...options,
  })
}

// Hook para obtener mensajes de una conversación (paginado)
export const useMessages = (conversationId, options = {}) => {
  return useInfiniteQuery({
    queryKey: queryKeys.messages.conversation(conversationId),
    queryFn: ({ pageParam }) => 
      messagesService.getMessages(conversationId, { 
        after: pageParam,
        limit: 20 
      }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor || undefined,
    enabled: !!conversationId,
    staleTime: 30 * 1000, // 30 segundos (muy dinámico)
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    ...options,
  })
}

// Hook para enviar mensaje (usando Socket.IO + fallback HTTP)
export const useSendMessage = () => {
  const queryClient = useQueryClient()
  const { sendMessage: sendViaSocket } = useSocketActions()
  const currentChat = useSelector(selectCurrentChat)

  return useMutation({
    mutationFn: async ({ conversationId, text, tempId }) => {
      // Intentar enviar via Socket.IO primero
      const socketSuccess = sendViaSocket(conversationId, text, (success) => {
        if (!success) {
          // Fallback HTTP si falla socket
          return messagesService.sendMessage(conversationId, text, tempId)
        }
      })

      // Si socket no está disponible, usar HTTP inmediatamente
      if (!socketSuccess) {
        return messagesService.sendMessage(conversationId, text, tempId)
      }

      return { success: true, tempId }
    },
    onMutate: async ({ conversationId, text, tempId }) => {
      // Optimistic update
      const messageId = tempId || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const tempMessage = {
        id: messageId,
        temp_id: messageId,
        text,
        sender_id: currentChat?.user?.id, // Current user ID from Redux
        receiver_id: currentChat?.user?.id,
        conversation_id: conversationId,
        created_at: new Date().toISOString(),
        status: 'sending',
        is_read: false,
      }

      // Cancel queries para evitar conflictos
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.messages.conversation(conversationId) 
      })

      // Obtener data anterior
      const previousMessages = queryClient.getQueryData(
        queryKeys.messages.conversation(conversationId)
      )

      // Agregar mensaje temporalmente
      if (previousMessages?.pages) {
        const updatedPages = [...previousMessages.pages]
        if (updatedPages[0]) {
          updatedPages[0] = {
            ...updatedPages[0],
            messages: [tempMessage, ...updatedPages[0].messages],
          }
        }

        queryClient.setQueryData(
          queryKeys.messages.conversation(conversationId),
          { ...previousMessages, pages: updatedPages }
        )
      }

      return { previousMessages, tempMessage }
    },
    onSuccess: (data, variables, context) => {
      // Actualizar estado del mensaje temporal
      if (data.tempId && context?.tempMessage) {
        const conversationQuery = queryClient.getQueryData(
          queryKeys.messages.conversation(variables.conversationId)
        )

        if (conversationQuery?.pages) {
          const updatedPages = conversationQuery.pages.map(page => ({
            ...page,
            messages: page.messages.map(msg => 
              msg.temp_id === data.tempId 
                ? { ...msg, status: 'sent', id: data.serverId || msg.id }
                : msg
            ),
          }))

          queryClient.setQueryData(
            queryKeys.messages.conversation(variables.conversationId),
            { ...conversationQuery, pages: updatedPages }
          )
        }
      }

      // Invalidar conversaciones para actualizar last_message
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.all() })

      MobileLogger.logInfo('Message sent successfully', {
        conversationId: variables.conversationId,
        tempId: data.tempId,
      }, 'Messages')
    },
    onError: (error, variables, context) => {
      // Revert optimistic update
      if (context?.previousMessages) {
        queryClient.setQueryData(
          queryKeys.messages.conversation(variables.conversationId),
          context.previousMessages
        )
      }

      // Marcar mensaje como fallido
      if (context?.tempMessage) {
        const conversationQuery = queryClient.getQueryData(
          queryKeys.messages.conversation(variables.conversationId)
        )

        if (conversationQuery?.pages) {
          const updatedPages = conversationQuery.pages.map(page => ({
            ...page,
            messages: page.messages.map(msg => 
              msg.temp_id === context.tempMessage.temp_id 
                ? { ...msg, status: 'failed' }
                : msg
            ),
          }))

          queryClient.setQueryData(
            queryKeys.messages.conversation(variables.conversationId),
            { ...conversationQuery, pages: updatedPages }
          )
        }
      }

      MobileLogger.logError(error, {
        conversationId: variables.conversationId,
      }, 'Messages')
    },
    retry: 1,
  })
}

// Hook para marcar mensajes como leídos
export const useMarkAsRead = () => {
  const queryClient = useQueryClient()
  const { markAsRead: markViaSocket } = useSocketActions()

  return useMutation({
    mutationFn: async ({ conversationId, upToMessageId }) => {
      // Intentar via Socket.IO primero
      const socketSuccess = markViaSocket(conversationId, upToMessageId)
      
      if (!socketSuccess) {
        // Fallback HTTP
        return messagesService.markAsRead(conversationId, upToMessageId)
      }
      
      return { success: true }
    },
    onMutate: async ({ conversationId, upToMessageId }) => {
      // Optimistic update
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.messages.conversation(conversationId) 
      })

      const previousMessages = queryClient.getQueryData(
        queryKeys.messages.conversation(conversationId)
      )

      if (previousMessages?.pages) {
        const updatedPages = previousMessages.pages.map(page => ({
          ...page,
          messages: page.messages.map(msg => 
            msg.id <= upToMessageId ? { ...msg, is_read: true } : msg
          ),
        }))

        queryClient.setQueryData(
          queryKeys.messages.conversation(conversationId),
          { ...previousMessages, pages: updatedPages }
        )
      }

      return { previousMessages }
    },
    onError: (error, variables, context) => {
      // Revert optimistic update
      if (context?.previousMessages) {
        queryClient.setQueryData(
          queryKeys.messages.conversation(variables.conversationId),
          context.previousMessages
        )
      }

      MobileLogger.logError(error, {
        conversationId: variables.conversationId,
      }, 'Messages')
    },
    retry: 1,
  })
}

// Hook para reenviar mensaje fallido
export const useRetryMessage = () => {
  const sendMessage = useSendMessage()

  return useMutation({
    mutationFn: ({ message }) => {
      return sendMessage.mutateAsync({
        conversationId: message.conversation_id,
        text: message.text,
        tempId: `retry_${message.temp_id || message.id}`,
      })
    },
    onSuccess: (data, variables) => {
      MobileLogger.logInfo('Message retry successful', {
        originalMessageId: variables.message.id,
        newTempId: data.tempId,
      }, 'Messages')
    },
  })
}

// Hook para eliminar mensaje
export const useDeleteMessage = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ messageId, conversationId }) => 
      messagesService.deleteMessage(messageId),
    onMutate: async ({ messageId, conversationId }) => {
      // Optimistic update
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.messages.conversation(conversationId) 
      })

      const previousMessages = queryClient.getQueryData(
        queryKeys.messages.conversation(conversationId)
      )

      if (previousMessages?.pages) {
        const updatedPages = previousMessages.pages.map(page => ({
          ...page,
          messages: page.messages.filter(msg => msg.id !== messageId),
        }))

        queryClient.setQueryData(
          queryKeys.messages.conversation(conversationId),
          { ...previousMessages, pages: updatedPages }
        )
      }

      return { previousMessages }
    },
    onError: (error, variables, context) => {
      // Revert optimistic update
      if (context?.previousMessages) {
        queryClient.setQueryData(
          queryKeys.messages.conversation(variables.conversationId),
          context.previousMessages
        )
      }

      MobileLogger.logError(error, {
        messageId: variables.messageId,
      }, 'Messages')
    },
    retry: 1,
  })
}

// Hook para obtener info de conversación específica
export const useConversation = (conversationId, options = {}) => {
  return useQuery({
    queryKey: ['conversations', 'detail', conversationId],
    queryFn: () => messagesService.getConversation(conversationId),
    enabled: !!conversationId,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2,
    ...options,
  })
}

// Hook combinado para chat screen
export const useChatScreen = (conversationId) => {
  const messagesQuery = useMessages(conversationId, {
    refetchInterval: 30000, // Refetch cada 30s como backup del real-time
  })
  const conversationQuery = useConversation(conversationId)

  // Flatten pages de mensajes
  const messages = messagesQuery.data?.pages?.flatMap(page => page.messages) || []

  return {
    messages,
    conversation: conversationQuery.data,
    hasNextPage: messagesQuery.hasNextPage,
    fetchNextPage: messagesQuery.fetchNextPage,
    isFetchingNextPage: messagesQuery.isFetchingNextPage,
    isLoading: messagesQuery.isLoading || conversationQuery.isLoading,
    isRefreshing: messagesQuery.isRefetching,
    error: messagesQuery.error || conversationQuery.error,
    refetch: messagesQuery.refetch,
  }
}

// Hook para typing indicator
export const useTypingIndicator = (conversationId) => {
  const { emitTyping } = useSocketActions()
  let typingTimeout = null

  const startTyping = () => {
    emitTyping(conversationId, true)
    
    // Auto-stop después de 3 segundos
    if (typingTimeout) clearTimeout(typingTimeout)
    typingTimeout = setTimeout(() => {
      emitTyping(conversationId, false)
    }, 3000)
  }

  const stopTyping = () => {
    if (typingTimeout) {
      clearTimeout(typingTimeout)
      typingTimeout = null
    }
    emitTyping(conversationId, false)
  }

  return { startTyping, stopTyping }
}

export default {
  useConversations,
  useMessages,
  useSendMessage,
  useMarkAsRead,
  useRetryMessage,
  useDeleteMessage,
  useConversation,
  useChatScreen,
  useTypingIndicator,
}
