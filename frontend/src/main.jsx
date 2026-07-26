import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'framer-motion'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'

/*
 * MotionConfig con reducedMotion="user": TODAS las animaciones de framer
 * respetan automáticamente el "menos movimiento" del sistema operativo.
 * (El CSS equivalente vive en index.css.)
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </MotionConfig>
  </StrictMode>,
)

