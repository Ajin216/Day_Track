/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext(undefined)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Restore authenticated session on initial mount
  useEffect(() => {
    let isMounted = true

    const checkSession = async () => {
      try {
        const currentUser = await authService.getMe()
        if (isMounted) {
          setUser(currentUser)
          setError(null)
        }
      } catch {
        // User is unauthenticated or session expired; keep user as null
        if (isMounted) {
          setUser(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    checkSession()

    return () => {
      isMounted = false
    }
  }, [])

  /**
   * Log in user
   */
  const login = useCallback(async (credentials) => {
    setError(null)
    try {
      const loggedInUser = await authService.login(credentials)
      setUser(loggedInUser)
      return { success: true, user: loggedInUser }
    } catch (err) {
      const msg = err.message || 'Login failed. Please check your credentials.'
      setError(msg)
      throw err
    }
  }, [])

  /**
   * Register new user
   */
  const register = useCallback(async (userData) => {
    setError(null)
    try {
      const newUser = await authService.register(userData)
      setUser(newUser)
      return { success: true, user: newUser }
    } catch (err) {
      const msg = err.message || 'Registration failed. Please check your information.'
      setError(msg)
      throw err
    }
  }, [])

  /**
   * Log in or register with Google credential (ID Token)
   */
  const loginWithGoogle = useCallback(async (credential) => {
    setError(null)
    try {
      const googleUser = await authService.loginWithGoogle(credential)
      setUser(googleUser)
      return { success: true, user: googleUser }
    } catch (err) {
      const msg = err.message || 'Google sign-in failed. Please try again.'
      setError(msg)
      throw err
    }
  }, [])

  /**
   * Log out user
   */
  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch (err) {
      console.warn('Logout API call failed:', err)
    } finally {
      setUser(null)
      setError(null)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      isAuthenticated: Boolean(user),
      login,
      register,
      loginWithGoogle,
      logout,
      clearError,
    }),
    [user, loading, error, login, register, loginWithGoogle, logout, clearError]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext

