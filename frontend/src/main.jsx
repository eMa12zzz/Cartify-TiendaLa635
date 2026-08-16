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
 * AjustesProvider — de ahí salen el nombre, el logo y la portada. Ver
 * "Mi marca". Ver ThemeContext.jsx.
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </StrictMode>,
)

