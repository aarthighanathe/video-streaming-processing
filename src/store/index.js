// store/index.js
import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import videoReducer from './slices/videoSlice'
import uiReducer from './slices/uiSlice'

const store = configureStore({
  reducer: {
    auth: authReducer,
    videos: videoReducer,
    ui: uiReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    })
})

export default store