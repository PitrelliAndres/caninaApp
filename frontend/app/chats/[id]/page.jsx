"use client"

import { useState, useEffect, useRef } from "react"
import { Header } from "@/components/layout/header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SendHorizonal } from "lucide-react"
import { useParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { messageService } from "@/lib/api/messages"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/hooks/use-auth"

export default function ChatPage() {
  const params = useParams()
  const chatId = params.id
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [chatInfo, setChatInfo] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [otherUserTyping, setOtherUserTyping] = useState(false)
  
  const messagesEndRef = useRef(null)
  const socketRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  useEffect(() => {
    loadChat()
    connectWebSocket()
    
    return () => {
      if (socketRef.current) {
        messageService.disconnectWebSocket()
      }
    }
  }, [chatId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadChat = async () => {
    try {
      setLoading(true)
      
      // Cargar información del chat y mensajes
      const [conversationsRes, messagesRes] = await Promise.all([
        messageService.getConversations(),
        messageService.getChatMessages(chatId)
      ])
      
      // Encontrar info del chat
      const chat = conversationsRes.conversations?.find(c => c.chat_id === parseInt(chatId))
      if (chat) {
        setChatInfo(chat)
      }
      
      setMessages(messagesRes.messages || [])
      
      // Marcar como leídos
      messageService.markAsRead(chatId)
    } catch (error) {
      toast({
        title: "Error al cargar chat",
        description: "No se pudo cargar la conversación",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const connectWebSocket = () => {
    const token = localStorage.getItem('jwt_token')
    socketRef.current = messageService.connectWebSocket(token)
    
    // Escuchar nuevos mensajes
    socketRef.current.on('new_message', (data) => {
      if (data.chat_id === parseInt(chatId)) {
        setMessages(prev => [...prev, data.message])
        messageService.markAsRead(chatId)
      }
    })
    
    // Escuchar indicador de escritura
    socketRef.current.on('user_typing', (data) => {
      if (data.chat_id === parseInt(chatId)) {
        setOtherUserTyping(true)
        
        // Limpiar timeout anterior
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current)
        }
        
        // Ocultar después de 3 segundos
        typingTimeoutRef.current = setTimeout(() => {
          setOtherUserTyping(false)
        }, 3000)
      }
    })
    
    // Escuchar confirmación de lectura
    socketRef.current.on('messages_read', (data) => {
      if (data.chat_id === parseInt(chatId)) {
        // Actualizar estado de mensajes leídos
        setMessages(prev => 
          prev.map(msg => ({
            ...msg,
            is_read: msg.sender_id === user?.id ? true : msg.is_read
          }))
        )
      }
    })
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return
    
    try {
      setSending(true)
      const response = await messageService.sendMessage(chatId, newMessage)
      
      // Agregar mensaje localmente
      setMessages(prev => [...prev, response.message])
      setNewMessage("")
    } catch (error) {
      toast({
        title: "Error al enviar",
        description: error.message || "No se pudo enviar el mensaje",
        variant: "destructive"
      })
    } finally {
      setSending(false)
    }
  }

  const handleTyping = () => {
    if (chatInfo) {
      messageService.emitTyping(chatId, chatInfo.user.id)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-lg text-muted-foreground">Cargando chat...</div>
        </div>
      </div>
    )
  }

  if (!chatInfo) {
    return (
      <div className="flex flex-col h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-lg text-muted-foreground">Chat no encontrado</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex-1 flex flex-col">
        {/* Cabecera del chat */}
        <div className="border-b p-4 flex items-center gap-4 bg-background">
          <Avatar className="h-12 w-12">
            <AvatarImage src={chatInfo.user.avatar || "/placeholder.svg"} />
            <AvatarFallback>{chatInfo.user.nickname?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-bold">{chatInfo.user.nickname}</h2>
            <div className="flex items-center gap-2">
              <span className={cn(
                "h-2 w-2 rounded-full", 
                chatInfo.user.is_online ? "bg-green-500" : "bg-gray-400"
              )} />
              <p className="text-sm text-muted-foreground">
                {chatInfo.user.is_online ? "En línea" : "Desconectado"}
              </p>
            </div>
          </div>
        </div>

        {/* Cuerpo de mensajes */}
        <div className="flex-1 p-6 overflow-y-auto bg-muted/40 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex items-end gap-2", 
                msg.sender_id === user?.id ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "rounded-2xl p-3 max-w-sm",
                  msg.sender_id === user?.id
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-background rounded-bl-none",
                )}
              >
                <p>{msg.text}</p>
                <p className="text-xs text-right mt-1 opacity-70">
                  {msg.time}
                  {msg.sender_id === user?.id && msg.is_read && " ✓✓"}
                </p>
              </div>
            </div>
          ))}
          
          {otherUserTyping && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex gap-1">
                <span className="animate-bounce">●</span>
                <span className="animate-bounce delay-100">●</span>
                <span className="animate-bounce delay-200">●</span>
              </div>
              <span>{chatInfo.user.nickname} está escribiendo...</span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input para enviar mensaje */}
        <div className="border-t p-4 bg-background">
          <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
            <div className="relative">
              <Input 
                placeholder="Escribe un mensaje..." 
                className="h-12 pr-14 text-base"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyUp={handleTyping}
                disabled={sending}
              />
              <Button 
                type="submit"
                size="icon" 
                className="absolute top-1/2 right-2 -translate-y-1/2"
                disabled={!newMessage.trim() || sending}
              >
                <SendHorizonal className="h-5 w-5" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
