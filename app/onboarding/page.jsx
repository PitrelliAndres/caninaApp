"use client"

import { useState } from "react"
import { useSelector } from "react-redux"
import { PawPrint } from "lucide-react"
import UserStep from "@/components/onboarding/user-step"
import DogStep from "@/components/onboarding/dog-step"
import PreferencesStep from "@/components/onboarding/preferences-step"
import OnboardingProgress from "@/components/onboarding/onboarding-progress"
import { useRouter } from "next/navigation"

// Página de Onboarding refactorizada a un flujo de 3 pasos.
export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [onboardingData, setOnboardingData] = useState({
    user: {},
    dog: {},
    preferences: {},
  })

  const userData = useSelector((state) => state.user)

  const handleNext = (currentStepData) => {
    if (step === 1) {
      setOnboardingData((prev) => ({ ...prev, user: currentStepData }))
    } else if (step === 2) {
      setOnboardingData((prev) => ({ ...prev, dog: currentStepData }))
    }
    setStep((prev) => prev + 1)
  }

  const handlePrevious = () => {
    setStep((prev) => prev - 1)
  }

  const handleFinish = (preferencesData) => {
    const finalData = { ...onboardingData, preferences: preferencesData }
    // Aquí se enviarían los datos completos al backend.
    console.log("Onboarding completado:", finalData)
    // Redirigimos a la home.
    router.push("/home")
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg mx-auto">
        <div className="text-center mb-6">
          <PawPrint className="mx-auto h-12 w-12 text-primary mb-2" />
          <h1 className="text-3xl font-bold">Configura tu perfil</h1>
          <OnboardingProgress currentStep={step} totalSteps={3} />
        </div>

        {step === 1 && <UserStep user={userData} onNext={handleNext} />}
        {step === 2 && <DogStep onNext={handleNext} onPrevious={handlePrevious} />}
        {step === 3 && <PreferencesStep onFinish={handleFinish} onPrevious={handlePrevious} />}
      </div>
    </div>
  )
}
