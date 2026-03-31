// main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import store from './store/index'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <AuthProvider>
        <SocketProvider>
          <App />
        </SocketProvider>
      </AuthProvider>
    </Provider>
  </StrictMode>
)