"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from 'react-i18next'

export function AdminParks() {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.parks')}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          {t('admin.parksInDevelopment')}
        </p>
      </CardContent>
    </Card>
  )
}