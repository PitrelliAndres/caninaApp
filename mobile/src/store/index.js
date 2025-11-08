import { configureStore } from '@reduxjs/toolkit'
import userReducer from './slices/userSlice'
import chatReducer from './slices/chatSlice'
import uiReducer from './slices/uiSlice'

export const store = configureStore({
  reducer: {
    user: userReducer,
    chat: chatReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignorar estas paths para acciones no serializables (como locations)
        ignoredActions: ['ui/updateOnboardingData', 'ui/updateSearchFilters'],
        ignoredActionsPaths: ['payload.location'],
        ignoredPaths: ['ui.onboardingData.location', 'ui.searchFilters.location'],
      },
    }),
})

