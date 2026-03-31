// components/Toast.jsx
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { removeNotification } from '../store/slices/uiSlice'

const icons = {
  success: (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  error: (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  ),
  info: (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
    </svg>
  ),
}

const styles = {
  success: { bar: 'bg-emerald-500', icon: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', text: 'text-white' },
  error: { bar: 'bg-red-500', icon: 'text-red-400 bg-red-500/10 border-red-500/20', text: 'text-white' },
  info: { bar: 'bg-[#7c6ff7]', icon: 'text-[#7c6ff7] bg-[#7c6ff7]/10 border-[#7c6ff7]/20', text: 'text-white' },
}

const ToastItem = ({ notification }) => {
  const dispatch = useDispatch()
  const s = styles[notification.type] || styles.info

  useEffect(() => {
    const timer = setTimeout(() => dispatch(removeNotification(notification.id)), 3500)
    return () => clearTimeout(timer)
  }, [notification.id])

  return (
    <div
      className="relative flex items-start gap-3 px-4 py-3 rounded-2xl overflow-hidden animate-fade-up"
      style={{
        background: 'rgba(17,17,31,0.95)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(20px)',
        minWidth: '280px',
        maxWidth: '360px',
      }}
    >
      {/* Accent bar on left */}
      <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${s.bar} rounded-l-2xl`} />

      {/* Icon */}
      <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border ${s.icon}`}>
        {icons[notification.type] || icons.info}
      </div>

      {/* Message */}
      <p className={`text-sm font-medium flex-1 pt-0.5 leading-snug ${s.text}`}>
        {notification.message}
      </p>

      {/* Close */}
      <button
        onClick={() => dispatch(removeNotification(notification.id))}
        className="text-[#55556a] hover:text-white transition-colors shrink-0 pt-0.5"
      >
        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
        </svg>
      </button>

      {/* Auto-dismiss progress bar */}
      <div
        className="absolute bottom-0 left-0 h-0.5 rounded-b-2xl"
        style={{
          background: s.bar.replace('bg-', '').includes('[') ? s.bar.replace('bg-', '') : undefined,
          backgroundColor: s.bar === 'bg-emerald-500' ? '#10b981' : s.bar === 'bg-red-500' ? '#ef4444' : '#7c6ff7',
          animation: 'toast-shrink 3.5s linear forwards',
          width: '100%',
          opacity: 0.4,
        }}
      />
    </div>
  )
}

const Toast = () => {
  const notifications = useSelector(state => state.ui.notifications)

  return (
    <>
      <style>{`
        @keyframes toast-shrink {
          from { width: 100%; }
          to   { width: 0%;   }
        }
      `}</style>
      <div
        className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 items-end"
        style={{ pointerEvents: notifications.length ? 'auto' : 'none' }}
      >
        {notifications.map(n => (
          <ToastItem key={n.id} notification={n} />
        ))}
      </div>
    </>
  )
}

export default Toast