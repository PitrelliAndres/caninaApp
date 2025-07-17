"use client"

import { useSelector, useDispatch } from "react-redux"
import { login as loginAction, logout as logoutAction } from "@/lib/redux/features/userSlice"

// Hook personalizado para manejar la lógica de autenticación.
// Esto centraliza la interacción con Redux y facilita su uso en los componentes.
export function useAuth() {
  const user = useSelector((state) => state.user)
  const dispatch = useDispatch()

  const login = () => {
    // Simula la respuesta del login de Google.
    const mockUserData = {
      name: "Ana García",
      email: "ana.garcia@example.com",
      isNew: true, // Cambiar a false para simular un usuario existente.
    }
    dispatch(loginAction(mockUserData))
    return mockUserData
  }

  const logout = () => {
    dispatch(logoutAction())
  }

  return {
    user,
    isLoggedIn: user.isLoggedIn,
    login,
    logout,
  }
}
