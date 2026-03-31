// pages/Admin.jsx
import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchAdminVideos, deleteVideo } from '../store/slices/videoSlice'
import { addNotification } from '../store/slices/uiSlice'
import API from '../api/axios'

const roleBadgeStyles = {
  admin: 'text-[#7c6ff7] bg-[#7c6ff7]/10 border-[#7c6ff7]/25',
  editor: 'text-amber-400 bg-amber-400/10 border-amber-400/25',
  viewer: 'text-[#8888aa] bg-white/5 border-white/10',
}

const statusMap = {
  safe: 'text-emerald-400 bg-emerald-500/8 border-emerald-500/20',
  flagged: 'text-red-400 bg-red-500/8 border-red-500/20',
  processing: 'text-amber-400 bg-amber-500/8 border-amber-500/20',
}

const Admin = () => {
  const [tab, setTab] = useState('users')
  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [saving, setSaving] = useState(null)
  const dispatch = useDispatch()
  const { adminList: videos, loading: loadingVideos } = useSelector(state => state.videos)

  useEffect(() => {
    API.get('/api/admin/users')
      .then(res => setUsers(res.data))
      .finally(() => setLoadingUsers(false))
  }, [])

  useEffect(() => {
    if (tab === 'videos') dispatch(fetchAdminVideos())
  }, [tab])

  const handleRoleChange = async (userId, newRole, currentRole) => {
    // Warn on demotions — a misclick on the dropdown shouldn't silently demote someone
    if (
      (currentRole === 'admin' && newRole !== 'admin') ||
      (currentRole === 'editor' && newRole === 'viewer')
    ) {
      const confirmed = window.confirm(
        `Change role from "${currentRole}" to "${newRole}"? This will immediately change what the user can access.`
      )
      if (!confirmed) {
        // Reset the select back to the current value by forcing a re-render
        setUsers([...users])
        return
      }
    }

    setSaving(userId)
    try {
      await API.put(`/api/admin/users/${userId}/role`, { role: newRole })
      setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u))
      dispatch(addNotification({ type: 'success', message: 'Role updated successfully' }))
    } catch (err) {
      dispatch(addNotification({ type: 'error', message: err.response?.data?.message || 'Failed to update role' }))
      // Reset select on failure
      setUsers([...users])
    } finally {
      setSaving(null)
    }
  }
  const handleDeleteVideo = (id) => {
    if (!window.confirm('Permanently delete this video?')) return
    dispatch(deleteVideo({ id, isAdmin: true }))
  }

  const fmt = (bytes) => bytes < 1048576
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / 1048576).toFixed(1)} MB`

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    editors: users.filter(u => u.role === 'editor').length,
    viewers: users.filter(u => u.role === 'viewer').length,
  }

  const videoStats = {
    total: videos.length,
    safe: videos.filter(v => v.status === 'safe').length,
    flagged: videos.filter(v => v.status === 'flagged').length,
    processing: videos.filter(v => v.status === 'processing').length,
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">

      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-7 h-7 rounded-xl bg-[#7c6ff7]/10 border border-[#7c6ff7]/20 flex items-center justify-center">
            <svg width="14" height="14" fill="none" stroke="#7c6ff7" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-sm text-[#8888aa]">System Administration</p>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white" style={{ letterSpacing: '-0.03em' }}>
          Admin Panel
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit animate-fade-up"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {[
          { id: 'users', label: 'Users', count: users.length },
          { id: 'videos', label: 'All Videos', count: videos.length },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${tab === t.id ? 'bg-[#7c6ff7] text-white shadow-lg shadow-[#7c6ff7]/20' : 'text-[#8888aa] hover:text-white'
              }`}>
            {t.label}
            {t.count > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${tab === t.id ? 'bg-white/20 text-white' : 'bg-white/5 text-[#55556a]'
                }`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── USERS TAB ── */}
      {tab === 'users' && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 animate-fade-up-delay-1">
            {[
              { label: 'Total Users', value: stats.total, color: 'text-white' },
              { label: 'Admins', value: stats.admins, color: 'text-[#7c6ff7]' },
              { label: 'Editors', value: stats.editors, color: 'text-amber-400' },
              { label: 'Viewers', value: stats.viewers, color: 'text-[#8888aa]' },
            ].map(s => (
              <div key={s.label} className="glass rounded-2xl p-4">
                <div className={`text-3xl font-bold ${s.color}`} style={{ fontFamily: 'Syne, sans-serif' }}>{s.value}</div>
                <div className="text-xs text-[#55556a] uppercase tracking-widest mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="glass rounded-2xl overflow-hidden animate-fade-up-delay-2">
            <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[#55556a]">Users</h2>
              <span className="text-xs text-[#55556a]">{users.length} total</span>
            </div>

            {loadingUsers ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
                <p className="text-sm text-[#55556a]">Loading users...</p>
              </div>
            ) : (
              <>
                <div className="hidden sm:grid grid-cols-4 px-6 py-3 gap-4"
                  style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  {['Name', 'Email', 'Role', 'Joined'].map(h => (
                    <span key={h} className="text-[10px] text-[#55556a] uppercase tracking-widest font-semibold">{h}</span>
                  ))}
                </div>
                {users.map(user => (
                  <div key={user._id}
                    className={`grid grid-cols-2 sm:grid-cols-4 gap-4 items-center px-6 py-4 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.015] transition-all ${saving === user._id ? 'opacity-60' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ background: 'rgba(124,111,247,0.15)', color: '#7c6ff7', border: '1px solid rgba(124,111,247,0.2)' }}>
                        {user.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-white truncate">{user.name}</span>
                    </div>
                    <span className="text-xs text-[#8888aa] truncate">{user.email}</span>
                    <div className="relative">
                      <select value={user.role}
                        // onChange={e => handleRoleChange(user._id, e.target.value)}
                        onChange={e => handleRoleChange(user._id, e.target.value, user.role)}
                        className={`w-full appearance-none px-3 py-1.5 pr-7 rounded-lg text-xs font-semibold border cursor-pointer outline-none transition-all ${roleBadgeStyles[user.role]}`}
                        style={{ background: 'transparent' }}>
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                        <option value="admin">Admin</option>
                      </select>
                      <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <span className="text-xs text-[#55556a]">{new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </>
      )}

      {/* ── VIDEOS TAB ── */}
      {tab === 'videos' && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 animate-fade-up-delay-1">
            {[
              { label: 'Total', value: videoStats.total, color: 'text-white' },
              { label: 'Safe', value: videoStats.safe, color: 'text-emerald-400' },
              { label: 'Flagged', value: videoStats.flagged, color: 'text-red-400' },
              { label: 'Processing', value: videoStats.processing, color: 'text-amber-400' },
            ].map(s => (
              <div key={s.label} className="glass rounded-2xl p-4">
                <div className={`text-3xl font-bold ${s.color}`} style={{ fontFamily: 'Syne, sans-serif' }}>{s.value}</div>
                <div className="text-xs text-[#55556a] uppercase tracking-widest mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="glass rounded-2xl overflow-hidden animate-fade-up-delay-2">
            <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[#55556a]">All Platform Videos</h2>
              <span className="text-xs text-[#55556a]">{videos.length} total</span>
            </div>

            {loadingVideos ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
                <p className="text-sm text-[#55556a]">Loading videos...</p>
              </div>
            ) : videos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <span className="text-3xl">📭</span>
                <p className="text-sm text-[#55556a]">No videos on the platform yet</p>
              </div>
            ) : (
              <>
                <div className="hidden sm:grid px-6 py-3 gap-4"
                  style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr auto', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  {['Title', 'Uploaded By', 'Size', 'Status', ''].map((h, i) => (
                    <span key={i} className="text-[10px] text-[#55556a] uppercase tracking-widest font-semibold">{h}</span>
                  ))}
                </div>
                {videos.map(video => (
                  <div key={video._id}
                    className="grid px-6 py-4 gap-4 items-center border-b border-white/[0.04] last:border-0 hover:bg-white/[0.015] transition-all"
                    style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr auto' }}>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{video.title}</p>
                      <p className="text-xs text-[#55556a] mt-0.5">{new Date(video.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-[#7c6ff7] font-medium truncate">{video.uploadedBy?.name || '—'}</p>
                      <p className="text-[10px] text-[#55556a] truncate">{video.uploadedBy?.email}</p>
                    </div>
                    <span className="text-xs text-[#8888aa]">{fmt(video.size)}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border w-fit ${statusMap[video.status] || statusMap.processing}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                      {video.status}
                    </span>
                    <button onClick={() => handleDeleteVideo(video._id)}
                      className="p-2 rounded-lg text-[#55556a] border border-white/[0.06] hover:border-red-500/30 hover:text-red-400 hover:bg-red-500/5 transition-all">
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default Admin