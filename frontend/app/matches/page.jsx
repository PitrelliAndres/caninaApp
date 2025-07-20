"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { X, Heart, MapPin, MessageSquare } from "lucide-react"
import { matchService } from "@/lib/api/matches"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

export default function MatchesPage() {
  const [suggestions, setSuggestions] = useState([])
  const [mutualMatches, setMutualMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [suggestionsRes, mutualRes] = await Promise.all([
        matchService.getSuggestions(),
        matchService.getMutualMatches()
      ])
      
      setSuggestions(suggestionsRes.suggestions || [])
      setMutualMatches(mutualRes.matches || [])
    } catch (error) {
      toast({
        title: "Error al cargar matches",
        description: "No se pudieron cargar las sugerencias",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (userId, action) => {
    try {
      setProcessingId(userId)
      const response = await matchService.createMatch(userId, action)
      
      if (response.is_mutual) {
        toast({
          title: "¡Es un match! 🎉",
          description: "Ambos se dieron like. Ya pueden chatear.",
        })
        // Recargar datos para actualizar listas
        loadData()
      } else {
        // Remover de sugerencias
        setSuggestions(prev => prev.filter(s => s.user_id !== userId))
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo procesar la acción",
        variant: "destructive"
      })
    } finally {
      setProcessingId(null)
    }
  }

  const handleStartChat = (userId) => {
    // Navegar al chat con ese usuario
    router.push(`/chats/${userId}`)
  }

  const handleUnmatch = async (matchId) => {
    try {
      await matchService.unmatch(matchId)
      toast({
        title: "Match eliminado",
        description: "Se ha deshecho el match"
      })
      loadData()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo deshacer el match",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <Header />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold">Matches</h1>
          <p className="text-lg text-muted-foreground mt-1">Conecta con otros dueños de perros.</p>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-lg text-muted-foreground">Cargando matches...</div>
            </div>
          ) : (
            <Tabs defaultValue="discover" className="mt-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="discover">Descubrir</TabsTrigger>
                <TabsTrigger value="my-matches">Mis Matches ({mutualMatches.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="discover">
                {suggestions.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                    {suggestions.map((profile) => (
                      <MatchCard 
                        key={profile.user_id} 
                        profile={profile} 
                        onAction={handleAction}
                        disabled={processingId === profile.user_id}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <p className="text-xl text-muted-foreground">
                      No hay más sugerencias por ahora. Vuelve más tarde.
                    </p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="my-matches">
                {mutualMatches.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                    {mutualMatches.map((match) => (
                      <MutualMatchCard
                        key={match.match_id}
                        match={match}
                        onStartChat={handleStartChat}
                        onUnmatch={handleUnmatch}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <p className="text-xl text-muted-foreground">
                      Aquí aparecerán tus matches mutuos.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
    </div>
  )
}

const MatchCard = ({ profile, onAction, disabled }) => (
  <Card className="flex flex-col">
    <CardHeader className="relative">
      <Badge className="absolute top-4 right-4 text-base" variant="destructive">
        {profile.compatibility}% compatible
      </Badge>
      <Avatar className="w-24 h-24 mx-auto border-4 border-background ring-2 ring-primary">
        <AvatarImage src={profile.user?.avatar_url || "/placeholder.svg"} />
        <AvatarFallback>{profile.nickname?.[0] || "U"}</AvatarFallback>
      </Avatar>
    </CardHeader>
    <CardContent className="flex-grow text-center">
      <h3 className="text-2xl font-bold">
        {profile.nickname}, {profile.user?.age || "?"}
      </h3>
      {profile.dog && (
        <p className="text-lg text-muted-foreground">
          con {profile.dog.name} ({profile.dog.breed}), {profile.dog.age} años
        </p>
      )}
      {profile.park_name && (
        <div className="flex items-center justify-center gap-2 mt-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>Visto en {profile.park_name}</span>
        </div>
      )}
      {profile.shared_interests?.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center mt-4">
          {profile.shared_interests.map((interest) => (
            <Badge key={interest} variant="secondary">
              {interest}
            </Badge>
          ))}
        </div>
      )}
    </CardContent>
    <CardFooter className="grid grid-cols-2 gap-2">
      <Button 
        variant="outline" 
        size="lg" 
        className="h-14 bg-transparent"
        onClick={() => onAction(profile.user_id, 'pass')}
        disabled={disabled}
      >
        <X className="h-6 w-6 mr-2" />
        <span className="text-lg">Pasar</span>
      </Button>
      <Button 
        size="lg" 
        className="h-14 bg-green-600 hover:bg-green-700"
        onClick={() => onAction(profile.user_id, 'like')}
        disabled={disabled}
      >
        <Heart className="h-6 w-6 mr-2" />
        <span className="text-lg">Me gusta</span>
      </Button>
    </CardFooter>
  </Card>
)

const MutualMatchCard = ({ match, onStartChat, onUnmatch }) => (
  <Card className="flex flex-col">
    <CardHeader>
      <Avatar className="w-20 h-20 mx-auto">
        <AvatarImage src={match.user.avatar_url || "/placeholder.svg"} />
        <AvatarFallback>{match.user.nickname?.[0] || "U"}</AvatarFallback>
      </Avatar>
    </CardHeader>
    <CardContent className="flex-grow text-center">
      <h3 className="text-xl font-bold">{match.user.nickname}</h3>
      {match.user.dog && (
        <p className="text-sm text-muted-foreground">
          con {match.user.dog.name}
        </p>
      )}
      <p className="text-xs text-muted-foreground mt-2">
        Match desde {new Date(match.matched_at).toLocaleDateString()}
      </p>
    </CardContent>
    <CardFooter className="grid grid-cols-2 gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onUnmatch(match.match_id)}
      >
        Deshacer match
      </Button>
      <Button
        size="sm"
        onClick={() => onStartChat(match.user.id)}
      >
        <MessageSquare className="h-4 w-4 mr-1" />
        Chatear
      </Button>
    </CardFooter>
  </Card>
)
