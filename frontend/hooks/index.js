/**
 * Authentication and protected actions hooks index
 * Centralized exports for easy importing
 */

// Core authentication hooks
export { useAuth } from './use-auth'
export { useAuthAction, useAdminAction, useOnboardedAction } from './use-auth-action'

// Protected actions hooks
export { 
  useProtectedActions,
  useVisitActions,
  useMatchActions,
  useChatActions,
  useProfileActions 
} from './use-protected-actions'

// Public data handling
export { usePublicData, withAuthDataLimiting } from './use-public-data'

// Other existing hooks
export { useToast } from './use-toast'

// Usage examples:
// import { useAuth, useVisitActions, usePublicData } from '@/hooks'
// import { useProtectedActions } from '@/hooks/use-protected-actions' // specific import