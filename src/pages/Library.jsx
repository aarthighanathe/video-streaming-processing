// pages/Library.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchVideos, deleteVideo, setFilter, setSearch, updateVideoTitle } from '../store/slices/videoSlice'
import { useAuth } from '../context/AuthContext'
import AssignModal from '../components/AssignModal'

const StatusBadge = ({ status }) => {
  const map = { safe: 'badge-safe', flagged: 'badge-flagged', processing: 'badge-processing' }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wide ${map[status] || map.processing}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  )
}

const SensitivityScore = ({ score, status }) => {
  if (score == null) return null
  const pct = Math.round(score * 100)
  const color = status === 'flagged' ? '#f87171' : status === 'safe' ? '#34d399' : '#fbbf24'
  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color, opacity: 0.8 }} />
      </div>
      <span className="text-[10px] font-mono shrink-0" style={{ color }}>{pct}% risk</span>
    </div>
  )
}

const EditableTitle = ({ video, canEdit, onSave }) => {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(video.title)

  const commit = () => {
    const t = value.trim()
    if (!t || t === video.title) { setValue(video.title); setEditing(false); return }
    onSave(t); setEditing(false)
  }

  if (!canEdit) return <h3 className="text-sm font-semibold text-white truncate mb-1" title={video.title}>{video.title}</h3>

  return editing ? (
    <input autoFocus value={value}
      onChange={e => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setValue(video.title); setEditing(false) } }}
      className="text-sm font-semibold text-white bg-transparent border-b border-[#7c6ff7]/60 outline-none w-full mb-1 pb-0.5"
    />
  ) : (
    <div className="flex items-center gap-1.5 mb-1 group/title">
      <h3 className="text-sm font-semibold text-white truncate" title={video.title}>{video.title}</h3>
      <button onClick={() => setEditing(true)} className="opacity-0 group-hover/title:opacity-100 transition-opacity text-[#55556a] hover:text-[#7c6ff7]" title="Rename">
        <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}

// ─── Smart thumbnail component ───────────────────────────────────────────────
// Safe      → wraps in <Link>, play icon + hover overlay, "Watch" label appears
// Flagged   → dimmed thumbnail + lock icon, not clickable
// Processing→ dimmed thumbnail + spinner icon, not clickable
const ThumbnailArea = ({ video }) => {
  const dur = (s) => s ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : null
  const duration = dur(video.duration)

  const sharedStyle = {
    background: 'linear-gradient(135deg, rgba(124,111,247,0.08), rgba(90,143,255,0.05))'
  }

  const overlays = (
    <>
      {/* Status badge */}
      <div className="absolute top-3 right-3 z-10">
        <StatusBadge status={video.status} />
      </div>

      {/* Duration */}
      {duration && (
        <div className="absolute bottom-3 right-3 z-10 text-xs font-mono text-[#8888aa] px-2 py-0.5 rounded-md"
          style={{ background: 'rgba(0,0,0,0.55)' }}>
          {duration}
        </div>
      )}
    </>
  )

  // ── SAFE — full clickable thumbnail ──
  if (video.status === 'safe') {
    return (
      <Link
        to={`/video/${video._id}`}
        className="relative h-40 flex items-center justify-center overflow-hidden block"
        style={sharedStyle}
      >
        {video.thumbnailUrl && (
          <img src={video.thumbnailUrl} alt={video.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-105" />
        )}
        {/* Hover darkening overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/40 transition-all duration-200 z-[1]" />

        {/* Play button */}
        <div className="relative z-[2] w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 group-hover/card:scale-110"
          style={{
            background: video.thumbnailUrl ? 'rgba(0,0,0,0.5)' : 'rgba(124,111,247,0.15)',
            border: video.thumbnailUrl ? '1.5px solid rgba(255,255,255,0.3)' : '1px solid rgba(124,111,247,0.3)',
          }}>
          <svg width="16" height="16" viewBox="0 0 14 14"
            fill={video.thumbnailUrl ? 'white' : '#7c6ff7'}
            style={{ marginLeft: 2 }}>
            <polygon points="3,1 13,7 3,13" />
          </svg>
        </div>

        {/* "Watch" label fades in on hover */}
        <span className="absolute bottom-3 left-3 z-[2] text-[10px] font-semibold text-white/0 group-hover/card:text-white/80 uppercase tracking-wider transition-all duration-200">
          Watch
        </span>

        {overlays}
      </Link>
    )
  }

  // ── FLAGGED — dimmed + lock, not clickable ──
  if (video.status === 'flagged') {
    return (
      <div className="relative h-40 flex items-center justify-center overflow-hidden" style={sharedStyle}>
        {video.thumbnailUrl && (
          <img src={video.thumbnailUrl} alt={video.title}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: 0.3 }} />
        )}
        <div className="absolute inset-0 z-[1]" style={{ background: 'rgba(248,113,113,0.08)' }} />
        <div className="relative z-[2] w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.35)' }}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#f87171" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeLinecap="round" />
          </svg>
        </div>
        {overlays}
      </div>
    )
  }

  // ── PROCESSING — dimmed + spinner ──
  return (
    <div className="relative h-40 flex items-center justify-center overflow-hidden" style={sharedStyle}>
      {video.thumbnailUrl && (
        <img src={video.thumbnailUrl} alt={video.title}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.35 }} />
      )}
      <div className="relative z-[2] w-12 h-12 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)' }}>
        <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2.5, borderColor: 'rgba(251,191,36,0.2)', borderTopColor: '#fbbf24' }} />
      </div>
      {overlays}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

const filterOptions = ['all', 'safe', 'flagged', 'processing']

const Library = () => {
  const dispatch = useDispatch()
  const { list, loading, error, filter, search, lastFetchedAt } = useSelector(state => state.videos)
  const { user } = useAuth()
  const [selectedVideo, setSelectedVideo] = useState(null)

  useEffect(() => {
    const isFiltered = filter !== 'all'
    const STALE_MS = 60_000 // refetch if data is older than 60s

    const isStale = !lastFetchedAt || (Date.now() - lastFetchedAt > STALE_MS)

    // Always fetch when: a specific filter is active, list is empty, or data is stale
    if (isFiltered || list.length === 0 || isStale) {
      dispatch(fetchVideos(isFiltered ? filter : null))
    }
  }, [dispatch, filter]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = (id) => {
    if (!window.confirm('Delete this video? This cannot be undone.')) return
    dispatch(deleteVideo({ id, isAdmin: user?.role === 'admin' }))
  }

  const filteredVideos = list.filter(v =>
    v.title.toLowerCase().includes(search.toLowerCase()) ||
    v.uploadedBy?.name?.toLowerCase().includes(search.toLowerCase())
  )

  const fmt = (b) => b < 1048576 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1048576).toFixed(1)} MB`
  const canEdit = user?.role === 'editor' || user?.role === 'admin'
  const titles = { viewer: 'Assigned Videos', admin: 'All Videos', editor: 'My Library' }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8 animate-fade-up">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white" style={{ letterSpacing: '-0.03em' }}>
            {titles[user?.role] || 'Library'}
          </h1>
          <p className="text-sm text-[#8888aa] mt-1">
            {filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''}
            {search && ` matching "${search}"`}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl px-4 py-2.5"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <svg width="15" height="15" fill="none" stroke="#55556a" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
            </svg>
            <input type="text" placeholder="Search videos..."
              value={search} onChange={e => dispatch(setSearch(e.target.value))}
              className="bg-transparent text-sm text-white placeholder-[#55556a] outline-none w-44" />
            {search && <button onClick={() => dispatch(setSearch(''))} className="text-[#55556a] hover:text-white text-xs">✕</button>}
          </div>

          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {filterOptions.map(f => (
              <button key={f} onClick={() => dispatch(setFilter(f))}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 capitalize ${filter === f ? 'bg-[#7c6ff7] text-white shadow-lg shadow-[#7c6ff7]/20' : 'text-[#8888aa] hover:text-white'
                  }`}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/20">
          <svg width="16" height="16" className="text-red-400 shrink-0" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
          <p className="text-sm text-[#55556a]">Loading videos...</p>
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
            <svg width="26" height="26" fill="none" stroke="#55556a" strokeWidth="1.5" viewBox="0 0 24 24">
              {search
                ? <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" /></>
                : <><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" strokeLinecap="round" /></>}
            </svg>
          </div>
          <p className="text-sm text-[#55556a]">
            {search ? `No videos match "${search}"` : user?.role === 'viewer' ? 'No videos assigned to you yet' : 'No videos found'}
          </p>
          {!search && canEdit && (
            <Link to="/upload" className="btn-accent px-5 py-2.5 rounded-xl text-sm font-semibold text-white">Upload video</Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVideos.map((video, i) => (
            // group/card here so ThumbnailArea can use group-hover/card:* classes
            <div key={video._id} className="video-card glass rounded-2xl overflow-hidden group/card"
              style={{ animationDelay: `${i * 0.04}s` }}>

              {/* Thumbnail — handles safe/flagged/processing states internally */}
              <ThumbnailArea video={video} />

              {/* Card body */}
              <div className="p-4">
                <EditableTitle video={video} canEdit={canEdit} onSave={(t) => dispatch(updateVideoTitle({ id: video._id, title: t }))} />

                <div className="flex items-center gap-1.5 text-xs text-[#55556a] mb-1">
                  <span>{fmt(video.size)}</span>
                  <span className="text-[#33334a]">·</span>
                  <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                </div>

                {user?.role === 'admin' && video.uploadedBy && (
                  <p className="text-xs text-[#7c6ff7] mb-1 font-medium">by {video.uploadedBy.name}</p>
                )}

                {video.status !== 'processing' && video.sensitivity?.score != null && (
                  <SensitivityScore score={video.sensitivity.score} status={video.status} />
                )}

                {video.status === 'flagged' && video.sensitivity?.details && (
                  <p className="text-[10px] text-red-400/70 mt-1.5 leading-relaxed line-clamp-2">
                    {video.sensitivity.details}
                  </p>
                )}

                {video.assignedTo?.length > 0 && user?.role !== 'viewer' && (
                  <p className="text-xs text-[#55556a] mt-1.5">
                    Assigned to <span className="text-[#8888aa] font-medium">{video.assignedTo.length}</span> user{video.assignedTo.length !== 1 ? 's' : ''}
                  </p>
                )}

                {/* Action row */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/[0.05]">
                  {video.status === 'safe' && (
                    <Link to={`/video/${video._id}`}
                      className="flex-1 text-center text-xs font-semibold text-white py-2 rounded-lg transition-all duration-200"
                      style={{ background: 'linear-gradient(135deg, #7c6ff7, #6058e8)', boxShadow: '0 4px 12px rgba(124,111,247,0.25)' }}>
                      Watch
                    </Link>
                  )}

                  {video.status === 'flagged' && (
                    <div className="flex-1 flex items-center gap-1.5 px-3 py-2 rounded-lg"
                      style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)' }}>
                      <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="#f87171" strokeWidth="2.5">
                        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" strokeLinecap="round" />
                      </svg>
                      <span className="text-[10px] text-red-400 font-medium">Content flagged</span>
                    </div>
                  )}

                  {video.status === 'processing' && (
                    <div className="flex-1 flex items-center gap-1.5 px-3 py-2 rounded-lg"
                      style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)' }}>
                      <div className="spinner !w-3 !h-3 shrink-0" style={{ borderColor: 'rgba(251,191,36,0.2)', borderTopColor: '#fbbf24' }} />
                      <span className="text-[10px] text-amber-400 font-medium">Processing…</span>
                    </div>
                  )}

                  {canEdit && (
                    <button onClick={() => setSelectedVideo(video)}
                      className="text-xs font-semibold text-[#7c6ff7] py-2 px-3 rounded-lg border border-[#7c6ff7]/30 hover:bg-[#7c6ff7]/10 hover:border-[#7c6ff7]/50 transition-all">
                      Assign
                    </button>
                  )}

                  {canEdit && (
                    <button onClick={() => handleDelete(video._id)}
                      className="p-2 rounded-lg text-[#55556a] border border-white/[0.06] hover:border-red-500/30 hover:text-red-400 hover:bg-red-500/5 transition-all">
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" strokeLinecap="round" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedVideo && (
        <AssignModal video={selectedVideo} onClose={() => setSelectedVideo(null)} onAssigned={() => dispatch(fetchVideos())} />
      )}
    </div>
  )
}

export default Library