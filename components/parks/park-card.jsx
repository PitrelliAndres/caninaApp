"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, CalendarPlus } from "lucide-react"
import { RegisterVisitModal } from "./register-visit-modal"

// Tarjeta individual para cada parque.
export function ParkCard({ park }) {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        {/* Imagen del parque. Usamos un placeholder. */}
        <img
          src={`/buenos-aires-park.png?width=400&height=200&query=parque+en+buenos+aires+${park.name}`}
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
      </CardContent>
      <CardFooter>
        {/* El botón abre un modal para registrar la visita. */}
        <RegisterVisitModal parkName={park.name}>
          <Button size="lg" className="w-full text-base py-5">
            <CalendarPlus className="mr-2 h-5 w-5" />
            Registrar Visita
          </Button>
        </RegisterVisitModal>
      </CardFooter>
    </Card>
  )
}
