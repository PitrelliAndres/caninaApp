"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { ParkList } from "@/components/parks/park-list"
import { parkService } from "@/lib/api/parks"
import { useToast } from "@/components/ui/use-toast"
import { useTranslation } from 'react-i18next'

// Función para calcular distancia entre dos coordenadas (Haversine)
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371 // km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export default function HomePage() {
  const { t } = useTranslation()
  const [parks, setParks] = useState([])
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState(null)
  const [locationError, setLocationError] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadParks()
    requestLocation()
  }, [])

  const loadParks = async () => {
    try {
      setLoading(true)
      const response = await parkService.getParks()
      setParks(response.parks || [])
    } catch (error) {
      toast({
        title: t('errors.loadingParks'),
        description: t('errors.loadingParksDetail'),
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(true)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
        setLocationError(false)
      },
      (error) => {
        setLocationError(true)
      }
    )
  }

  // Ordenar parques por cercanía si hay ubicación
  const getSortedParks = () => {
    if (!userLocation || !parks.length) return parks
    return [...parks].sort((a, b) => {
      const distA = getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, a.lat, a.lng)
      const distB = getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, b.lat, b.lng)
      return distA - distB
    })
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 p-4 md:p-8 bg-muted/40">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-6">{t('parks.title')}</h1>
          {locationError && (
            <div className="mb-4 flex flex-col items-center">
              <div className="text-sm text-muted-foreground mb-2">{t('errors.locationError')}</div>
              <button
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/80 transition"
                onClick={requestLocation}
              >
                {t('parks.viewNearbyParks')}
              </button>
            </div>
          )}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-lg text-muted-foreground">{t('parks.loadingParks')}</div>
            </div>
          ) : (
            <ParkList parks={getSortedParks()} onRefresh={loadParks} />
          )}
        </div>
      </main>
    </div>
  )
}
