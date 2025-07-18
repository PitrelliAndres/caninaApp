import { Progress } from "@/components/ui/progress"

export default function OnboardingProgress({ currentStep, totalSteps }) {
  const progressValue = (currentStep / totalSteps) * 100
  return (
    <div className="mt-4">
      <p className="text-sm font-medium text-muted-foreground mb-2 text-center">
        Paso {currentStep} de {totalSteps}
      </p>
      <div className="w-full max-w-lg mx-auto">
        <Progress value={progressValue} />
      </div>
    </div>
  )
}
