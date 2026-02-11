import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AppThemeProvider } from './providers/ThemeProvider'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppThemeProvider>
      <App />
    </AppThemeProvider>
  </StrictMode>,
)
