// frontend/app/admin/page.jsx
"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslation } from 'react-i18next'
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { adminService } from "@/lib/api/admin"
import { AdminDashboard } from "@/components/admin/AdminDashboard"
import { AdminUsers } from "@/components/admin/AdminUsers"
import { AdminParks } from "@/components/admin/AdminParks"
import { AdminReports } from "@/components/admin/AdminReports"

export default function AdminPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    // Verificar rol de admin
    if (user && user.role !== 'admin') {
      router.push('/')
      return
    }

    loadDashboardStats()
  }, [user])

  const loadDashboardStats = async () => {
    try {
      setLoading(true)
      const data = await adminService.getDashboardStats()
      setStats(data.stats)
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-lg text-muted-foreground">{t('common.loading')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <Header />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-6">{t('admin.title')}</h1>
          
          <Tabs defaultValue="dashboard" className="space-y-4">
            <TabsList>
              <TabsTrigger value="dashboard">{t('admin.dashboard')}</TabsTrigger>
              <TabsTrigger value="users">{t('admin.users')}</TabsTrigger>
              <TabsTrigger value="parks">{t('admin.parks')}</TabsTrigger>
              <TabsTrigger value="reports">{t('admin.reports')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard">
              <AdminDashboard stats={stats} onRefresh={loadDashboardStats} />
            </TabsContent>
            
            <TabsContent value="users">
              <AdminUsers />
            </TabsContent>
            
            <TabsContent value="parks">
              <AdminParks />
            </TabsContent>
            
            <TabsContent value="reports">
              <AdminReports />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}