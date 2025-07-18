import { createSlice } from "@reduxjs/toolkit"

// Estado inicial para el slice de usuario.
const initialState = {
  isLoggedIn: false,
  name: null,
  email: null,
  isNew: false,
  // Aquí irían más datos del perfil del usuario y del perro.
}

// Un 'slice' de Redux para manejar la autenticación y los datos del usuario.
export const userSlice = createSlice({
  name: "user",
  initialState,
  // Los 'reducers' son funciones que definen cómo cambia el estado.
  reducers: {
    login: (state, action) => {
      state.isLoggedIn = true
      state.name = action.payload.name
      state.email = action.payload.email
      state.isNew = action.payload.isNew
    },
    logout: (state) => {
      state.isLoggedIn = false
      state.name = null
      state.email = null
      state.isNew = false
    },
    // Aquí se podrían añadir más acciones, como 'updateProfile'.
  },
})

// Exportamos las acciones para poder usarlas en los componentes.
export const { login, logout } = userSlice.actions

// Exportamos el reducer para añadirlo al store.
export default userSlice.reducer
