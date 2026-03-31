// pages/Upload.jsx
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { uploadVideo } from '../store/slices/videoSlice'
import { addNotification } from '../store/slices/uiSlice'

const MAX_SIZE_MB = 100

const Upload = () => {
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStage, setUploadStage] = useState('')
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { error } = useSelector(state => state.videos)

  const fmt = (bytes) =>
    bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(0)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(1)} MB`

  const isOverLimit = file && file.size > MAX_SIZE_MB * 1024 * 1024

  const handleFile = (f) => {
    if (!f) return
    if (!f.type.startsWith('video/')) {
      dispatch(addNotification({ type: 'error', message: 'Please select a video file' }))
      return
    }
    setFile(f)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file || uploading || isOverLimit) return

    setUploading(true)
    setUploadProgress(0)
    setUploadStage('Preparing...')

    const result = await dispatch(uploadVideo({
      file,
      title: title.trim() || file.name,
      onProgress: setUploadProgress,
      onStage: setUploadStage,
    }))

    setUploading(false)
    setUploadStage('')

    if (uploadVideo.fulfilled.match(result)) {
      navigate('/library')
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFile(dropped)
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl animate-fade-up">

        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2" style={{ letterSpacing: '-0.03em' }}>
            Upload Video
          </h1>
          <p className="text-sm text-[#8888aa]">MP4, MKV, AVI, MOV, WEBM · Max {MAX_SIZE_MB} MB</p>
        </div>

        <div className="glass rounded-2xl p-8" style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>

          {error && (
            <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/20 animate-fade-in">
              <svg width="16" height="16" className="text-red-400 shrink-0" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#8888aa] uppercase tracking-wider">
                Title <span className="text-[#33334a] normal-case">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="My awesome video..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                disabled={uploading}
                className="input-field w-full px-4 py-3 rounded-xl text-sm disabled:opacity-50"
              />
            </div>

            {/* Drop zone */}
            <div
              onClick={() => !uploading && fileRef.current.click()}
              onDragOver={e => { e.preventDefault(); if (!uploading) setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center rounded-2xl p-10 transition-all duration-300 ${uploading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                } ${dragging ? 'border-[#7c6ff7] bg-[#7c6ff7]/10'
                  : isOverLimit ? 'border-red-500/40 bg-red-500/5'
                    : file ? 'border-emerald-500/40 bg-emerald-500/5'
                      : 'border-white/[0.1] hover:border-[#7c6ff7]/40 hover:bg-[#7c6ff7]/5'
                }`}
              style={{ border: '2px dashed' }}>

              {file ? (
                <>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                    style={{
                      background: isOverLimit ? 'rgba(248,113,113,0.1)' : 'rgba(52,211,153,0.1)',
                      border: isOverLimit ? '1px solid rgba(248,113,113,0.2)' : '1px solid rgba(52,211,153,0.2)'
                    }}>
                    {isOverLimit ? (
                      <svg width="22" height="22" fill="none" stroke="#f87171" strokeWidth="1.5" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg width="22" height="22" fill="none" stroke="#34d399" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-white mb-1 text-center max-w-xs truncate">{file.name}</p>
                  <p className={`text-xs ${isOverLimit ? 'text-red-400' : 'text-[#8888aa]'}`}>
                    {fmt(file.size)}
                    {isOverLimit && ` — exceeds ${MAX_SIZE_MB} MB limit`}
                  </p>
                  {!uploading && (
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setFile(null); setTitle('') }}
                      className="mt-3 text-xs text-[#55556a] hover:text-red-400 transition-colors">
                      Remove file
                    </button>
                  )}
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: 'rgba(124,111,247,0.1)', border: '1px solid rgba(124,111,247,0.2)' }}>
                    <svg width="22" height="22" fill="none" stroke="#7c6ff7" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-white mb-1">
                    {dragging ? 'Drop it!' : 'Drop video here'}
                  </p>
                  <p className="text-xs text-[#55556a]">or click to browse files</p>
                </>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={e => handleFile(e.target.files[0])}
              />
            </div>

            {/* Upload progress */}
            {uploading && (
              <div className="glass rounded-xl p-4">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-[#8888aa] flex items-center gap-2">
                    <div className="spinner !w-3.5 !h-3.5" />
                    {uploadStage}
                  </span>
                  <span className="font-semibold text-white">{uploadProgress}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="progress-bar h-full rounded-full transition-all duration-500"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                {uploadProgress === 100 && (
                  <p className="text-xs text-[#8888aa] mt-2 text-center animate-fade-in">
                    Upload complete — Cloudinary is processing your video...
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={uploading || !file || isOverLimit}
              className="btn-accent w-full py-3.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {uploading ? (
                <><div className="spinner !w-4 !h-4" /><span>Uploading {uploadProgress}%...</span></>
              ) : (
                <>
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Upload Video
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Upload