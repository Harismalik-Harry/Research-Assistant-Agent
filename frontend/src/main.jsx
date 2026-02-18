import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Toaster } from 'react-hot-toast'
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: '#16161f',
          color: '#f0f0f8',
          border: '1px solid #2a2a3a',
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
        },
        success: { iconTheme: { primary: '#22c55e', secondary: '#16161f' } },
        error: { iconTheme: { primary: '#ef4444', secondary: '#16161f' } },
      }}
    />
  </React.StrictMode>
)
