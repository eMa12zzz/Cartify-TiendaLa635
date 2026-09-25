import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'framer-motion'
/*
 * Poppins sale de la propia tienda y no de Google Fonts: pedirla allá le
 * mandaba a Google la dirección IP de cada visita antes de que la persona
 * aceptara nada. Solo el alfabeto latino (trae tildes, ñ, ¿ y ¡) y los cinco
 * pesos que usa el diseño. font-display: swap viene de fábrica.
 */
import '@fontsource/poppins/latin-400.css'
import '@fontsource/poppins/latin-500.css'
import '@fontsource/poppins/latin-600.css'
import '@fontsource/poppins/latin-700.css'
import '@fontsource/poppins/latin-800.css'
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

