import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename="/bookcircle">
      <App />
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: '#FFFFFF',
            color: '#2C2416',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(44, 36, 22, 0.1)',
            border: '1px solid #EDEAE4',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#4A6B4A', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#C0392B', secondary: '#fff' },
          },
        }}
      />
    </BrowserRouter>
  </StrictMode>,
)
