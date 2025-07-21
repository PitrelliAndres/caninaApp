"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, MapPin, Heart, Calendar } from "lucide-react"
import { useTranslation } from 'react-i18next'

export function AdminDashboard({ stats, onRefresh }) {
  const { t } = useTranslation()

  if (!stats) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">{t('admin.dashboard')}</h2>
        <Button onClick={onRefresh} variant="outline">
          {t('common.refresh')}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats.users?.new_today || 0} nuevos hoy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.visits?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats.visits?.today || 0} hoy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matches</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.matches?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats.matches?.mutual || 0} mutuos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Parques</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.popular_parks?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Parques activos
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}