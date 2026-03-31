// components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
          <p className="text-sm text-[#8888aa]">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" />

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" />
  }

  return children
}

export default ProtectedRoute