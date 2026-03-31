// pages/Dashboard.jsx
import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchVideos } from '../store/slices/videoSlice'
import { useAuth } from '../context/AuthContext'

const StatusBadge = ({ status }) => {
  const map = {
    safe: 'badge-safe',
    flagged: 'badge-flagged',
    processing: 'badge-processing',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wide ${map[status] || map.processing}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  )
}

// Status-aware icon shown in the left column of each row
const VideoRowIcon = ({ status }) => {
  if (status === 'safe') {
    return (
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="#34d399">
          <polygon points="3,1 13,7 3,13" />
        </svg>
      </div>
    )
  }
  if (status === 'flagged') {
    return (
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#f87171" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round" />
          <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" />
        </svg>
      </div>
    )
  }
  // processing
  return (
    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
      style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
      <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderColor: 'rgba(251,191,36,0.2)', borderTopColor: '#fbbf24' }} />
    </div>
  )
}

const StatCard = ({ label, value, color, delay, icon }) => (
  <div className={`glass rounded-2xl p-5 hover:border-white/[0.12] transition-all duration-300 animate-fade-up-delay-${delay} relative overflow-hidden`}>
    <div className="absolute top-3 right-3 opacity-20">
      {icon}
    </div>
    <div className={`text-4xl font-bold tracking-tight mb-1 ${color}`}
      style={{ fontFamily: 'Syne, sans-serif' }}>{value}</div>
    <div className="text-xs text-[#55556a] font-medium uppercase tracking-widest">{label}</div>
  </div>
)

// Stat icons as SVG so they render in all environments
const icons = {
  total: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" strokeLinecap="round" /></svg>,
  safe: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  flag: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeLinejoin="round" /></svg>,
  proc: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" strokeLinecap="round" /></svg>,
}

const Dashboard = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { list, progress } = useSelector(state => state.videos)
  const { user } = useAuth()

  useEffect(() => { dispatch(fetchVideos()) }, [dispatch])

  const stats = {
    total: list.length,
    safe: list.filter(v => v.status === 'safe').length,
    flagged: list.filter(v => v.status === 'flagged').length,
    processing: list.filter(v => v.status === 'processing').length,
  }

  const activeProgress = Object.values(progress).filter(p => p.progress < 100)

  const roleSubtitle = {
    admin: 'Platform-wide overview — all users',
    viewer: 'Videos assigned to you',
    editor: 'Your video overview',
  }

  const handleRowClick = (video) => {
    if (video.status === 'safe') navigate(`/video/${video._id}`)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">

      {/* Header */}
      <div className="mb-10 animate-fade-up">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-xl bg-[#7c6ff7]/15 border border-[#7c6ff7]/25 flex items-center justify-center">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#7c6ff7" strokeWidth="2">
              <path d="M7 11l5-5 5 5M7 17l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-sm text-[#8888aa] font-medium">{roleSubtitle[user?.role]}</p>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white" style={{ letterSpacing: '-0.03em' }}>
          Welcome back, <span className="gradient-text">{user?.name}</span>
        </h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard label="Total" value={stats.total} color="text-white" delay={1} icon={icons.total} />
        <StatCard label="Safe" value={stats.safe} color="text-emerald-400" delay={2} icon={icons.safe} />
        <StatCard label="Flagged" value={stats.flagged} color="text-red-400" delay={3} icon={icons.flag} />
        <StatCard label="Processing" value={stats.processing} color="text-amber-400" delay={4} icon={icons.proc} />
      </div>

      {/* Live Processing panel */}
      {activeProgress.length > 0 && (
        <div className="glass rounded-2xl p-6 mb-6 animate-fade-up"
          style={{ borderColor: 'rgba(124,111,247,0.2)' }}>
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-2 h-2 rounded-full bg-[#7c6ff7] animate-pulse" />
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[#7c6ff7]">Live Processing</h2>
          </div>
          {activeProgress.map(p => (
            <div key={p.videoId} className="mb-4 last:mb-0">
              <div className="flex justify-between text-xs text-[#8888aa] mb-2">
                <span>{p.message}</span>
                <span className="font-semibold text-white">{p.progress}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="progress-bar h-full rounded-full transition-all duration-500"
                  style={{ width: `${p.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Videos */}
      <div className="glass rounded-2xl overflow-hidden animate-fade-up-delay-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05]">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[#55556a]">
            {user?.role === 'admin' ? 'All Recent Videos' : 'Recent Videos'}
          </h2>
          <Link to="/library"
            className="text-xs text-[#7c6ff7] font-medium hover:text-[#a89cff] transition-colors flex items-center gap-1">
            View all
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
              <svg width="22" height="22" fill="none" stroke="#55556a" strokeWidth="1.5" viewBox="0 0 24 24">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8M12 17v4" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-sm text-[#55556a]">
              {user?.role === 'viewer' ? 'No videos assigned yet'
                : user?.role === 'admin' ? 'No videos on the platform yet'
                  : 'No videos yet'}
            </p>
            {(user?.role === 'editor' || user?.role === 'admin') && (
              <Link to="/upload" className="text-sm text-[#7c6ff7] font-medium hover:underline">
                Upload your first video →
              </Link>
            )}
          </div>
        ) : (
          <div>
            {list.slice(0, 6).map((video) => {
              const isPlayable = video.status === 'safe'
              const RowTag = isPlayable ? Link : 'div'
              const rowProps = isPlayable
                ? { to: `/video/${video._id}` }
                : {}

              return (
                <RowTag
                  key={video._id}
                  {...rowProps}
                  className={`flex items-center justify-between px-6 py-4 border-b border-white/[0.04] last:border-0 transition-all group ${isPlayable
                      ? 'hover:bg-white/[0.03] cursor-pointer'
                      : 'cursor-default'
                    }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Status-aware icon — tells the user at a glance what state the video is in */}
                    <VideoRowIcon status={video.status} />

                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate max-w-[280px] transition-colors ${isPlayable ? 'text-white group-hover:text-[#a89cff]' : 'text-white'
                        }`}>
                        {video.title}
                      </p>
                      <p className="text-xs text-[#55556a] mt-0.5">
                        {(video.size / 1024 / 1024).toFixed(1)} MB
                        {user?.role === 'admin' && video.uploadedBy && (
                          <> · <span className="text-[#7c6ff7]">{video.uploadedBy.name}</span></>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Right side — status + contextual action */}
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <StatusBadge status={video.status} />

                    {/* Only show the watch affordance for safe videos — no dead play icons */}
                    {isPlayable && (
                      <span className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-[#7c6ff7] group-hover:text-white border border-[#7c6ff7]/30 group-hover:border-[#7c6ff7] group-hover:bg-[#7c6ff7] px-3 py-1.5 rounded-lg transition-all duration-200">
                        <svg width="11" height="11" viewBox="0 0 14 14" fill="currentColor">
                          <polygon points="3,1 13,7 3,13" />
                        </svg>
                        Watch
                      </span>
                    )}

                    {/* Flagged — show a subtle reason indicator */}
                    {video.status === 'flagged' && (
                      <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-red-400/70 px-3 py-1.5 rounded-lg border border-red-500/15"
                        style={{ background: 'rgba(248,113,113,0.05)' }}>
                        <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" strokeLinecap="round" />
                        </svg>
                        Flagged
                      </span>
                    )}

                    {/* Processing — subtle spinner label */}
                    {video.status === 'processing' && (
                      <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-amber-400/70 px-3 py-1.5 rounded-lg border border-amber-500/15"
                        style={{ background: 'rgba(251,191,36,0.05)' }}>
                        <div className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5, borderColor: 'rgba(251,191,36,0.2)', borderTopColor: '#fbbf24' }} />
                        Analysing
                      </span>
                    )}
                  </div>
                </RowTag>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard