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
import { useTranslation } from 'react-i18next'

export default function MatchesPage() {
  const { t } = useTranslation()
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
        title: t('errors.loadingMatches'),
        description: t('errors.loadingMatchesDetail'),
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
          title: t('matches.itsAMatch'),
          description: t('matches.mutualLike'),
        })
        // Recargar datos para actualizar listas
        loadData()
      } else {
        // Remover de sugerencias
        setSuggestions(prev => prev.filter(s => s.user_id !== userId))
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('errors.processingAction'),
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
        title: t('matches.matchRemoved'),
        description: t('matches.matchRemovedDetail')
      })
      loadData()
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('errors.undoMatch'),
        variant: "destructive"
      })
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <Header />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold">{t('matches.title')}</h1>
          <p className="text-lg text-muted-foreground mt-1">{t('matches.subtitle')}</p>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-lg text-muted-foreground">{t('matches.loadingMatches')}</div>
            </div>
          ) : (
            <Tabs defaultValue="discover" className="mt-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="discover">{t('matches.tabs.discover')}</TabsTrigger>
                <TabsTrigger value="my-matches">{t('matches.tabs.myMatches')} ({mutualMatches.length})</TabsTrigger>
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
                      {t('matches.noMoreSuggestions')}
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
                      {t('matches.noMatches')}
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

const MatchCard = ({ profile, onAction, disabled }) => {
  const { t } = useTranslation()
  return (
  <Card className="flex flex-col">
    <CardHeader className="relative">
      <Badge className="absolute top-4 right-4 text-base" variant="destructive">
        {t('matches.compatibility', { percent: profile.compatibility })}
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
          {t('matches.withDogFull', { dogName: profile.dog.name, breed: profile.dog.breed, age: profile.dog.age })}
        </p>
      )}
      {profile.park_name && (
        <div className="flex items-center justify-center gap-2 mt-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{t('matches.lastSeenAt', { parkName: profile.park_name })}</span>
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
        <span className="text-lg">{t('matches.pass')}</span>
      </Button>
      <Button 
        size="lg" 
        className="h-14 bg-green-600 hover:bg-green-700"
        onClick={() => onAction(profile.user_id, 'like')}
        disabled={disabled}
      >
        <Heart className="h-6 w-6 mr-2" />
        <span className="text-lg">{t('matches.like')}</span>
      </Button>
    </CardFooter>
  </Card>
  )
}

const MutualMatchCard = ({ match, onStartChat, onUnmatch }) => {
  const { t } = useTranslation()
  return (
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
          {t('matches.withDog', { dogName: match.user.dog.name })}
        </p>
      )}
      <p className="text-xs text-muted-foreground mt-2">
        {t('matches.matchSince', { date: new Date(match.matched_at).toLocaleDateString() })}
      </p>
    </CardContent>
    <CardFooter className="grid grid-cols-2 gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onUnmatch(match.match_id)}
      >
        {t('matches.unmatch')}
      </Button>
      <Button
        size="sm"
        onClick={() => onStartChat(match.user.id)}
      >
        <MessageSquare className="h-4 w-4 mr-1" />
        {t('matches.chat')}
      </Button>
    </CardFooter>
  </Card>
  )
}
