"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useTranslation } from 'react-i18next'
import { messageService } from "@/lib/api/messages"
import { useAuth } from "@/hooks/use-auth"

// Página principal de "Chats"
export default function ChatsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadChats() {
      if (!user) {
        setLoading(false)
        return
      }
      
      try {
        const response = await messageService.getConversations()
        setChats(response.conversations || [])
      } catch (error) {
        console.error('Error loading chats:', error)
        // Use dummy data as fallback for development
        const { dummyConversations } = await import("@/lib/dummy-messages")
        setChats(dummyConversations)
      } finally {
        setLoading(false)
      }
    }
    
    loadChats()
  }, [user])

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <div className="max-w-2xl mx-auto p-4 md:p-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-6">{t('chat.messages', 'Messages')}</h1>
          {chats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('chat.noConversations', 'No conversations yet')}
            </div>
          ) : (
            <div className="border rounded-lg">
              {chats.map((chat, index) => (
                <ChatItem key={chat.id || chat.chat_id} chat={chat} isLast={index === chats.length - 1} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

// Componente para un item en la lista de chats
const ChatItem = ({ chat, isLast }) => {
  // Handle both API response format and dummy data format
  const chatId = chat?.chat_id || chat?.id
  const userName = chat?.user?.nickname || chat?.name
  const userAvatar = chat?.user?.avatar || chat?.avatarUrl
  const lastMessage = chat?.last_message || chat?.lastMessage
  const lastMessageTime = chat?.last_message_time || chat?.lastMessageTime
  const unreadCount = chat?.unread || chat?.unreadCount || 0
  
  return (
    <Link href={`/chats/${chatId}`}>
      <div
        className={`flex items-center gap-4 p-4 hover:bg-accent transition-colors cursor-pointer ${
          !isLast ? "border-b" : ""
        }`}
      >
        <Avatar className="h-14 w-14">
          <AvatarImage src={userAvatar || "/placeholder.svg"} />
          <AvatarFallback>{userName?.[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">{userName}</h3>
            <p className="text-sm text-muted-foreground">{lastMessageTime}</p>
          </div>
          <div className="flex justify-between items-start mt-1">
            <p className="text-sm text-muted-foreground truncate max-w-xs">{lastMessage}</p>
            {unreadCount > 0 && (
              <Badge className="h-6 w-6 flex items-center justify-center p-0">{unreadCount}</Badge>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
