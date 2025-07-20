"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, CalendarPlus, Users } from "lucide-react"
import { RegisterVisitModal } from "./register-visit-modal"
import { Badge } from "@/components/ui/badge"

export function ParkCard({ park, onVisitRegistered }) {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <img
          src={park.photo_url || `/placeholder-park.jpg`}
          alt={`Foto del ${park.name}`}
          className="rounded-lg object-cover w-full h-32"
        />
        <CardTitle className="text-2xl mt-4">{park.name}</CardTitle>
        <CardDescription className="flex items-center gap-1 text-base">
          <MapPin className="h-4 w-4" />
          {park.neighborhood}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-muted-foreground">{park.description}</p>
        
        <div className="mt-4 flex flex-wrap gap-2">
          {park.has_dog_area && (
            <Badge variant="secondary">Área para perros</Badge>
          )}
          {park.is_fenced && (
            <Badge variant="secondary">Cercado</Badge>
          )}
          {park.has_water && (
            <Badge variant="secondary">Agua disponible</Badge>
          )}
        </div>
        
        {park.active_visits_today > 0 && (
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{park.active_visits_today} visitantes hoy</span>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <RegisterVisitModal 
          parkId={park.id}
          parkName={park.name} 
          onSuccess={onVisitRegistered}
        >
          <Button size="lg" className="w-full text-base py-5">
            <CalendarPlus className="mr-2 h-5 w-5" />
            Registrar Visita
          </Button>
        </RegisterVisitModal>
      </CardFooter>
    </Card>
  )
}
