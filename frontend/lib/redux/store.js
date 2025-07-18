import { configureStore } from "@reduxjs/toolkit"
import userReducer from "./features/userSlice"

// Configuración del store de Redux.
// Combinamos los diferentes 'reducers' (porciones de estado) en un único store.
export const store = configureStore({
  reducer: {
    user: userReducer,
  },
})
