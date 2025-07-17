"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { interests } from "@/lib/dummy-data"

// Paso 3 del Onboarding: Preferencias de privacidad e intereses.
export default function PreferencesStep({ onFinish, onPrevious }) {
  const [preferences, setPreferences] = useState({
    isPublic: true,
    allowMatching: true,
    allowProximity: false,
    selectedInterests: [],
  })

  const handleSwitchChange = (name, checked) => {
    setPreferences((prev) => ({ ...prev, [name]: checked }))
  }

  const handleInterestChange = (interest, checked) => {
    setPreferences((prev) => {
      const newInterests = checked
        ? [...prev.selectedInterests, interest]
        : prev.selectedInterests.filter((i) => i !== interest)
      return { ...prev, selectedInterests: newInterests }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Preferencias</CardTitle>
        <CardDescription>Personaliza tu experiencia en ParkDog.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Sección de Privacidad */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Privacidad</h3>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="isPublic" className="text-base">
                Perfil público
              </Label>
              <p className="text-sm text-muted-foreground">Otros usuarios pueden ver tu perfil.</p>
            </div>
            <Switch
              id="isPublic"
              checked={preferences.isPublic}
              onCheckedChange={(c) => handleSwitchChange("isPublic", c)}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="allowMatching" className="text-base">
                Permitir matches
              </Label>
              <p className="text-sm text-muted-foreground">Participar en el sistema de matches.</p>
            </div>
            <Switch
              id="allowMatching"
              checked={preferences.allowMatching}
              onCheckedChange={(c) => handleSwitchChange("allowMatching", c)}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="allowProximity" className="text-base">
                Descubrimiento por proximidad
              </Label>
              <p className="text-sm text-muted-foreground">Encontrar usuarios cercanos (tipo Happn).</p>
            </div>
            <Switch
              id="allowProximity"
              checked={preferences.allowProximity}
              onCheckedChange={(c) => handleSwitchChange("allowProximity", c)}
            />
          </div>
        </div>

        {/* Sección de Intereses */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Tus intereses</h3>
          <div className="grid grid-cols-2 gap-4">
            {interests.map((interest) => (
              <div key={interest} className="flex items-center space-x-2">
                <Checkbox id={interest} onCheckedChange={(c) => handleInterestChange(interest, c)} />
                <label
                  htmlFor={interest}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {interest}
                </label>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center pt-4">
          Podrás cambiar estas preferencias en cualquier momento desde tu perfil.
        </p>
      </CardContent>
      <CardFooter className="grid grid-cols-2 gap-4">
        <Button type="button" variant="outline" onClick={onPrevious} size="lg" className="text-lg py-6 bg-transparent">
          Anterior
        </Button>
        <Button onClick={() => onFinish(preferences)} size="lg" className="text-lg py-6">
          Completar
        </Button>
      </CardFooter>
    </Card>
  )
}
