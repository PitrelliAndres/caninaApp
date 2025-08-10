"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { userService } from "@/lib/api/users"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useTranslation } from 'react-i18next'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function ProfilePage() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { logout } = useAuth()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [profileData, setProfileData] = useState({
    id: null,
    name: "",
    email: "",
    nickname: "",
    age: "",
    role: "free",
    member_since: "",
    dog: {
      id: null,
      name: "",
      age: "",
      breed: ""
    },
    is_public: true,
    allow_matching: true,
    allow_proximity: false
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const data = await userService.getProfile()
      setProfileData({
        id: data.id,
        name: data.name,
        email: data.email,
        nickname: data.nickname || "",
        age: data.age || "",
        role: data.role,
        member_since: data.member_since,
        dog: data.dog || { name: "", age: "", breed: "" },
        is_public: data.is_public,
        allow_matching: data.allow_matching,
        allow_proximity: data.allow_proximity
      })
    } catch (error) {
      toast({
        title: t('errors.loadingProfile'),
        description: t('errors.loadingProfileDetail'),
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setProfileData((prev) => ({ ...prev, [name]: value }))
  }

  const handleDogInputChange = (e) => {
    const { name, value } = e.target
    setProfileData((prev) => ({ 
      ...prev, 
      dog: { ...prev.dog, [name]: value } 
    }))
  }

  const handlePrivacyChange = (name, checked) => {
    setProfileData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Actualizar usuario
      await userService.updateProfile(profileData.id, {
        nickname: profileData.nickname,
        age: profileData.age,
        is_public: profileData.is_public,
        allow_matching: profileData.allow_matching,
        allow_proximity: profileData.allow_proximity
      })
      
      // Actualizar perro si existe
      if (profileData.dog?.id) {
        await userService.updateDog(profileData.dog.id, {
          name: profileData.dog.name,
          age: profileData.dog.age,
          breed: profileData.dog.breed
        })
      }
      
      setIsEditing(false)
      toast({
        title: t('profile.profileUpdated'),
        description: t('profile.updateSuccess'),
      })
    } catch (error) {
      toast({
        title: t('errors.savingProfile'),
        description: error.message || t('errors.savingProfileDetail'),
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      await userService.deleteAccount(profileData.id)
      logout()
      router.push("/login")
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('errors.deleteAccountError'),
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-muted/40">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-lg text-muted-foreground">{t('profile.loadingProfile')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <Header />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl md:text-4xl font-bold">{t('profile.title')}</h1>
            {isEditing ? (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={() => {
                    setIsEditing(false)
                    loadProfile() // Recargar datos originales
                  }}
                  disabled={saving}
                >
                  {t('common.cancel')}
                </Button>
                <Button 
                  size="lg" 
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? t('profile.saving') : t('profile.saveChanges')}
                </Button>
              </div>
            ) : (
              <Button size="lg" onClick={() => setIsEditing(true)}>
                {t('profile.editProfile')}
              </Button>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{t('profile.personalInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6 text-lg">
              <InfoItem label={t('profile.name')} value={profileData.name} isStatic />
              <InfoItem label={t('profile.email')} value={profileData.email} isStatic />
              <EditableItem
                isEditing={isEditing}
                label={t('profile.nickname')}
                name="nickname"
                value={profileData.nickname}
                onChange={handleInputChange}
              />
              <EditableItem
                isEditing={isEditing}
                label={t('profile.age')}
                name="age"
                type="number"
                value={profileData.age}
                onChange={handleInputChange}
              />
              <InfoItem label={t('profile.accountType')} value={profileData.role} isStatic />
              <InfoItem label={t('profile.memberSince')} value={profileData.member_since} isStatic />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{t('profile.myPet')}</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6 text-lg">
              <EditableItem
                isEditing={isEditing}
                label={t('profile.dogName')}
                name="name"
                value={profileData.dog.name}
                onChange={handleDogInputChange}
              />
              <EditableItem
                isEditing={isEditing}
                label={t('profile.dogAge')}
                name="age"
                type="number"
                value={profileData.dog.age}
                onChange={handleDogInputChange}
              />
              <EditableItem
                isEditing={isEditing}
                label={t('profile.breed')}
                name="breed"
                value={profileData.dog.breed}
                onChange={handleDogInputChange}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{t('profile.privacySettings')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <PrivacyItem
                isEditing={isEditing}
                id="is_public"
                label={t('onboarding.step3.publicProfile')}
                description={t('onboarding.step3.publicProfileDesc')}
                checked={profileData.is_public}
                onCheckedChange={(c) => handlePrivacyChange("is_public", c)}
              />
              <PrivacyItem
                isEditing={isEditing}
                id="allow_matching"
                label={t('onboarding.step3.allowMatching')}
                description={t('onboarding.step3.allowMatchingDesc')}
                checked={profileData.allow_matching}
                onCheckedChange={(c) => handlePrivacyChange("allow_matching", c)}
              />
              <PrivacyItem
                isEditing={isEditing}
                id="allow_proximity"
                label={t('onboarding.step3.allowProximity')}
                description={t('onboarding.step3.allowProximityDesc')}
                checked={profileData.allow_proximity}
                onCheckedChange={(c) => handlePrivacyChange("allow_proximity", c)}
              />
            </CardContent>
          </Card>

          <div className="border-t pt-8 space-y-4">
            <Button 
              variant="outline" 
              size="lg"
              onClick={logout}
            >
              {t('auth.logout')}
            </Button>
            
            <Button 
              variant="destructive" 
              size="lg"
              onClick={() => setShowDeleteDialog(true)}
            >
              {t('profile.deleteAccount')}
            </Button>
          </div>
        </div>
      </main>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('profile.deleteAccountConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('profile.deleteAccountWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground"
            >
              {t('profile.deleteAccount')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

const EditableItem = ({ isEditing, label, value, ...props }) => (
  <div className="space-y-1">
    <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
    {isEditing ? (
      <Input className="text-lg h-12" value={value} {...props} />
    ) : (
      <p className="font-semibold h-12 flex items-center">{value || "-"}</p>
    )}
  </div>
)

const InfoItem = ({ label, value }) => (
  <div className="space-y-1">
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
    <p className="font-semibold">{value || "-"}</p>
  </div>
)

const PrivacyItem = ({ isEditing, id, label, description, checked, onCheckedChange }) => (
  <div className="flex items-center justify-between rounded-lg border p-4">
    <div className="space-y-0.5">
      <Label htmlFor={id} className="text-base font-medium">
        {label}
      </Label>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    <Switch 
      id={id} 
      checked={checked} 
      onCheckedChange={onCheckedChange} 
      disabled={!isEditing} 
    />
  </div>
)
