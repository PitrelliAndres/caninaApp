"use client"

import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import { PawPrint } from "lucide-react"
import UserStep from "@/components/onboarding/user-step"
import DogStep from "@/components/onboarding/dog-step"
import PreferencesStep from "@/components/onboarding/preferences-step"
import OnboardingProgress from "@/components/onboarding/onboarding-progress"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { onboardingService } from "@/lib/api/onboarding"
import { useToast } from "@/components/ui/use-toast"

export default function OnboardingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  
  // Estado local para mantener datos entre pasos
  const [onboardingData, setOnboardingData] = useState(() => {
    // Intentar recuperar datos del sessionStorage
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('onboardingData')
      if (saved) {
        return JSON.parse(saved)
      }
    }
    return {
      user: {
        nickname: '',
        age: '',
        avatar: null
      },
      dog: {
        name: '',
        age: '',
        breed: '',
        avatar: null
      },
      preferences: {
        isPublic: true,
        allowMatching: true,
        allowProximity: false,
        selectedInterests: []
      }
    }
  })

  // Guardar en sessionStorage cada vez que cambie
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('onboardingData', JSON.stringify(onboardingData))
    }
  }, [onboardingData])

  const handleNext = async (currentStepData) => {
    try {
      if (step === 1) {
        setOnboardingData(prev => ({ ...prev, user: currentStepData }))
        // Enviar step1 al backend
        await onboardingService.submitStep1(currentStepData)
      } else if (step === 2) {
        setOnboardingData(prev => ({ ...prev, dog: currentStepData }))
        // Enviar step2 al backend
        await onboardingService.submitStep2({ dog: currentStepData })
      }
      setStep(prev => prev + 1)
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la información",
        variant: "destructive"
      })
    }
  }

  const handlePrevious = () => {
    setStep(prev => prev - 1)
  }

  const handleFinish = async (preferencesData) => {
    try {
      setSubmitting(true)
      setOnboardingData(prev => ({ ...prev, preferences: preferencesData }))
      
      // Enviar step3 final
      await onboardingService.submitStep3({
        privacy: {
          public_profile: preferencesData.isPublic,
          enable_match: preferencesData.allowMatching,
          enable_proximity: preferencesData.allowProximity
        },
        interests: preferencesData.selectedInterests
      })
      
      // Limpiar sessionStorage
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('onboardingData')
      }
      
      toast({
        title: "¡Bienvenido a ParkDog!",
        description: "Tu perfil ha sido creado exitosamente",
      })
      
      // Redirigir a home
      router.push("/home")
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "No se pudo completar el registro",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-4 bg-blue-100 rounded-full mb-6">
            <PawPrint className="h-16 w-16 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold">Configura tu perfil</h1>
          <OnboardingProgress currentStep={step} totalSteps={3} />
        </div>

        {step === 1 && (
          <UserStep 
            user={user} 
            initialData={onboardingData.user}
            onNext={handleNext} 
          />
        )}
        {step === 2 && (
          <DogStep 
            initialData={onboardingData.dog}
            onNext={handleNext} 
            onPrevious={handlePrevious} 
          />
        )}
        {step === 3 && (
          <PreferencesStep 
            initialData={onboardingData.preferences}
            onFinish={handleFinish} 
            onPrevious={handlePrevious}
            isSubmitting={submitting}
          />
        )}
      </div>
    </div>
  )
}