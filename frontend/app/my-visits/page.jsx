"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarPlus, Clock, Dog, Trash2 } from "lucide-react"
import Link from "next/link"
import { visitService } from "@/lib/api/visits"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function MyVisitsPage() {
  const [visits, setVisits] = useState({ upcoming: [], past: [], all: [] })
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadVisits()
  }, [])

  const loadVisits = async () => {
    try {
      setLoading(true)
      const [upcoming, past, all] = await Promise.all([
        visitService.getMyVisits('upcoming'),
        visitService.getMyVisits('past'),
        visitService.getMyVisits('all')
      ])
      
      setVisits({
        upcoming: upcoming.visits || [],
        past: past.visits || [],
        all: all.visits || []
      })
    } catch (error) {
      toast({
        title: "Error al cargar visitas",
        description: "No se pudieron cargar tus visitas",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancelVisit = async () => {
    if (!cancellingId) return
    
    try {
      await visitService.cancelVisit(cancellingId)
      toast({
        title: "Visita cancelada",
        description: "La visita ha sido cancelada exitosamente"
      })
      loadVisits()
    } catch (error) {
      toast({
        title: "Error al cancelar",
        description: error.message || "No se pudo cancelar la visita",
        variant: "destructive"
      })
    } finally {
      setCancellingId(null)
      setShowCancelDialog(false)
    }
  }

  const openCancelDialog = (visitId) => {
    setCancellingId(visitId)
    setShowCancelDialog(true)
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <Header />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold">Mis Visitas</h1>
          <p className="text-lg text-muted-foreground mt-1">Gestiona tus visitas a parques.</p>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-lg text-muted-foreground">Cargando visitas...</div>
            </div>
          ) : (
            <Tabs defaultValue="upcoming" className="mt-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="upcoming">Próximas ({visits.upcoming.length})</TabsTrigger>
                <TabsTrigger value="past">Pasadas ({visits.past.length})</TabsTrigger>
                <TabsTrigger value="all">Todas ({visits.all.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upcoming">
                {visits.upcoming.length > 0 ? (
                  <div className="space-y-4 mt-4">
                    {visits.upcoming.map((visit) => (
                      <VisitCard 
                        key={visit.id} 
                        visit={visit} 
                        canCancel
                        onCancel={() => openCancelDialog(visit.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState />
                )}
              </TabsContent>
              
              <TabsContent value="past">
                <div className="space-y-4 mt-4">
                  {visits.past.map((visit) => (
                    <VisitCard key={visit.id} visit={visit} />
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="all">
                <div className="space-y-4 mt-4">
                  {visits.all.map((visit) => (
                    <VisitCard 
                      key={visit.id} 
                      visit={visit} 
                      canCancel={new Date(visit.date) >= new Date()}
                      onCancel={() => openCancelDialog(visit.id)}
                    />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar esta visita?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La visita será cancelada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, mantener</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelVisit}>Sí, cancelar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

const VisitCard = ({ visit, canCancel, onCancel }) => (
  <Card>
    <CardHeader>
      <div className="flex justify-between items-start">
        <div>
          <CardTitle className="text-2xl">{visit.park_name}</CardTitle>
          <CardDescription className="text-base">
            {new Date(visit.date).toLocaleDateString("es-ES", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </CardDescription>
        </div>
        {canCancel && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        )}
      </div>
    </CardHeader>
    <CardContent className="flex items-center gap-6 text-base">
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-muted-foreground" />
        <span>{visit.time}</span>
      </div>
      <div className="flex items-center gap-2">
        <CalendarPlus className="h-5 w-5 text-muted-foreground" />
        <span>{visit.duration}</span>
      </div>
      {visit.notes && (
        <div className="flex-1 text-sm text-muted-foreground">
          {visit.notes}
        </div>
      )}
    </CardContent>
  </Card>
)

const EmptyState = () => (
  <div className="text-center py-16 px-4 border-2 border-dashed rounded-lg mt-6">
    <Dog className="mx-auto h-16 w-16 text-muted-foreground" />
    <h3 className="mt-4 text-xl font-semibold">No tienes visitas próximas</h3>
    <p className="mt-2 text-base text-muted-foreground">
      ¡Registra tu primera visita a un parque para empezar a conectar!
    </p>
    <Button asChild size="lg" className="mt-6">
      <Link href="/">Explorar parques</Link>
    </Button>
  </div>
)
