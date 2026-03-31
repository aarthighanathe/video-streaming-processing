// store/slices/videoSlice.js — full file replacement

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import API from '../../api/axios'
import { addNotification } from './uiSlice'

export const fetchVideos = createAsyncThunk(
  'videos/fetchAll',
  async (status = null, { rejectWithValue }) => {
    try {
      const url = status ? `/api/videos?status=${status}` : '/api/videos'
      const res = await API.get(url)
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch videos')
    }
  }
)

export const uploadVideo = createAsyncThunk(
  'videos/upload',
  async ({ file, title, onProgress, onStage }, { dispatch, rejectWithValue }) => {
    try {
      // ── Guard: validate before touching network ────────────────────────
      if (!file) return rejectWithValue('No file selected')
      if (file.size > 100 * 1024 * 1024) {
        return rejectWithValue('File exceeds 100 MB limit')
      }

      // ── Step 1: get Cloudinary signature from our server ───────────────
      onStage?.('Preparing upload...')
      const { data: sig } = await API.get('/api/videos/upload-signature')

      // ── Step 2: upload directly to Cloudinary via XHR ─────────────────
      // We use XHR (not fetch) because it gives us real upload progress events.
      // The file goes browser → Cloudinary CDN directly — never touches our server.
      onStage?.('Uploading to Cloudinary...')

      const cloudinaryRes = await new Promise((resolve, reject) => {
        const form = new FormData()
        form.append('file',          file)
        form.append('api_key',       sig.apiKey)
        form.append('timestamp',     String(sig.timestamp))
        form.append('signature',     sig.signature)
        form.append('folder',        sig.folder)
        form.append('eager',         sig.eager)
        form.append('resource_type', 'video')

        const xhr = new XMLHttpRequest()
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${sig.cloudName}/video/upload`)

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && onProgress) {
            onProgress(Math.round((e.loaded * 100) / e.total))
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText))
            } catch {
              reject(new Error('Invalid response from Cloudinary'))
            }
          } else {
            let errMsg = `Cloudinary upload failed (${xhr.status})`
            try {
              const body = JSON.parse(xhr.responseText)
              if (body.error?.message) errMsg = body.error.message
            } catch { /* ignore parse error */ }
            reject(new Error(errMsg))
          }
        }

        xhr.onerror   = () => reject(new Error('Network error — check your connection'))
        xhr.ontimeout = () => reject(new Error('Upload timed out — try a smaller file'))
        xhr.timeout   = 5 * 60 * 1000  // 5 minute timeout max

        xhr.send(form)
      })

      // ── Validate Cloudinary response has what we need ──────────────────
      if (!cloudinaryRes.public_id || !cloudinaryRes.secure_url) {
        return rejectWithValue('Cloudinary returned an incomplete response')
      }

      // ── Step 3: build thumbnail URL (on-the-fly, always works) ────────
      // c_fill,w_640,h_360 = 16:9 crop, so_5 = poster frame at 5 seconds
      const thumbnailUrl =
        `https://res.cloudinary.com/${sig.cloudName}/video/upload/c_fill,w_640,h_360,so_5/${cloudinaryRes.public_id}.jpg`

      // ── Step 4: save metadata to our server (exactly once) ────────────
      onStage?.('Saving...')
      onProgress?.(100)

      const { data } = await API.post('/api/videos/save', {
        title:        (title || file.name).trim(),
        publicId:     cloudinaryRes.public_id,
        videoUrl:     cloudinaryRes.secure_url,
        thumbnailUrl,
        originalName: file.name,
        mimetype:     file.type || 'video/mp4',
        size:         file.size,
      })

      dispatch(addNotification({ type: 'success', message: 'Video uploaded — processing started' }))
      return data.video

    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Upload failed'
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  }
)

export const deleteVideo = createAsyncThunk(
  'videos/delete',
  async ({ id, isAdmin }, { dispatch, rejectWithValue }) => {
    try {
      if (isAdmin) {
        await API.delete(`/api/admin/videos/${id}`)
      } else {
        await API.delete(`/api/videos/${id}`)
      }
      dispatch(addNotification({ type: 'success', message: 'Video deleted successfully' }))
      return id
    } catch (err) {
      dispatch(addNotification({ type: 'error', message: 'Failed to delete video' }))
      return rejectWithValue(err.response?.data?.message || 'Delete failed')
    }
  }
)

export const assignVideo = createAsyncThunk(
  'videos/assign',
  async ({ videoId, userIds }, { dispatch, rejectWithValue }) => {
    try {
      const res = await API.post(`/api/videos/${videoId}/assign`, { userIds })
      dispatch(addNotification({
        type: 'success',
        message: `Video assigned to ${userIds.length} user${userIds.length !== 1 ? 's' : ''}`
      }))
      return { videoId, userIds, data: res.data }
    } catch (err) {
      dispatch(addNotification({ type: 'error', message: 'Assignment failed' }))
      return rejectWithValue(err.response?.data?.message || 'Assignment failed')
    }
  }
)

export const updateVideoTitle = createAsyncThunk(
  'videos/updateTitle',
  async ({ id, title }, { dispatch, rejectWithValue }) => {
    try {
      const res = await API.patch(`/api/videos/${id}`, { title })
      dispatch(addNotification({ type: 'success', message: 'Title updated' }))
      return res.data.video
    } catch (err) {
      dispatch(addNotification({ type: 'error', message: 'Failed to update title' }))
      return rejectWithValue(err.response?.data?.message || 'Update failed')
    }
  }
)

export const fetchAdminVideos = createAsyncThunk(
  'videos/fetchAdmin',
  async (_, { rejectWithValue }) => {
    try {
      const res = await API.get('/api/admin/videos')
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch videos')
    }
  }
)

const videoSlice = createSlice({
  name: 'videos',
  initialState: {
    list:          [],
    adminList:     [],
    loading:       false,
    error:         null,
    filter:        'all',
    search:        '',
    progress:      {},
    lastFetchedAt: null,
  },
  reducers: {
    setFilter:         (state, action) => { state.filter = action.payload },
    setSearch:         (state, action) => { state.search = action.payload },
    // updateProgress:    (state, action) => {
    //   const data = action.payload
    //   state.progress[data.videoId] = data
    // },
    updateProgress: (state, action) => {
  const data = action.payload
  state.progress[String(data.videoId)] = data  // ← coerce key to string
},
    clearProgress:     (state, action) => { delete state.progress[action.payload] },
    // updateVideoStatus: (state, action) => {
    //   const { videoId, status, sensitivity } = action.payload
    //   const video = state.list.find(v => v._id === videoId)
    //   if (video) {
    //     video.status = status
    //     if (sensitivity) video.sensitivity = sensitivity
    //   }
    // },
    updateVideoStatus: (state, action) => {
  const { videoId, status, sensitivity } = action.payload
  const video = state.list.find(v => String(v._id) === String(videoId))  // ← safe comparison
  if (video) {
    video.status = status
    if (sensitivity) video.sensitivity = sensitivity
  }
},
    clearVideoError:   (state) => { state.error = null },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVideos.pending,   (state) => { state.loading = true; state.error = null })
      .addCase(fetchVideos.fulfilled, (state, action) => {
        state.loading       = false
        state.list          = action.payload
        state.lastFetchedAt = Date.now()
      })
      .addCase(fetchVideos.rejected,  (state, action) => { state.loading = false; state.error = action.payload })

      .addCase(uploadVideo.pending,   (state) => { state.error = null })
      // .addCase(uploadVideo.fulfilled, (state, action) => {
      //   if (action.payload) {
      //     state.list.unshift(action.payload)
      //     state.lastFetchedAt = Date.now()
      //   }
      // })
      .addCase(uploadVideo.fulfilled, (state, action) => {
  if (action.payload) {
    state.list.unshift(action.payload)
    // Don't set lastFetchedAt here — Library's useEffect will see the list
    // as having data but the timestamp as stale (or null), and will refetch
    // the full list from the server, giving you all existing videos.
  }
})
      .addCase(uploadVideo.rejected,  (state, action) => { state.error = action.payload })

      .addCase(deleteVideo.fulfilled, (state, action) => {
        state.list      = state.list.filter(v => v._id !== action.payload)
        state.adminList = state.adminList.filter(v => v._id !== action.payload)
      })

      .addCase(assignVideo.fulfilled, (state, action) => {
        const { videoId, userIds } = action.payload
        const video = state.list.find(v => v._id === videoId)
        if (video) video.assignedTo = userIds
      })

      .addCase(updateVideoTitle.fulfilled, (state, action) => {
        const updated = action.payload
        const idx = state.list.findIndex(v => v._id === updated._id)
        if (idx !== -1) state.list[idx] = { ...state.list[idx], ...updated }
      })

      .addCase(fetchAdminVideos.pending,   (state) => { state.loading = true })
      .addCase(fetchAdminVideos.fulfilled, (state, action) => {
        state.loading   = false
        state.adminList = action.payload
      })
      .addCase(fetchAdminVideos.rejected,  (state, action) => {
        state.loading = false
        state.error   = action.payload
      })
  }
})

export const {
  setFilter, setSearch, updateProgress, clearProgress,
  updateVideoStatus, clearVideoError
} = videoSlice.actions

export default videoSlice.reducer