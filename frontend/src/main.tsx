import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: {
          background: '#fff',
          color: '#1E293B',
          border: '1px solid #E2E8F0',
          borderRadius: '10px',
          fontSize: '14px',
          fontFamily: 'DM Sans, sans-serif',
          fontWeight: '500',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          padding: '12px 16px',
        },
        success: {
          iconTheme: { primary: '#10B981', secondary: '#fff' },
        },
        error: {
          iconTheme: { primary: '#EF4444', secondary: '#fff' },
        },
      }}
    />
  </React.StrictMode>
)
