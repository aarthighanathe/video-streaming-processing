// pages/Login.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import API from '../api/axios'
import { useAuth } from '../context/AuthContext'

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await API.post('/api/auth/login', form)
      login(res.data.user, res.data.accessToken)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(124,111,247,0.08) 0%, transparent 70%)' }} />

      <div className="w-full max-w-md animate-fade-up">
        {/* Logo mark */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative w-14 h-14 flex items-center justify-center mb-4">
            <div className="absolute inset-0 rounded-2xl bg-[#7c6ff7]/15 border border-[#7c6ff7]/30" />
            <div className="absolute inset-0 rounded-2xl" style={{ boxShadow: '0 0 30px rgba(124,111,247,0.2)' }} />
            <svg width="24" height="24" viewBox="0 0 14 14" fill="none">
              <polygon points="3,1 13,7 3,13" fill="#7c6ff7" />
            </svg>
          </div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.75rem', letterSpacing: '-0.04em' }}
            className="text-white mb-1">VideoApp</h1>
          <p className="text-sm text-[#8888aa]">Sign in to your workspace</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8"
          style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)' }}>

          {error && (
            <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/20 animate-fade-in">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-red-400 shrink-0">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#8888aa] uppercase tracking-wider">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
                className="input-field w-full px-4 py-3 rounded-xl text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#8888aa] uppercase tracking-wider">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
                className="input-field w-full px-4 py-3 rounded-xl text-sm"
              />
            </div>

            <button type="submit" disabled={loading}
              className="btn-accent mt-2 w-full py-3.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <div className="spinner !w-4 !h-4" />
                  <span>Signing in...</span>
                </>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/[0.06] text-center">
            <p className="text-sm text-[#8888aa]">
              No account yet?{' '}
              <Link to="/register" className="text-[#7c6ff7] font-medium hover:text-[#a89cff] transition-colors">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login