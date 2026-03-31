// api/axios.js
import axios from 'axios'
import store from '../store'
import { setAccessToken, logout } from '../store/slices/authSlice'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true   // CRITICAL — sends the httpOnly refresh cookie on every request,
  // including the /auth/refresh call. Without this the browser
  // strips the cookie and refresh always returns 401.
})

// ─── Request interceptor ──────────────────────────────────────────────────
// Reads the accessToken from Redux store (in-memory) on every request.
// This replaces the old localStorage.getItem('token') approach.
API.interceptors.request.use((req) => {
  const token = store.getState().auth.token
  if (token) {
    req.headers.Authorization = `Bearer ${token}`
  }
  return req
})

// ─── Response interceptor — silent token refresh ──────────────────────────
// When any request returns 401 (accessToken expired), we:
//   1. Call POST /api/auth/refresh — the browser sends the httpOnly cookie automatically
//   2. Store the new accessToken in Redux via setAccessToken
//   3. Retry the original failed request with the new token
//   4. If refresh itself fails (cookie expired/revoked), log the user out
//
// _isRetry flag prevents infinite loops — if the retried request also gets
// a 401 (e.g. the resource genuinely doesn't exist), we don't retry again.

let isRefreshing = false
let refreshQueue = []   // queued requests waiting for the refresh to complete

// Drains the queue once a refresh attempt resolves.
// All queued requests either get the new token or get rejected together.
const drainQueue = (error, token = null) => {
  refreshQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  )
  refreshQueue = []
}

API.interceptors.response.use(
  // Pass successful responses straight through
  (response) => response,

  async (error) => {
    const original = error.config

    // Only handle 401s that haven't been retried yet.
    // Also skip the /auth/refresh endpoint itself to avoid infinite loops
    // if the refresh token is genuinely expired.
    if (
      error.response?.status !== 401 ||
      original._isRetry ||
      original.url?.includes('/api/auth/refresh')
    ) {
      return Promise.reject(error)
    }

    // If a refresh is already in flight, queue this request and wait
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject })
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`
        return API(original)
      })
    }

    // Mark as retry so a second 401 on the retried request doesn't loop
    original._isRetry = true
    isRefreshing = true

    try {
      // The browser sends the httpOnly refresh cookie automatically here
      // because withCredentials: true is set on the axios instance.
      const { data } = await API.post('/api/auth/refresh')

      // Store the new token in Redux (in-memory)
      store.dispatch(setAccessToken({
        token: data.accessToken,
        user: data.user
      }))

      // Drain the queue — all waiting requests get the new token
      drainQueue(null, data.accessToken)

      // Retry the original request with the new token
      original.headers.Authorization = `Bearer ${data.accessToken}`
      return API(original)

    } catch (refreshError) {
      // Refresh failed — cookie is expired or revoked.
      // Log the user out and send them to login.
      drainQueue(refreshError)
      store.dispatch(logout())

      // Only redirect if we're in a browser context (not SSR)
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }

      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default API