import { Header } from "@/components/layout/header"
import { ParkList } from "@/components/parks/park-list"
import { parks } from "@/lib/dummy-data"

// Página principal (Home).
// Muestra el encabezado y la lista de parques.
// Es un Server Component, lo que mejora el rendimiento inicial.
export default function HomePage() {
  // Los datos de los parques se obtienen del archivo dummy.
  // En una aplicación real, esto sería una llamada a la API del backend.
  const cabaParks = parks

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 p-4 md:p-8 bg-muted/40">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-6">Parques en CABA</h1>
          {/* El componente ParkList se encarga de renderizar los parques y su interactividad. */}
          <ParkList parks={cabaParks} />
        </div>
      </main>
    </div>
  )
}
