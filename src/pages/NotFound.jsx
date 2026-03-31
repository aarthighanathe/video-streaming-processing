// pages/NotFound.jsx
import { Link } from 'react-router-dom'

const NotFound = () => (
  <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-4">
    <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
      style={{ background: 'rgba(124,111,247,0.08)', border: '1px solid rgba(124,111,247,0.2)' }}>
      404
    </div>
    <div className="text-center">
      <h1 className="text-3xl font-bold text-white mb-2" style={{ letterSpacing: '-0.03em' }}>Page not found</h1>
      <p className="text-sm text-[#8888aa]">The page you're looking for doesn't exist.</p>
    </div>
    <Link to="/dashboard"
      className="btn-accent px-6 py-3 rounded-xl text-sm font-semibold text-white">
      Back to Dashboard
    </Link>
  </div>
)

export default NotFound