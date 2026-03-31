// context/SocketContext.jsx — full replacement

import { createContext, useContext, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { io } from 'socket.io-client'
import { updateProgress, updateVideoStatus } from '../store/slices/videoSlice'

const SocketContext = createContext(null)

export const SocketProvider = ({ children }) => {
  const dispatch = useDispatch()
  const { token, user } = useSelector(state => state.auth)
  const socketRef = useRef(null)
  // Keep a ref to the latest token so we can update socket auth without reconnecting
  const tokenRef = useRef(token)

  // Track the latest token in a ref — used by the auth update effect below
  useEffect(() => {
    tokenRef.current = token

    // If a socket already exists, update its auth token in place rather than
    // reconnecting. This prevents a full disconnect/reconnect cycle every 15
    // minutes when the access token is silently refreshed by the axios interceptor.
    if (socketRef.current && token) {
      socketRef.current.auth = { token }
      // No need to call disconnect/connect — auth is sent on the next reconnect
      // attempt. For an immediate update on a connected socket, use io.io.opts:
      socketRef.current.io.opts.auth = { token }
    }
  }, [token])

  // Only create/destroy the socket connection when the USER changes (login/logout),
  // NOT when the token rotates. Token rotation is handled by the ref above.
  useEffect(() => {
    if (!token || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
      return
    }

    // If a socket already exists for this user, don't reconnect
    if (socketRef.current?.connected) return

    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
      auth: { token: tokenRef.current },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id)
      // Ensure auth is current on reconnect (token may have rotated during disconnect)
      socket.auth = { token: tokenRef.current }
    })

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message)
    })

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason)
    })

    socket.on('videoProgress', (data) => {
      console.log('[Socket] videoProgress received:', data)  // ← add this
      dispatch(updateProgress(data))
      if (data.progress === 100 && data.status) {
        dispatch(updateVideoStatus({
          videoId: data.videoId,
          status: data.status,
          sensitivity: data.sensitivity
        }))
      }
    })
    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [user?.id]) // ← only reconnect when the actual user changes, not the token

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)