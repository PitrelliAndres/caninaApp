"use client"

import { Provider } from "react-redux"
import { store } from "./store"

// Componente proveedor de Redux.
// Envuelve la aplicación para que todos los componentes hijos
// puedan acceder al estado global de Redux.
export function ReduxProvider({ children }) {
  return <Provider store={store}>{children}</Provider>
}
