"use client"

import { useState, useEffect } from "react"
import { ParkCard } from "./park-card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Search } from "lucide-react"
import { parkService } from "@/lib/api/parks"
import { useToast } from "@/components/ui/use-toast"

export function ParkList({ parks: initialParks, onRefresh }) {
  const [parks, setParks] = useState(initialParks || [])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("all")
  const [neighborhoods, setNeighborhoods] = useState([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadNeighborhoods()
  }, [])

  useEffect(() => {
    setParks(initialParks || [])
  }, [initialParks])

  const loadNeighborhoods = async () => {
    try {
      const response = await parkService.getNeighborhoods()
      setNeighborhoods(response.neighborhoods || [])
    } catch (error) {
      console.error("Error loading neighborhoods:", error)
    }
  }

  const handleSearch = async () => {
    try {
      setLoading(true)
      const filters = {}
      
      if (selectedNeighborhood !== "all") {
        filters.neighborhood = selectedNeighborhood
      }
      
      if (searchTerm) {
        filters.search = searchTerm
      }
      
      const response = await parkService.getParks(filters)
      setParks(response.parks || [])
    } catch (error) {
      toast({
        title: "Error al buscar",
        description: "No se pudieron filtrar los parques",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      handleSearch()
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm, selectedNeighborhood])

  const handleVisitRegistered = () => {
    if (onRefresh) onRefresh()
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar parque por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-12 text-base pl-10"
            disabled={loading}
          />
        </div>
        
        <Select onValueChange={setSelectedNeighborhood} defaultValue="all" disabled={loading}>
          <SelectTrigger className="h-12 text-base">
            <MapPin className="h-5 w-5 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Filtrar por barrio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los barrios</SelectItem>
            {neighborhoods.map((neighborhood) => (
              <SelectItem key={neighborhood} value={neighborhood} className="text-base capitalize">
                {neighborhood}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <p className="text-xl text-muted-foreground">Buscando...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {parks.map((park) => (
              <ParkCard 
                key={park.id} 
                park={park} 
                onVisitRegistered={handleVisitRegistered}
              />
            ))}
          </div>
          
          {parks.length === 0 && (
            <div className="text-center py-16 col-span-full">
              <p className="text-xl text-muted-foreground">No se encontraron parques con esos filtros.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
