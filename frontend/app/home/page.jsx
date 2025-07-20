"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { ParkList } from "@/components/parks/park-list"
import { parkService } from "@/lib/api/parks"
import { useToast } from "@/components/ui/use-toast"

export default function HomePage() {
  const [parks, setParks] = useState([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadParks()
  }, [])

  const loadParks = async () => {
    try {
      setLoading(true)
      const response = await parkService.getParks()
      setParks(response.parks || [])
    } catch (error) {
      toast({
        title: "Error al cargar parques",
        description: "No se pudieron cargar los parques",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 p-4 md:p-8 bg-muted/40">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-6">Parques en CABA</h1>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-lg text-muted-foreground">Cargando parques...</div>
            </div>
          ) : (
            <ParkList parks={parks} onRefresh={loadParks} />
          )}
        </div>
      </main>
    </div>
  )
}
