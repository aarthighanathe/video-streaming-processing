// components/AssignModal.jsx
import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { assignVideo } from '../store/slices/videoSlice'
import API from '../api/axios'

const AssignModal = ({ video, onClose, onAssigned }) => {
  const [users, setUsers] = useState([])
  const [selected, setSelected] = useState(video.assignedTo?.map(u => u._id || u) || [])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const dispatch = useDispatch()

  useEffect(() => {
    API.get('/api/videos/viewers')
      .then(res => setUsers(res.data))
      .finally(() => setLoading(false))
  }, [])

  const toggle = (id) => setSelected(prev =>
    prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
  )

  const handleSave = async () => {
    setSaving(true)
    const result = await dispatch(assignVideo({ videoId: video._id, userIds: selected }))
    setSaving(false)
    if (assignVideo.fulfilled.match(result)) {
      setMessage('Assigned successfully!')
      onAssigned()
      setTimeout(onClose, 1200)
    } else {
      setMessage('Assignment failed. Please try again.')
    }
  }

  const editors = users.filter(u => u.role === 'editor')
  const viewers = users.filter(u => u.role === 'viewer')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}>
      <div className="glass w-full max-w-md rounded-2xl overflow-hidden animate-fade-up"
        style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div>
            <h3 className="text-base font-bold text-white">Assign Video</h3>
            <p className="text-xs text-[#55556a] mt-0.5 truncate max-w-[260px]">{video.title}</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-[#8888aa] hover:text-white border border-white/[0.07] hover:border-white/[0.15] transition-all">
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="spinner" />
              <p className="text-sm text-[#55556a]">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <span className="text-3xl">👥</span>
              <p className="text-sm text-[#55556a]">No users available</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {editors.length > 0 && (
                <div>
                  <p className="text-[10px] text-[#55556a] uppercase tracking-widest font-semibold mb-2">Editors</p>
                  <div className="flex flex-col gap-1.5">
                    {editors.map(u => (
                      <UserRow key={u._id} user={u} checked={selected.includes(u._id)} onToggle={() => toggle(u._id)}
                        badge={{ label: 'Editor', cls: 'text-amber-400 bg-amber-400/10 border-amber-400/25' }} />
                    ))}
                  </div>
                </div>
              )}
              {viewers.length > 0 && (
                <div>
                  <p className="text-[10px] text-[#55556a] uppercase tracking-widest font-semibold mb-2 mt-1">Viewers</p>
                  <div className="flex flex-col gap-1.5">
                    {viewers.map(u => (
                      <UserRow key={u._id} user={u} checked={selected.includes(u._id)} onToggle={() => toggle(u._id)}
                        badge={{ label: 'Viewer', cls: 'text-[#7c6ff7] bg-[#7c6ff7]/10 border-[#7c6ff7]/25' }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06]"
          style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div>
            {message && (
              <p className={`text-xs font-medium animate-fade-in ${message.includes('success') ? 'text-emerald-400' : 'text-red-400'}`}>
                {message}
              </p>
            )}
            {!message && selected.length > 0 && (
              <p className="text-xs text-[#8888aa]">{selected.length} user{selected.length !== 1 ? 's' : ''} selected</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose}
              className="px-4 py-2 text-sm text-[#8888aa] border border-white/[0.08] hover:border-white/[0.15] hover:text-white rounded-xl transition-all">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving || users.length === 0}
              className="btn-accent px-4 py-2 text-sm font-semibold text-white rounded-xl disabled:opacity-50 flex items-center gap-2">
              {saving && <div className="spinner !w-3.5 !h-3.5" />}
              {saving ? 'Saving...' : `Assign`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const UserRow = ({ user, checked, onToggle, badge }) => (
  <label className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border ${checked
      ? 'border-[#7c6ff7]/30 bg-[#7c6ff7]/8'
      : 'border-white/[0.05] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.04]'
    }`}>
    <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all ${checked ? 'bg-[#7c6ff7] border-[#7c6ff7]' : 'border-white/20'
      }`}>
      {checked && (
        <svg width="9" height="9" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
    <input type="checkbox" checked={checked} onChange={onToggle} className="sr-only" />
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-white">{user.name}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-md border font-semibold ${badge.cls}`}>{badge.label}</span>
      </div>
      <p className="text-xs text-[#55556a] truncate">{user.email}</p>
    </div>
  </label>
)

export default AssignModal