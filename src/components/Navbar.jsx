// components/Navbar.jsx
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', always: true },
    { to: '/library', label: 'Library', always: true },
    { to: '/upload', label: 'Upload', roles: ['editor', 'admin'] },
    { to: '/admin', label: 'Admin', roles: ['admin'] },
  ].filter(l => l.always || l.roles?.includes(user?.role))

  const roleColors = {
    admin: 'text-[#7c6ff7] bg-[#7c6ff7]/10 border-[#7c6ff7]/25',
    editor: 'text-amber-400 bg-amber-400/10 border-amber-400/25',
    viewer: 'text-[#8888aa] bg-white/5 border-white/10',
  }

  return (
    <>
      <nav className="sticky top-0 z-50 h-16 flex items-center justify-between px-6 lg:px-8"
        style={{
          background: 'rgba(12,12,24,0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>

        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="relative w-7 h-7 flex items-center justify-center">
            <div className="absolute inset-0 rounded-lg bg-[#7c6ff7]/20 group-hover:bg-[#7c6ff7]/30 transition-all duration-300" />
            <div className="absolute inset-0 rounded-lg border border-[#7c6ff7]/40 group-hover:border-[#7c6ff7]/70 transition-all duration-300" />
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <polygon points="3,1 13,7 3,13" fill="#7c6ff7" />
            </svg>
          </div>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.03em' }}
            className="text-white group-hover:text-[#a89cff] transition-colors duration-200">
            VideoApp
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <Link key={link.to} to={link.to}
              className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${isActive(link.to)
                  ? 'text-white'
                  : 'text-[#8888aa] hover:text-white hover:bg-white/[0.05]'
                }`}>
              {isActive(link.to) && (
                <span className="absolute inset-0 rounded-xl bg-[#7c6ff7]/10 border border-[#7c6ff7]/20" />
              )}
              <span className="relative">{link.label}</span>
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* User badge */}
          <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium ${roleColors[user?.role] || roleColors.viewer}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
            <span>{user?.name}</span>
            <span className="opacity-50">·</span>
            <span className="capitalize opacity-80">{user?.role}</span>
          </div>

          {/* Logout */}
          <button onClick={handleLogout}
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-[#8888aa] border border-white/[0.08] hover:border-white/[0.15] hover:text-white transition-all duration-200">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Logout
          </button>

          {/* Mobile menu toggle */}
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-white/5 transition-all">
            <span className={`block w-5 h-0.5 bg-[#8888aa] transition-all duration-200 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-5 h-0.5 bg-[#8888aa] transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-[#8888aa] transition-all duration-200 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden fixed top-16 inset-x-0 z-40 animate-fade-in"
          style={{ background: 'rgba(12,12,24,0.97)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex flex-col p-4 gap-1">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive(link.to)
                    ? 'bg-[#7c6ff7]/10 text-white border border-[#7c6ff7]/20'
                    : 'text-[#8888aa] hover:bg-white/5 hover:text-white'
                  }`}>
                {link.label}
              </Link>
            ))}
            <div className="my-2 border-t border-white/[0.06]" />
            <div className={`px-4 py-2 rounded-xl border text-xs font-medium ${roleColors[user?.role] || roleColors.viewer}`}>
              {user?.name} · {user?.role}
            </div>
            <button onClick={handleLogout}
              className="px-4 py-3 rounded-xl text-sm font-medium text-[#8888aa] hover:text-red-400 hover:bg-red-500/5 transition-all text-left">
              Sign out
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default Navbar