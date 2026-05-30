import { defineConfig } from 'vite' // defineConfig ayuda a tener autocompletado y validación de configuración.
import react from '@vitejs/plugin-react' // Plugin oficial para React, soporta JSX y Fast Refresh.
import tailwindcss from '@tailwindcss/vite' // Plugin de Tailwind CSS para integrar estilos de utilidad.

// https://vite.dev/config/ - documentación oficial de configuración.
export default defineConfig({
  plugins: [
    react(), // Activa el soporte React en Vite.
    tailwindcss() // Activa el procesamiento de Tailwind CSS.
  ],
})