"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { onboardingService } from "@/lib/api/onboarding"
import { CheckCircle, XCircle } from "lucide-react"

export default function UserStep({ user, onNext }) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({ nickname: "", age: "", avatar: null })
  const [checkingNickname, setCheckingNickname] = useState(false)
  const [nicknameAvailable, setNicknameAvailable] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    
    if (name === "nickname") {
      setNicknameAvailable(null)
    }
  }

  // Verificar nickname con debounce
  useEffect(() => {
    if (!formData.nickname || formData.nickname.length < 3) {
      setNicknameAvailable(null)
      return
    }

    const timeoutId = setTimeout(async () => {
      try {
        setCheckingNickname(true)
        const response = await onboardingService.checkNickname(formData.nickname)
        setNicknameAvailable(response.available)
      } catch (error) {
        console.error("Error checking nickname:", error)
      } finally {
        setCheckingNickname(false)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [formData.nickname])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validar tamaño
    if (file.size > 3 * 1024 * 1024) {
      toast({
        title: "Archivo muy grande",
        description: "La imagen debe ser menor a 3MB",
        variant: "destructive"
      })
      return
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Tipo de archivo inválido",
        description: "Solo se permiten imágenes",
        variant: "destructive"
      })
      return
    }

    // Crear preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result)
      setFormData(prev => ({ ...prev, avatar: reader.result }))
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.nickname || !formData.age) {
      toast({
        title: "Campos requeridos",
        description: "Por favor, completa tu apodo y edad.",
        variant: "destructive",
      })
      return
    }

    if (nicknameAvailable === false) {
      toast({
        title: "Nickname no disponible",
        description: "Por favor, elige otro apodo.",
        variant: "destructive",
      })
      return
    }

    try {
      await onboardingService.submitStep1(formData)
      onNext(formData)
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la información",
        variant: "destructive",
      })
    }
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
            <div className="relative">
              <Input
                id="nickname"
                name="nickname"
                value={formData.nickname}
                onChange={handleChange}
                required
                className="text-lg h-12 pr-10"
              />
              {checkingNickname && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              )}
              {!checkingNickname && nicknameAvailable === true && (
                <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
              )}
              {!checkingNickname && nicknameAvailable === false && (
                <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-red-500" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Este es el nombre que verán otros usuarios.
            </p>
            {nicknameAvailable === false && (
              <p className="text-sm text-red-500">Este apodo ya está en uso</p>
            )}
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
              min="10"
              max="99"
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
              accept="image/*"
              onChange={handleFileChange}
              className="text-base file:text-base file:font-medium file:text-primary file:bg-primary-foreground hover:file:bg-primary/20"
            />
            {previewUrl && (
              <div className="mt-2">
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="w-24 h-24 rounded-full object-cover border"
                />
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            size="lg" 
            className="w-full text-lg py-6"
            disabled={!formData.nickname || !formData.age || nicknameAvailable === false}
          >
            Siguiente
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
