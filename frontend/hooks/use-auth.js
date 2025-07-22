import { useSelector, useDispatch } from "react-redux"
import { loginWithGoogle, logout, fetchCurrentUser } from "@/lib/redux/features/userSlice"
import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"

export function useAuth() {
  const dispatch = useDispatch()
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoggedIn, loading, error, isNew } = useSelector((state) => state.user)

  // Rutas públicas que no requieren auth
  const publicRoutes = ['/login', '/privacy', '/terms']

  // Verificar token al cargar
  useEffect(() => {
    const token = localStorage.getItem('jwt_token')
    
    // Si no hay token y no estamos en ruta pública, ir a login
    if (!token && !publicRoutes.includes(pathname)) {
      router.push('/login')
      return
    }
    
    // Si hay token pero no estamos logueados, verificar con backend
    if (token && !isLoggedIn && !loading) {
      dispatch(fetchCurrentUser()).catch(() => {
        // Si falla, el token es inválido
        localStorage.removeItem('jwt_token')
        localStorage.removeItem('refresh_token')
        router.push('/login')
      })
    }
  }, [dispatch, isLoggedIn, loading, pathname, router])

  const login = async (googleToken) => {
    try {
      const result = await dispatch(loginWithGoogle(googleToken)).unwrap()
      return result
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const logoutUser = () => {
    dispatch(logout())
    router.push('/login')
  }

  return {
    user,
    isLoggedIn,
    loading,
    error,
    isNew,
    login,
    logout: logoutUser
  }
}