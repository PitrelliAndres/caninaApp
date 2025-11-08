import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  // Onboarding state
  onboardingStep: 0,
  onboardingData: {
    name: '',
    birthDate: '',
    breed: '',
    description: '',
    photos: [],
    location: null,
  },
  onboardingCompleted: false,
  
  // Search & filters
  searchFilters: {
    location: null,
    radius: 5, // km
    ageRange: [1, 15], // years
    breeds: [],
    size: null, // 'small', 'medium', 'large'
    activity: null, // 'low', 'medium', 'high'
  },
  
  // Modal states
  modals: {
    parkFilter: false,
    dogProfile: false,
    visitRegistration: false,
    photoViewer: false,
    locationPicker: false,
    settings: false,
  },
  
  // Loading states específicos de UI
  loading: {
    location: false,
    image: false,
    profile: false,
  },
  
  // Tab states
  activeTab: 'discover', // 'discover', 'parks', 'matches', 'chats', 'profile'
  
  // Theme and appearance
  theme: 'system', // 'light', 'dark', 'system'
  language: 'es', // 'es', 'en'
  
  // Notifications & permissions
  permissions: {
    location: null, // 'granted', 'denied', 'undetermined'
    camera: null,
    notifications: null,
  },
  
  // Network state
  isOnline: true,
  networkError: null,
  
  // App state
  appVersion: '1.0.0',
  firstLaunch: true,
  tutorialCompleted: false,
  
  // Photo viewer state
  photoViewer: {
    visible: false,
    photos: [],
    initialIndex: 0,
  },
  
  // Error handling
  errors: {
    global: null,
    network: null,
    permission: null,
  },
  
  // Bottom sheet states
  bottomSheets: {
    dogOptions: false,
    parkActions: false,
    matchActions: false,
  },
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Onboarding actions
    setOnboardingStep: (state, action) => {
      state.onboardingStep = action.payload
    },
    
    updateOnboardingData: (state, action) => {
      state.onboardingData = { ...state.onboardingData, ...action.payload }
    },
    
    completeOnboarding: (state) => {
      state.onboardingCompleted = true
      state.firstLaunch = false
    },
    
    resetOnboarding: (state) => {
      state.onboardingStep = 0
      state.onboardingData = initialState.onboardingData
      state.onboardingCompleted = false
    },
    
    // Search filters
    updateSearchFilters: (state, action) => {
      state.searchFilters = { ...state.searchFilters, ...action.payload }
    },
    
    resetSearchFilters: (state) => {
      state.searchFilters = initialState.searchFilters
    },
    
    // Modal management
    setModal: (state, action) => {
      const { modal, visible } = action.payload
      state.modals[modal] = visible
    },
    
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(modal => {
        state.modals[modal] = false
      })
    },
    
    // Loading states
    setLoading: (state, action) => {
      const { type, loading } = action.payload
      state.loading[type] = loading
    },
    
    // Tab navigation
    setActiveTab: (state, action) => {
      state.activeTab = action.payload
    },
    
    // Theme and language
    setTheme: (state, action) => {
      state.theme = action.payload
    },
    
    setLanguage: (state, action) => {
      state.language = action.payload
    },
    
    // Permissions
    updatePermission: (state, action) => {
      const { permission, status } = action.payload
      state.permissions[permission] = status
    },
    
    // Network state
    setOnlineStatus: (state, action) => {
      state.isOnline = action.payload
    },
    
    setNetworkError: (state, action) => {
      state.networkError = action.payload
    },
    
    // Photo viewer
    openPhotoViewer: (state, action) => {
      const { photos, initialIndex = 0 } = action.payload
      state.photoViewer = {
        visible: true,
        photos,
        initialIndex,
      }
    },
    
    closePhotoViewer: (state) => {
      state.photoViewer = {
        visible: false,
        photos: [],
        initialIndex: 0,
      }
    },
    
    // Error handling
    setError: (state, action) => {
      const { type, error } = action.payload
      state.errors[type] = error
    },
    
    clearError: (state, action) => {
      const type = action.payload
      state.errors[type] = null
    },
    
    clearAllErrors: (state) => {
      state.errors = initialState.errors
    },
    
    // Bottom sheets
    setBottomSheet: (state, action) => {
      const { sheet, visible } = action.payload
      state.bottomSheets[sheet] = visible
    },
    
    closeAllBottomSheets: (state) => {
      Object.keys(state.bottomSheets).forEach(sheet => {
        state.bottomSheets[sheet] = false
      })
    },
    
    // App state
    setTutorialCompleted: (state) => {
      state.tutorialCompleted = true
    },
    
    setFirstLaunch: (state, action) => {
      state.firstLaunch = action.payload
    },
    
    // Reset UI state (logout)
    resetUI: (state) => {
      return {
        ...initialState,
        theme: state.theme,
        language: state.language,
        permissions: state.permissions,
        firstLaunch: false,
      }
    },
  },
})

export const {
  // Onboarding
  setOnboardingStep,
  updateOnboardingData,
  completeOnboarding,
  resetOnboarding,
  
  // Search
  updateSearchFilters,
  resetSearchFilters,
  
  // Modals
  setModal,
  closeAllModals,
  
  // Loading
  setLoading,
  
  // Navigation
  setActiveTab,
  
  // Theme
  setTheme,
  setLanguage,
  
  // Permissions
  updatePermission,
  
  // Network
  setOnlineStatus,
  setNetworkError,
  
  // Photo viewer
  openPhotoViewer,
  closePhotoViewer,
  
  // Errors
  setError,
  clearError,
  clearAllErrors,
  
  // Bottom sheets
  setBottomSheet,
  closeAllBottomSheets,
  
  // App state
  setTutorialCompleted,
  setFirstLaunch,
  resetUI,
} = uiSlice.actions

export default uiSlice.reducer

// Selectors
export const selectOnboardingStep = (state) => state.ui.onboardingStep
export const selectOnboardingData = (state) => state.ui.onboardingData
export const selectOnboardingCompleted = (state) => state.ui.onboardingCompleted

export const selectSearchFilters = (state) => state.ui.searchFilters

export const selectModal = (state) => (modal) => state.ui.modals[modal] || false
export const selectAnyModalOpen = (state) => Object.values(state.ui.modals).some(visible => visible)

export const selectLoading = (state) => (type) => state.ui.loading[type] || false
export const selectAnyLoading = (state) => Object.values(state.ui.loading).some(loading => loading)

export const selectActiveTab = (state) => state.ui.activeTab

export const selectTheme = (state) => state.ui.theme
export const selectLanguage = (state) => state.ui.language

export const selectPermission = (state) => (permission) => state.ui.permissions[permission]
export const selectAllPermissionsGranted = (state) => 
  Object.values(state.ui.permissions).every(status => status === 'granted')

export const selectIsOnline = (state) => state.ui.isOnline
export const selectNetworkError = (state) => state.ui.networkError

export const selectPhotoViewer = (state) => state.ui.photoViewer

export const selectError = (state) => (type) => state.ui.errors[type]
export const selectHasErrors = (state) => Object.values(state.ui.errors).some(error => error !== null)

export const selectBottomSheet = (state) => (sheet) => state.ui.bottomSheets[sheet] || false
export const selectAnyBottomSheetOpen = (state) => Object.values(state.ui.bottomSheets).some(visible => visible)

export const selectFirstLaunch = (state) => state.ui.firstLaunch
export const selectTutorialCompleted = (state) => state.ui.tutorialCompleted
