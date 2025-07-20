import { Header } from "@/components/layout/header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { chats } from "@/lib/dummy-data"
import Link from "next/link"

// Página principal de "Chats"
export default function ChatsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <div className="max-w-2xl mx-auto p-4 md:p-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-6">Mensajes</h1>
          <div className="border rounded-lg">
            {chats.map((chat, index) => (
              <ChatItem key={chat.id} chat={chat} isLast={index === chats.length - 1} />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

// Componente para un item en la lista de chats
const ChatItem = ({ chat, isLast }) => (
  <Link href={`/chats/${chat?.id}`}>
    <div
      className={`flex items-center gap-4 p-4 hover:bg-accent transition-colors cursor-pointer ${
        !isLast ? "border-b" : ""
      }`}
    >
      <Avatar className="h-14 w-14">
        <AvatarImage src={chat?.avatarUrl || "/placeholder.svg"} />
        <AvatarFallback>{chat?.name?.[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{chat?.name}</h3>
          <p className="text-sm text-muted-foreground">{chat?.lastMessageTime}</p>
        </div>
        <div className="flex justify-between items-start mt-1">
          <p className="text-sm text-muted-foreground truncate max-w-xs">{chat?.lastMessage}</p>
          {chat?.unreadCount > 0 && (
            <Badge className="h-6 w-6 flex items-center justify-center p-0">{chat?.unreadCount}</Badge>
          )}
        </div>
      </div>
    </div>
  </Link>
)
