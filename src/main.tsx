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
            background: '#232340',
            color: '#e2e2f0',
            borderRadius: '8px',
          },
        }}
      />
    </BrowserRouter>
  </StrictMode>,
)
