"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { profileData as initialProfileData } from "@/lib/dummy-data"

// Página de perfil con funcionalidad de edición
export default function ProfilePage() {
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState(initialProfileData)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setProfileData((prev) => ({ ...prev, [name]: value }))
  }

  const handleDogInputChange = (e) => {
    const { name, value } = e.target
    setProfileData((prev) => ({ ...prev, dog: { ...prev.dog, [name]: value } }))
  }

  const handlePrivacyChange = (name, checked) => {
    setProfileData((prev) => ({ ...prev, privacy: { ...prev.privacy, [name]: checked } }))
  }

  const handleSave = () => {
    setIsEditing(false)
    // Aquí se enviaría 'profileData' al backend.
    console.log("Guardando perfil:", profileData)
    toast({
      title: "Perfil actualizado",
      description: "Tus cambios se han guardado correctamente.",
    })
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <Header />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl md:text-4xl font-bold">Mi Perfil</h1>
            {isEditing ? (
              <div className="flex gap-2">
                <Button variant="outline" size="lg" onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
                <Button size="lg" onClick={handleSave}>
                  Guardar Cambios
                </Button>
              </div>
            ) : (
              <Button size="lg" onClick={() => setIsEditing(true)}>
                Editar Perfil
              </Button>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Información Personal</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6 text-lg">
              <InfoItem label="Nombre" value={profileData.name} isStatic />
              <InfoItem label="Email" value={profileData.email} isStatic />
              <EditableItem
                isEditing={isEditing}
                label="Apodo"
                name="nickname"
                value={profileData.nickname}
                onChange={handleInputChange}
              />
              <EditableItem
                isEditing={isEditing}
                label="Edad"
                name="age"
                type="number"
                value={profileData.age}
                onChange={handleInputChange}
              />
              <InfoItem label="Tipo de cuenta" value={profileData.accountType} isStatic />
              <InfoItem label="Miembro desde" value={profileData.memberSince} isStatic />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Mi Mascota</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6 text-lg">
              <EditableItem
                isEditing={isEditing}
                label="Nombre"
                name="name"
                value={profileData.dog.name}
                onChange={handleDogInputChange}
              />
              <EditableItem
                isEditing={isEditing}
                label="Edad"
                name="age"
                type="number"
                value={profileData.dog.age}
                onChange={handleDogInputChange}
              />
              <EditableItem
                isEditing={isEditing}
                label="Raza"
                name="breed"
                value={profileData.dog.breed}
                onChange={handleDogInputChange}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Configuración de Privacidad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <PrivacyItem
                isEditing={isEditing}
                id="isPublic"
                label="Perfil público"
                description="Permitir que otros usuarios vean tu perfil"
                checked={profileData.privacy.isPublic}
                onCheckedChange={(c) => handlePrivacyChange("isPublic", c)}
              />
              <PrivacyItem
                isEditing={isEditing}
                id="allowMatching"
                label="Participar en matches"
                description="Aparecer en las sugerencias de otros usuarios"
                checked={profileData.privacy.allowMatching}
                onCheckedChange={(c) => handlePrivacyChange("allowMatching", c)}
              />
              <PrivacyItem
                isEditing={isEditing}
                id="allowProximity"
                label="Descubrimiento por proximidad"
                description="Permitir que usuarios cercanos te encuentren (tipo Happn)"
                checked={profileData.privacy.allowProximity}
                onCheckedChange={(c) => handlePrivacyChange("allowProximity", c)}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

// Componente para mostrar información estática o un campo de input
const EditableItem = ({ isEditing, label, value, ...props }) => (
  <div className="space-y-1">
    <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
    {isEditing ? (
      <Input className="text-lg h-12" value={value} {...props} />
    ) : (
      <p className="font-semibold h-12 flex items-center">{value}</p>
    )}
  </div>
)

// Componente para información que nunca es editable
const InfoItem = ({ label, value }) => (
  <div className="space-y-1">
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
    <p className="font-semibold">{value}</p>
  </div>
)

// Componente para los items de privacidad con Switch
const PrivacyItem = ({ isEditing, id, label, description, checked, onCheckedChange }) => (
  <div className="flex items-center justify-between rounded-lg border p-4">
    <div className="space-y-0.5">
      <Label htmlFor={id} className="text-base font-medium">
        {label}
      </Label>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={!isEditing} />
  </div>
)
