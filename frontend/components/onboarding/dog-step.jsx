"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { dogBreeds } from "@/lib/dummy-data"

// Paso 2 del Onboarding: Datos del perro.
export default function DogStep({ onNext, onPrevious }) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({ name: "", age: "", breed: "" })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleBreedChange = (value) => {
    setFormData((prev) => ({ ...prev, breed: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name || !formData.age || !formData.breed) {
      toast({
        title: "Campos requeridos",
        description: "Por favor, completa todos los datos de tu perro.",
        variant: "destructive",
      })
      return
    }
    onNext(formData)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Tu mascota</CardTitle>
        <CardDescription>Cuéntanos sobre tu perro. Ayúdanos a conocer a tu compañero peludo.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="dog-name" className="text-lg">
              Nombre de tu perro *
            </Label>
            <Input
              id="dog-name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="text-lg h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dog-age" className="text-lg">
              Edad de tu perro *
            </Label>
            <Input
              id="dog-age"
              name="age"
              type="number"
              value={formData.age}
              onChange={handleChange}
              required
              className="text-lg h-12"
            />
            <p className="text-sm text-muted-foreground">Si es cachorro, puedes poner 0.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dog-breed" className="text-lg">
              Raza *
            </Label>
            <Select onValueChange={handleBreedChange} value={formData.breed}>
              <SelectTrigger className="text-lg h-12">
                <SelectValue placeholder="Selecciona una raza" />
              </SelectTrigger>
              <SelectContent>
                {dogBreeds.map((breed) => (
                  <SelectItem key={breed} value={breed} className="text-lg">
                    {breed}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dog-photo" className="text-lg">
              Foto de tu perro (opcional)
            </Label>
            <Input
              id="dog-photo"
              type="file"
              className="text-base file:text-base file:font-medium file:text-primary file:bg-primary-foreground hover:file:bg-primary/20"
            />
          </div>
        </CardContent>
        <CardFooter className="grid grid-cols-2 gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onPrevious}
            size="lg"
            className="text-lg py-6 bg-transparent"
          >
            Anterior
          </Button>
          <Button type="submit" size="lg" className="text-lg py-6">
            Siguiente
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
