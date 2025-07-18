"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

// Paso 1 del Onboarding: Datos del usuario.
export default function UserStep({ user, onNext }) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({ nickname: "", age: "" })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.nickname || !formData.age) {
      toast({
        title: "Campos requeridos",
        description: "Por favor, completa tu apodo y edad.",
        variant: "destructive",
      })
      return
    }
    onNext(formData)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Tu perfil</CardTitle>
        <CardDescription>
          Cuéntanos sobre ti. Esta información nos ayudará a encontrar los mejores matches para ti.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-lg">
              Nombre
            </Label>
            <Input id="name" value={user.name} disabled className="text-lg h-12" />
            <p className="text-sm text-muted-foreground">Este nombre viene de tu cuenta de Google.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nickname" className="text-lg">
              Apodo o nombre preferido *
            </Label>
            <Input
              id="nickname"
              name="nickname"
              value={formData.nickname}
              onChange={handleChange}
              required
              className="text-lg h-12"
            />
            <p className="text-sm text-muted-foreground">Este es el nombre que verán otros usuarios.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="age" className="text-lg">
              Edad *
            </Label>
            <Input
              id="age"
              name="age"
              type="number"
              value={formData.age}
              onChange={handleChange}
              required
              className="text-lg h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="photo" className="text-lg">
              Foto de perfil (opcional)
            </Label>
            <Input
              id="photo"
              type="file"
              className="text-base file:text-base file:font-medium file:text-primary file:bg-primary-foreground hover:file:bg-primary/20"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" size="lg" className="w-full text-lg py-6">
            Siguiente
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
