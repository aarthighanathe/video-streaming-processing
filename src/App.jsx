// App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import Toast from './components/Toast'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import Library from './pages/Library'
import VideoPlayer from './pages/VideoPlayer'
import Admin from './pages/Admin'
import NotFound from './pages/NotFound'

function App() {
  const { user } = useAuth()

  return (
    <BrowserRouter>
      {/* Global toast notification renderer */}
      <Toast />

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} />} />

        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Navbar />
            <Dashboard />
          </ProtectedRoute>
        } />

        <Route path="/upload" element={
          <ProtectedRoute roles={['editor', 'admin']}>
            <Navbar />
            <Upload />
          </ProtectedRoute>
        } />

        <Route path="/library" element={
          <ProtectedRoute>
            <Navbar />
            <Library />
          </ProtectedRoute>
        } />

        <Route path="/video/:id" element={
          <ProtectedRoute>
            <Navbar />
            <VideoPlayer />
          </ProtectedRoute>
        } />

        <Route path="/admin" element={
          <ProtectedRoute roles={['admin']}>
            <Navbar />
            <Admin />
          </ProtectedRoute>
        } />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App