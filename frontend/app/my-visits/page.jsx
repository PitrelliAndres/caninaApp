"use client"

import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { myVisits } from "@/lib/dummy-data"
import { CalendarPlus, Clock, Dog } from "lucide-react"
import Link from "next/link"

// Página "Mis Visitas"
export default function MyVisitsPage() {
  const upcomingVisits = myVisits.filter((v) => new Date(v.date) >= new Date())
  const pastVisits = myVisits.filter((v) => new Date(v.date) < new Date())

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <Header />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold">Mis Visitas</h1>
          <p className="text-lg text-muted-foreground mt-1">Gestiona tus visitas a parques.</p>

          <Tabs defaultValue="upcoming" className="mt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upcoming">Próximas</TabsTrigger>
              <TabsTrigger value="past">Pasadas</TabsTrigger>
              <TabsTrigger value="all">Todas</TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming">
              {upcomingVisits.length > 0 ? (
                <div className="space-y-4 mt-4">
                  {upcomingVisits.map((visit) => (
                    <VisitCard key={visit.id} visit={visit} />
                  ))}
                </div>
              ) : (
                <EmptyState />
              )}
            </TabsContent>
            <TabsContent value="past">
              <div className="space-y-4 mt-4">
                {pastVisits.map((visit) => (
                  <VisitCard key={visit.id} visit={visit} />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="all">
              <div className="space-y-4 mt-4">
                {myVisits.map((visit) => (
                  <VisitCard key={visit.id} visit={visit} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

// Tarjeta para mostrar una visita individual
const VisitCard = ({ visit }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-2xl">{visit.parkName}</CardTitle>
      <CardDescription className="text-base">
        {new Date(visit.date).toLocaleDateString("es-ES", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </CardDescription>
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
    </CardContent>
  </Card>
)

// Estado vacío cuando no hay visitas próximas
const EmptyState = () => (
  <div className="text-center py-16 px-4 border-2 border-dashed rounded-lg mt-6">
    <Dog className="mx-auto h-16 w-16 text-muted-foreground" />
    <h3 className="mt-4 text-xl font-semibold">No tienes visitas próximas</h3>
    <p className="mt-2 text-base text-muted-foreground">
      ¡Registra tu primera visita a un parque para empezar a conectar!
    </p>
    <Button asChild size="lg" className="mt-6">
      <Link href="/home">Explorar parques</Link>
    </Button>
  </div>
)
