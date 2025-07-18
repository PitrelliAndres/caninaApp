"use client"

import { useState } from "react"
import { ParkCard } from "./park-card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin } from "lucide-react"

// Componente que muestra la lista de parques y los filtros.
// Es un Client Component para manejar el estado de los filtros.
export function ParkList({ parks }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("all")

  // Extraemos los barrios únicos de la lista de parques para el filtro.
  const neighborhoods = ["all", ...new Set(parks.map((park) => park.neighborhood))]

  // Lógica de filtrado:
  // 1. Filtra por barrio si se ha seleccionado uno.
  // 2. Filtra por término de búsqueda en el nombre del parque.
  const filteredParks = parks
    .filter((park) => {
      return selectedNeighborhood === "all" || park.neighborhood === selectedNeighborhood
    })
    .filter((park) => {
      return park.name.toLowerCase().includes(searchTerm.toLowerCase())
    })

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Filtro de búsqueda por nombre */}
        <Input
          placeholder="Buscar parque por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-12 text-base md:col-span-2"
        />
        {/* Filtro por barrio */}
        <Select onValueChange={setSelectedNeighborhood} defaultValue="all">
          <SelectTrigger className="h-12 text-base">
            <MapPin className="h-5 w-5 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Filtrar por barrio" />
          </SelectTrigger>
          <SelectContent>
            {neighborhoods.map((neighborhood) => (
              <SelectItem key={neighborhood} value={neighborhood} className="text-base capitalize">
                {neighborhood === "all" ? "Todos los barrios" : neighborhood}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid responsivo para las tarjetas de los parques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredParks.map((park) => (
          <ParkCard key={park.id} park={park} />
        ))}
      </div>
      {/* Mensaje por si no hay resultados */}
      {filteredParks.length === 0 && (
        <div className="text-center py-16 col-span-full">
          <p className="text-xl text-muted-foreground">No se encontraron parques con esos filtros.</p>
        </div>
      )}
    </div>
  )
}
