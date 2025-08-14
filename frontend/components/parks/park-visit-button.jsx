/**
 * Example component showing how to use auth-protected visit registration
 * Shows different states based on authentication status
 */
"use client"

import { Button } from "@/components/ui/button"
import { RegisterVisitModal } from "./register-visit-modal"
import { useAuth } from "@/hooks/use-auth"
import { useVisitActions } from "@/hooks/use-protected-actions"
import { CalendarPlus, Lock, UserPlus } from "lucide-react"
import { useTranslation } from 'react-i18next'

export function ParkVisitButton({ parkId, parkName, variant = "default", size = "default" }) {
  const { t } = useTranslation()
  const { isAuthenticated, user, requireAuthForAction } = useAuth()
  const { canRegisterVisit } = useVisitActions()

  // Show different button states based on auth status
  const getButtonContent = () => {
    if (!isAuthenticated) {
      return {
        icon: <Lock className="w-4 h-4 mr-2" />,
        text: t('visits.loginToRegister'),
        onClick: () => requireAuthForAction('registrar una visita al parque'),
        disabled: false
      }
    }

    if (!user?.onboarded) {
      return {
        icon: <UserPlus className="w-4 h-4 mr-2" />,
        text: t('visits.completeProfileToRegister'),
        onClick: () => requireAuthForAction('registrar una visita al parque'),
        disabled: false
      }
    }

    return {
      icon: <CalendarPlus className="w-4 h-4 mr-2" />,
      text: t('visits.registerVisit'),
      onClick: null, // Will be handled by modal
      disabled: false
    }
  }

  const buttonContent = getButtonContent()

  // If user can register visits, wrap in modal
  if (canRegisterVisit()) {
    return (
      <RegisterVisitModal parkId={parkId} parkName={parkName}>
        <Button variant={variant} size={size}>
          {buttonContent.icon}
          {buttonContent.text}
        </Button>
      </RegisterVisitModal>
    )
  }

  // Otherwise, show auth-required button
  return (
    <Button 
      variant={variant} 
      size={size}
      onClick={buttonContent.onClick}
      disabled={buttonContent.disabled}
    >
      {buttonContent.icon}
      {buttonContent.text}
    </Button>
  )
}

// Convenience component for different park card contexts
export function ParkCardVisitButton({ park, ...props }) {
  return (
    <ParkVisitButton 
      parkId={park.id} 
      parkName={park.name}
      {...props}
    />
  )
}

// Example of usage in a park detail view
export function ParkDetailVisitButton({ park }) {
  const { isAuthenticated, user } = useAuth()
  
  // Show different messaging based on auth state
  const getHelpText = () => {
    if (!isAuthenticated) {
      return "Inicia sesión para programar tu visita y conocer otros dueños"
    }
    if (!user?.onboarded) {
      return "Completa tu perfil para comenzar a programar visitas"
    }
    return "Programa tu visita y conecta con otros dueños de perros"
  }

  return (
    <div className="space-y-2">
      <ParkVisitButton 
        parkId={park.id} 
        parkName={park.name}
        variant="default"
        size="lg"
      />
      <p className="text-sm text-muted-foreground text-center">
        {getHelpText()}
      </p>
    </div>
  )
}