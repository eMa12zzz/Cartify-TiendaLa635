import { defineConfig } from 'vite' // defineConfig ayuda a tener autocompletado y validación de configuración.
import react from '@vitejs/plugin-react' // Plugin oficial para React, soporta JSX y Fast Refresh.
import tailwindcss from '@tailwindcss/vite' // Plugin de Tailwind CSS para integrar estilos de utilidad.

// https://vite.dev/config/ - documentación oficial de configuración.
export default defineConfig({
  /*
   * Escucha en TODA la red local, no solo en localhost.
   *
   * Los correos llevan enlaces a la tienda, y esos correos se abren en el
   * teléfono. Con Vite atado a localhost, "localhost:5173" en el teléfono
   * apunta al propio teléfono y el enlace no lleva a ningún lado. Con host
   * abierto, el teléfono en el mismo wifi entra por la IP de esta máquina —
   * la misma que va en TIENDA_URL del backend.
   */
  server: { host: true },
  plugins: [
    react(), // Activa el soporte React en Vite.
    tailwindcss() // Activa el procesamiento de Tailwind CSS.
  ],
})