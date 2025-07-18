import { Progress } from "@/components/ui/progress"

// Componente reutilizable para la barra de progreso del onboarding.
export default function OnboardingProgress({ currentStep, totalSteps }) {
  const progressValue = (currentStep / totalSteps) * 100
  return (
    <div className="mt-4">
      <p className="text-sm font-medium text-muted-foreground mb-2">
        Paso {currentStep} de {totalSteps}
      </p>
      <Progress value={progressValue} className="w-full" />
    </div>
  )
}
