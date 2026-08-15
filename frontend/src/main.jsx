import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'framer-motion'
import './index.css'
import App from './App.jsx'

/*
 * MotionConfig con reducedMotion="user": TODAS las animaciones de framer
 * respetan automáticamente el "menos movimiento" del sistema operativo.
 * (El CSS equivalente vive en index.css.)
 *
 * ThemeProvider (paletas del panel) vive DENTRO de App.jsx, anidado en
 * AjustesProvider — necesita el colorMarca de la tienda para armar la paleta
 * "Mi marca". Ver ThemeContext.jsx.
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </StrictMode>,
)

