"use client"

import { Header } from "@/components/layout/header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { chats, messages } from "@/lib/dummy-data"
import { SendHorizonal } from "lucide-react"
import { useParams } from "next/navigation"
import { cn } from "@/lib/utils"

// Página para una conversación de chat individual
export default function ChatPage() {
  const params = useParams()
  const chatId = params.id
  const chatInfo = chats.find((c) => c.id.toString() === chatId)
  const chatMessages = messages[chatId] || []

  if (!chatInfo) {
    return <div>Chat no encontrado</div>
  }

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex-1 flex flex-col">
        {/* Cabecera del chat */}
        <div className="border-b p-4 flex items-center gap-4 bg-background">
          <Avatar className="h-12 w-12">
            <AvatarImage src={chatInfo.avatarUrl || "/placeholder.svg"} />
            <AvatarFallback>{chatInfo.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-bold">{chatInfo.name}</h2>
            <div className="flex items-center gap-2">
              <span className={cn("h-2 w-2 rounded-full", chatInfo.isOnline ? "bg-green-500" : "bg-gray-400")} />
              <p className="text-sm text-muted-foreground">{chatInfo.isOnline ? "En línea" : "Desconectado"}</p>
            </div>
          </div>
        </div>

        {/* Cuerpo de mensajes */}
        <div className="flex-1 p-6 overflow-y-auto bg-muted/40 space-y-4">
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={cn("flex items-end gap-2", msg.sender === "me" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "rounded-2xl p-3 max-w-sm",
                  msg.sender === "me"
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-background rounded-bl-none",
                )}
              >
                <p>{msg.text}</p>
                <p className="text-xs text-right mt-1 opacity-70">{msg.time}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input para enviar mensaje */}
        <div className="border-t p-4 bg-background">
          <div className="relative">
            <Input placeholder="Escribe un mensaje..." className="h-12 pr-14 text-base" />
            <Button size="icon" className="absolute top-1/2 right-2 -translate-y-1/2">
              <SendHorizonal className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
