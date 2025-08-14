/**
 * Hook for specific protected actions (visits, matches, chat, profile)
 * Handles authentication requirements for each feature with context-aware redirects
 */
import { useAuthAction } from './use-auth-action'
import { useAuth } from './use-auth'

export function useProtectedActions() {
  const { executeWithAuth, isAuthenticated, user } = useAuthAction()
  const { requireAuthForAction } = useAuth()

  // Visit-related actions
  const visitActions = {
    registerVisit: (parkId, visitData) => 
      executeWithAuth(
        async () => {
          const { visitService } = await import('@/lib/api/visits')
          return visitService.createVisit({ park_id: parkId, ...visitData })
        },
        { 
          requireOnboarding: true,
          actionName: 'registrar una visita al parque'
        }
      ),

    cancelVisit: (visitId) =>
      executeWithAuth(
        async () => {
          const { visitService } = await import('@/lib/api/visits')
          return visitService.cancelVisit(visitId)
        },
        {
          requireOnboarding: true,
          actionName: 'cancelar visita'
        }
      ),

    checkinVisit: (visitId) =>
      executeWithAuth(
        async () => {
          const { visitService } = await import('@/lib/api/visits')
          return visitService.checkinVisit(visitId)
        },
        {
          requireOnboarding: true,
          actionName: 'hacer check-in en el parque'
        }
      ),

    checkoutVisit: (visitId) =>
      executeWithAuth(
        async () => {
          const { visitService } = await import('@/lib/api/visits')
          return visitService.checkoutVisit(visitId)
        },
        {
          requireOnboarding: true,
          actionName: 'hacer check-out del parque'
        }
      )
  }

  // Match-related actions
  const matchActions = {
    likeUser: (userId) =>
      executeWithAuth(
        async () => {
          const { matchService } = await import('@/lib/api/matches')
          return matchService.createMatch({ target_user_id: userId, action: 'like' })
        },
        {
          requireOnboarding: true,
          actionName: 'dar like a un usuario'
        }
      ),

    passUser: (userId) =>
      executeWithAuth(
        async () => {
          const { matchService } = await import('@/lib/api/matches')
          return matchService.createMatch({ target_user_id: userId, action: 'pass' })
        },
        {
          requireOnboarding: true,
          actionName: 'hacer pass a un usuario'
        }
      ),

    unmatch: (matchId) =>
      executeWithAuth(
        async () => {
          const { matchService } = await import('@/lib/api/matches')
          return matchService.unmatch(matchId)
        },
        {
          requireOnboarding: true,
          actionName: 'deshacer match'
        }
      )
  }

  // Chat-related actions
  const chatActions = {
    sendMessage: (chatId, message) =>
      executeWithAuth(
        async () => {
          const { messageService } = await import('@/lib/api/messages')
          return messageService.sendMessage(chatId, { content: message })
        },
        {
          requireOnboarding: true,
          actionName: 'enviar mensaje'
        }
      ),

    accessChat: (chatId) =>
      executeWithAuth(
        async () => {
          const { messageService } = await import('@/lib/api/messages')
          return messageService.getChatMessages(chatId)
        },
        {
          requireOnboarding: true,
          actionName: 'acceder al chat'
        }
      )
  }

  // Profile-related actions
  const profileActions = {
    updateProfile: (userData) =>
      executeWithAuth(
        async () => {
          const { userService } = await import('@/lib/api/users')
          return userService.updateProfile(user.id, userData)
        },
        {
          requireOnboarding: false, // Allow profile updates during onboarding
          actionName: 'actualizar perfil'
        }
      ),

    updateDog: (dogId, dogData) =>
      executeWithAuth(
        async () => {
          const { userService } = await import('@/lib/api/users')
          return userService.updateDog(dogId, dogData)
        },
        {
          requireOnboarding: false,
          actionName: 'actualizar información del perro'
        }
      ),

    deleteAccount: () =>
      executeWithAuth(
        async () => {
          const { userService } = await import('@/lib/api/users')
          return userService.deleteUser(user.id)
        },
        {
          requireOnboarding: true,
          actionName: 'eliminar cuenta'
        }
      )
  }

  // Quick auth check functions (for UI state)
  const canPerformAction = (actionType) => {
    if (!isAuthenticated) return false
    
    const requiresOnboarding = [
      'visit', 'match', 'chat', 'deleteAccount'
    ]
    
    if (requiresOnboarding.includes(actionType) && !user?.onboarded) {
      return false
    }
    
    return true
  }

  const getAuthPrompt = (actionType) => {
    const prompts = {
      visit: 'Para registrar una visita necesitas estar registrado',
      match: 'Para hacer match necesitas completar tu perfil',
      chat: 'Para chatear necesitas estar registrado y completar tu perfil',
      profile: 'Para editar tu perfil necesitas estar registrado'
    }
    
    return prompts[actionType] || 'Para realizar esta acción necesitas estar registrado'
  }

  // Check auth before showing UI elements
  const requireAuthCheck = (actionType) => {
    return requireAuthForAction(getAuthPrompt(actionType))
  }

  return {
    // Action executors
    visitActions,
    matchActions,
    chatActions,
    profileActions,
    
    // Auth checkers
    canPerformAction,
    getAuthPrompt,
    requireAuthCheck,
    
    // Auth state
    isAuthenticated,
    isOnboarded: user?.onboarded,
    user,
    
    // Quick access to common actions
    registerVisit: visitActions.registerVisit,
    likeUser: matchActions.likeUser,
    sendMessage: chatActions.sendMessage,
    updateProfile: profileActions.updateProfile
  }
}

// Convenience hooks for specific features
export function useVisitActions() {
  const { visitActions, canPerformAction, requireAuthCheck } = useProtectedActions()
  
  return {
    ...visitActions,
    canRegisterVisit: () => canPerformAction('visit'),
    requireVisitAuth: () => requireAuthCheck('visit')
  }
}

export function useMatchActions() {
  const { matchActions, canPerformAction, requireAuthCheck } = useProtectedActions()
  
  return {
    ...matchActions,
    canMatch: () => canPerformAction('match'),
    requireMatchAuth: () => requireAuthCheck('match')
  }
}

export function useChatActions() {
  const { chatActions, canPerformAction, requireAuthCheck } = useProtectedActions()
  
  return {
    ...chatActions,
    canChat: () => canPerformAction('chat'),
    requireChatAuth: () => requireAuthCheck('chat')
  }
}

export function useProfileActions() {
  const { profileActions, canPerformAction, requireAuthCheck } = useProtectedActions()
  
  return {
    ...profileActions,
    canEditProfile: () => canPerformAction('profile'),
    requireProfileAuth: () => requireAuthCheck('profile')
  }
}