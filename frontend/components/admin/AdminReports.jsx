"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from 'react-i18next'

export function AdminReports() {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.reports')}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Reportes - En desarrollo
        </p>
      </CardContent>
    </Card>
  )
}