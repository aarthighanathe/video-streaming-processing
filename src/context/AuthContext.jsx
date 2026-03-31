// context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { loginSuccess, logout as logoutAction } from '../store/slices/authSlice'
import API from '../api/axios'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch()
  const { user, token } = useSelector(state => state.auth)
  const [loading, setLoading] = useState(true)

  // ─── On mount: try to restore the session via refresh token cookie ─────
  // When the page refreshes, the accessToken (in-memory) is gone.
  // We attempt a silent refresh using the httpOnly cookie that the browser
  // sends automatically. If it succeeds we get a new accessToken and user.
  // If it fails (cookie expired/missing), we stay logged out.
  useEffect(() => {
    const tryRestore = async () => {
      // If we already have a token in Redux (same tab, no refresh), skip
      if (token) {
        setLoading(false)
        return
      }

      // If there's no persisted user either, don't bother hitting the server
      const persistedUser = (() => {
        try { return JSON.parse(localStorage.getItem('user')) }
        catch { return null }
      })()

      if (!persistedUser) {
        setLoading(false)
        return
      }

      try {
        // The browser sends the httpOnly refresh cookie automatically here
        const { data } = await API.post('/api/auth/refresh')
        dispatch(loginSuccess({ user: data.user, token: data.accessToken }))
      } catch {
        // Refresh failed — cookie is expired or revoked. Clear stale user data.
        localStorage.removeItem('user')
        dispatch(logoutAction())
      } finally {
        setLoading(false)
      }
    }

    tryRestore()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Login ─────────────────────────────────────────────────────────────
  // Called by Login.jsx and Register.jsx after a successful API response.
  // Stores the accessToken in Redux (in-memory) and user in localStorage.
  const login = (userData, accessToken) => {
    dispatch(loginSuccess({ user: userData, token: accessToken }))
  }

  // ─── Logout ────────────────────────────────────────────────────────────
  // 1. Calls POST /api/auth/logout — server clears refreshTokenHash in DB
  //    and instructs the browser to delete the httpOnly cookie.
  // 2. Clears Redux state + localStorage regardless of server response,
  //    so the UI always returns to the logged-out state.
  const logout = async () => {
    try {
      // Best-effort — if this fails (network error, already logged out),
      // we still clear local state so the user isn't stuck.
      await API.post('/api/auth/logout')
    } catch (err) {
      // Log but don't block — local logout should always succeed
      console.warn('Server logout failed (continuing with local logout):', err?.response?.status)
    } finally {
      dispatch(logoutAction())
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}