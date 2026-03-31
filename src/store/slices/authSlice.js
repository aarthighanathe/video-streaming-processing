// store/slices/authSlice.js
import { createSlice } from '@reduxjs/toolkit'

// ─── Rehydrate user identity from localStorage on page load ───────────────
// We persist only the user object (name, email, role) — NOT the token.
// The accessToken lives in Redux memory only, so it dies on tab close/refresh.
// On refresh the app will hit /auth/refresh (via the axios interceptor) to
// get a new accessToken using the httpOnly refresh cookie automatically.
const persistedUser = (() => {
  try {
    return JSON.parse(localStorage.getItem('user')) || null
  } catch {
    return null
  }
})()

const initialState = {
  user:    persistedUser,
  token:   null,          // accessToken lives in memory only — never localStorage
  loading: false,
  error:   null
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Called after login / register — backend returns accessToken in JSON body,
    // refresh token is set automatically as httpOnly cookie by the browser.
    loginSuccess: (state, action) => {
      state.user    = action.payload.user
      state.token   = action.payload.token   // accessToken in memory only
      state.error   = null
      // Persist only the user identity so the navbar/name survives a refresh.
      // The token itself is intentionally NOT persisted — it would be stale
      // after 15 min anyway, and the refresh flow handles renewal.
      localStorage.setItem('user', JSON.stringify(action.payload.user))
    },

    // Called by the axios 401 interceptor after a successful /auth/refresh call.
    // Only the token needs updating — user object doesn't change.
    setAccessToken: (state, action) => {
      state.token = action.payload.token
      // Also update user in case role changed since last login
      if (action.payload.user) {
        state.user = action.payload.user
        localStorage.setItem('user', JSON.stringify(action.payload.user))
      }
    },

    // Called by logout — clears everything. The axios interceptor also calls
    // POST /api/auth/logout to revoke the refresh cookie server-side.
    logout: (state) => {
      state.user  = null
      state.token = null
      state.error = null
      localStorage.removeItem('user')
    },

    setAuthError: (state, action) => { state.error = action.payload },
    clearAuthError: (state) => { state.error = null }
  }
})

export const {
  loginSuccess,
  setAccessToken,
  logout,
  setAuthError,
  clearAuthError
} = authSlice.actions

export default authSlice.reducer