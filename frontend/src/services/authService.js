import { api } from './api'

export const authService = {
  /**
   * Register a new user account
   */
  async register(userData) {
    const res = await api.post('/auth/register', userData)
    return res.data?.user || null
  },

  /**
   * Log in with email and password
   */
  async login(credentials) {
    const res = await api.post('/auth/login', credentials)
    return res.data?.user || null
  },

  /**
   * Authenticate with Google credential (ID Token)
   */
  async loginWithGoogle(credential) {
    const res = await api.post('/auth/google', { credential })
    return res.data?.user || null
  },

  /**
   * Retrieve the currently authenticated user session
   */
  async getMe() {
    const res = await api.get('/auth/me')
    return res.data?.user || null
  },

  /**
   * Log out and clear the HTTP-only cookie
   */
  async logout() {
    const res = await api.post('/auth/logout')
    return res
  },
}

export default authService

