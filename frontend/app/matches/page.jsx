"use client"

import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { matchProfiles } from "@/lib/dummy-data"
import { X, Heart, MapPin } from "lucide-react"

// Página de "Matches"
export default function MatchesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <Header />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold">Matches</h1>
          <p className="text-lg text-muted-foreground mt-1">Conecta con otros dueños de perros.</p>

          <Tabs defaultValue="discover" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="discover">Descubrir</TabsTrigger>
              <TabsTrigger value="my-matches">Mis Matches (0)</TabsTrigger>
            </TabsList>
            <TabsContent value="discover">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                {matchProfiles.map((profile) => (
                  <MatchCard key={profile.id} profile={profile} />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="my-matches">
              <div className="text-center py-16">
                <p className="text-xl text-muted-foreground">Aquí aparecerán tus matches mutuos.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

// Tarjeta de perfil para la sección "Descubrir"
const MatchCard = ({ profile }) => (
  <Card className="flex flex-col">
    <CardHeader className="relative">
      <Badge className="absolute top-4 right-4 text-base" variant="destructive">
        {profile.compatibility}% compatible
      </Badge>
      <Avatar className="w-24 h-24 mx-auto border-4 border-background ring-2 ring-primary">
        <AvatarImage src={profile.user.avatarUrl || "/placeholder.svg"} />
        <AvatarFallback>{profile.user.name[0]}</AvatarFallback>
      </Avatar>
    </CardHeader>
    <CardContent className="flex-grow text-center">
      <h3 className="text-2xl font-bold">
        {profile.user.name}, {profile.user.age}
      </h3>
      <p className="text-lg text-muted-foreground">
        con {profile.dog.name} ({profile.dog.breed}), {profile.dog.age} años
      </p>
      <div className="flex items-center justify-center gap-2 mt-2 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4" />
        <span>Visto en {profile.lastSeen}</span>
      </div>
      <div className="flex flex-wrap gap-2 justify-center mt-4">
        {profile.interests.map((interest) => (
          <Badge key={interest} variant="secondary">
            {interest}
          </Badge>
        ))}
      </div>
    </CardContent>
    <CardFooter className="grid grid-cols-2 gap-2">
      <Button variant="outline" size="lg" className="h-14 bg-transparent">
        <X className="h-6 w-6 mr-2" />
        <span className="text-lg">Pasar</span>
      </Button>
      <Button size="lg" className="h-14 bg-green-600 hover:bg-green-700">
        <Heart className="h-6 w-6 mr-2" />
        <span className="text-lg">Me gusta</span>
      </Button>
    </CardFooter>
  </Card>
)
