// pages/VideoPlayer.jsx
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import API from '../api/axios'

const VideoPlayer = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const hlsRef = useRef(null)

  const [video, setVideo] = useState(null)
  const [streamData, setStreamData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [streamErr, setStreamErr] = useState(null)
  const [playerReady, setPlayerReady] = useState(false)

  // ── Step 1: fetch video metadata ────────────────────────────────────────
  useEffect(() => {
    API.get(`/api/videos/${id}`)
      .then(res => setVideo(res.data))
      .catch(() => navigate('/library'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  // ── Step 2: fetch signed stream URL from backend ────────────────────────
  useEffect(() => {
    if (!video || video.status !== 'safe') return

    API.get(`/api/videos/${id}/stream`)
      .then(res => {
        console.log('[Stream] Response:', res.data)
        setStreamData(res.data)
      })
      .catch(err => {
        const msg = err.response?.data?.message || 'Failed to load stream'
        console.error('[Stream] Error:', msg)
        setStreamErr(msg)
      })
  }, [video, id])

  // ── Step 3: attach player when streamData arrives ───────────────────────
  useEffect(() => {
    if (!streamData || !videoRef.current) return

    const videoEl = videoRef.current
    const { streamUrl, videoUrl } = streamData

    // Destroy any previous hls instance
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    // Fallback: play raw MP4 directly (when HLS not ready or hls.js missing)
    const tryDirectMp4 = () => {
      const directUrl = videoUrl || streamUrl
      if (!directUrl) {
        setStreamErr('No playable URL available for this video.')
        return
      }
      console.log('[Player] Falling back to direct MP4:', directUrl)
      videoEl.src = directUrl
      videoEl.load()
      videoEl.play().catch(() => { })
      setPlayerReady(true)
    }

    const isHls = streamUrl && streamUrl.includes('.m3u8')

    if (isHls) {
      // Dynamic import — works even if hls.js isn't installed (falls back gracefully)
      import('hls.js')
        .then(({ default: Hls }) => {
          if (Hls.isSupported()) {
            console.log('[Player] hls.js attaching to:', streamUrl)
            const hls = new Hls({
              maxBufferLength: 30,
              maxMaxBufferLength: 60,
              fragLoadingMaxRetry: 3,
              manifestLoadingMaxRetry: 3,
            })

            hls.loadSource(streamUrl)
            hls.attachMedia(videoEl)

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              console.log('[hls.js] Manifest parsed — playing')
              setPlayerReady(true)
              videoEl.play().catch(() => { })
            })

            hls.on(Hls.Events.ERROR, (_, data) => {
              console.warn('[hls.js]', data.type, data.details)
              if (data.fatal) {
                // HLS manifest not ready (eager transcode still running) — fall back to MP4
                console.error('[hls.js] Fatal error — falling back to MP4')
                hls.destroy()
                hlsRef.current = null
                tryDirectMp4()
              }
            })

            hlsRef.current = hls

          } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari — native HLS support
            console.log('[Player] Safari native HLS')
            videoEl.src = streamUrl
            videoEl.play().catch(() => { })
            setPlayerReady(true)
          } else {
            tryDirectMp4()
          }
        })
        .catch(() => {
          // hls.js package not installed
          console.warn('[Player] hls.js not found — falling back to MP4')
          tryDirectMp4()
        })

    } else {
      // streamUrl is a direct MP4 or non-HLS URL
      console.log('[Player] Direct URL:', streamUrl)
      videoEl.src = streamUrl
      videoEl.load()
      videoEl.play().catch(() => { })
      setPlayerReady(true)
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [streamData])

  // ── Loading state ───────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] gap-4">
      <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
      <p className="text-sm text-[#8888aa]">Loading video...</p>
    </div>
  )

  if (!video) return null

  const statusMap = {
    safe: { cls: 'badge-safe', label: 'Safe' },
    flagged: { cls: 'badge-flagged', label: 'Flagged' },
    processing: { cls: 'badge-processing', label: 'Processing' },
  }

  const meta = [
    {
      label: 'Status',
      value: (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wide ${statusMap[video.status]?.cls || statusMap.processing.cls}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
          {video.status}
        </span>
      )
    },
    { label: 'File Size', value: `${(video.size / 1024 / 1024).toFixed(1)} MB` },
    {
      label: 'Duration',
      value: video.duration
        ? `${Math.floor(video.duration / 60)}:${String(Math.floor(video.duration % 60)).padStart(2, '0')}`
        : '—'
    },
    {
      label: 'Uploaded',
      value: new Date(video.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 animate-fade-up">

      <button
        onClick={() => navigate('/library')}
        className="flex items-center gap-2 text-sm text-[#8888aa] hover:text-white border border-white/[0.08] hover:border-white/[0.15] px-4 py-2 rounded-xl mb-8 transition-all duration-200"
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to Library
      </button>

      <div className="glass rounded-2xl overflow-hidden" style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}>

        {/* ── Player area ────────────────────────────────────────────────── */}
        <div className="relative bg-black" style={{ aspectRatio: '16/9' }}>

          {video.status === 'processing' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3, borderColor: 'rgba(251,191,36,0.2)', borderTopColor: '#fbbf24' }} />
              <p className="text-sm text-amber-400">Video is still processing — check back shortly</p>
            </div>
          )}

          {video.status === 'flagged' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <svg width="32" height="32" fill="none" stroke="#f87171" strokeWidth="1.5" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeLinecap="round" />
              </svg>
              <p className="text-sm text-red-400">This video has been flagged and cannot be played</p>
            </div>
          )}

          {video.status === 'safe' && (
            <>
              {/* video element always rendered so hls.js can attach to it */}
              <video
                ref={videoRef}
                controls
                className="w-full h-full object-contain"
                poster={video.thumbnailUrl || undefined}
                style={{ display: streamData ? 'block' : 'none' }}
              >
                Your browser does not support video playback.
              </video>

              {/* Preparing stream */}
              {!streamData && !streamErr && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black">
                  <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
                  <p className="text-sm text-[#8888aa]">Preparing stream...</p>
                </div>
              )}

              {/* Error with retry */}
              {streamErr && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black">
                  <svg width="28" height="28" fill="none" stroke="#f87171" strokeWidth="1.5" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
                  </svg>
                  <p className="text-sm text-red-400 text-center px-6">{streamErr}</p>
                  <button
                    onClick={() => { setStreamErr(null); setStreamData(null) }}
                    className="text-xs text-[#7c6ff7] border border-[#7c6ff7]/30 px-3 py-1.5 rounded-lg hover:bg-[#7c6ff7]/10 transition-all"
                  >
                    Retry
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Details ────────────────────────────────────────────────────── */}
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>
              {video.title}
            </h2>
            <span className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wide ${statusMap[video.status]?.cls || statusMap.processing.cls}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
              {video.status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {meta.map(m => (
              <div key={m.label} className="rounded-xl p-3.5"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-[10px] text-[#55556a] uppercase tracking-widest font-medium mb-1.5">{m.label}</p>
                <div className="text-sm font-semibold text-white">{m.value}</div>
              </div>
            ))}
          </div>

          {video.sensitivity?.details && (
            <div className={`flex items-start gap-3 p-4 rounded-xl text-sm ${video.status === 'safe'
                ? 'bg-emerald-500/8 border border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/8 border border-red-500/20 text-red-400'
              }`}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <p>{video.sensitivity.details}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default VideoPlayer