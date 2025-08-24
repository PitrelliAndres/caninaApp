"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { DMChat } from "@/components/chat/dm-chat"
import { useAuth } from "@/hooks/use-auth"
import { useTranslation } from 'react-i18next'

export default function ChatPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const params = useParams()
  const conversationId = parseInt(params.id)
  const { user } = useAuth()
  const [chatUser, setChatUser] = useState(null)
  
  // Mock data for chat user - replace with actual API call
  useEffect(() => {
    // TODO: Fetch conversation details and other user info
    // For now, use placeholder data
    setChatUser({
      id: 2,
      name: "Chat User",
      profile_photo: "/placeholder-avatar.jpg"
    })
  }, [conversationId])

  const handleBack = () => {
    router.push('/chats')
  }

  if (!chatUser) {
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
        <DMChat 
          conversationId={conversationId}
          user={chatUser}
          onBack={handleBack}
        />
      </main>
    </div>
  )
}