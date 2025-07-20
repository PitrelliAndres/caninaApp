import { useSelector, useDispatch } from "react-redux"
import { loginWithGoogle, logout, fetchCurrentUser } from "@/lib/redux/features/userSlice"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function useAuth() {
  const dispatch = useDispatch()
  const router = useRouter()
  const { user, isLoggedIn, loading, error, isNew } = useSelector((state) => state.user)

  // Verificar token al cargar
  useEffect(() => {
    const token = localStorage.getItem('jwt_token')
    if (token && !isLoggedIn) {
      dispatch(fetchCurrentUser())
    }
  }, [dispatch, isLoggedIn])

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
    router.push('/')
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
