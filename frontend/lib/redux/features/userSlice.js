import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { authService } from "@/lib/api/auth"
import { userService } from "@/lib/api/users"

// Async thunks
export const loginWithGoogle = createAsyncThunk(
  'user/loginWithGoogle',
  async (googleToken) => {
    const response = await authService.googleLogin(googleToken)
    return response
  }
)

export const fetchCurrentUser = createAsyncThunk(
  'user/fetchCurrent',
  async () => {
    const response = await authService.getCurrentUser()
    return response
  }
)

export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async ({ userId, data }) => {
    const response = await userService.updateProfile(userId, data)
    return response
  }
)

const initialState = {
  isLoggedIn: false,
  user: null,
  loading: false,
  error: null,
  isNew: false
}

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    logout: (state) => {
      state.isLoggedIn = false
      state.user = null
      state.error = null
      authService.logout()
    },
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginWithGoogle.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.loading = false
        state.isLoggedIn = true
        state.user = action.payload.user
        state.isNew = action.payload.is_new
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
      // Fetch current user
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isLoggedIn = true
        state.user = action.payload
      })
      // Update profile
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        if (state.user) {
          state.user = { ...state.user, ...action.payload }
        }
      })
  }
})

export const { logout, clearError } = userSlice.actions
export default userSlice.reducer
