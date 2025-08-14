import { configureStore } from "@reduxjs/toolkit"
import userReducer from "./features/userSlice"
import chatReducer from "./features/chatSlice"

// Configuración del store de Redux.
// Combinamos los diferentes 'reducers' (porciones de estado) en un único store.
export const store = configureStore({
  reducer: {
    user: userReducer,
    chat: chatReducer,
  },
})
