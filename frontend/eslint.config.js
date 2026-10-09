import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx,mjs}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    /*
     * Las reglas que trae react-hooks 7 para el React Compiler. La tienda no
     * usa ese compilador; se revisaron los 94 avisos uno por uno (06-10-2026):
     *
     *   - Los que eran fallas de verdad se arreglaron: dependencias que
     *     faltaban, refs escritos durante el pintado, estado que se reiniciaba
     *     un cuadro tarde.
     *   - Estas tres quedan APAGADAS porque solo hablan del compilador:
     *       incompatible-library y preserve-manual-memoization dicen "aquí el
     *       compilador no optimizaría", y set-state-in-effect marca cargar
     *       datos al abrir una pantalla con un efecto, que es lo normal sin
     *       una librería de datos (la marca aunque el estado cambie después
     *       de esperar la respuesta).
     *
     * Las demás quedan como AVISO. Las de siempre —las reglas de los hooks,
     * las dependencias, las variables sin usar— sí son error o aviso que
     * importa, y la revisión automática de GitHub (pruebas.yml) no deja pasar
     * un cambio con un error.
     */
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/incompatible-library': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/refs': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/immutability': 'warn',
      // Solo afecta la recarga en caliente al programar, no a la tienda.
      'react-refresh/only-export-components': 'warn',
      // { quitado, ...resto } para sacar campos antes de guardar es a propósito.
      'no-unused-vars': ['error', { ignoreRestSiblings: true }],
    },
  },
  {
    /*
     * Cada archivo de contexto exporta su proveedor y el gancho para leerlo,
     * juntos a propósito. Lo único que cambia es que, al programar, editar uno
     * recarga la página entera en vez de solo el componente.
     */
    files: ['src/context/**/*.{js,jsx}'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    /*
     * El mapa (components/mapcn) es el componente de mapcn copiado tal cual.
     * Se deja igual al original para poder actualizarlo: sus avisos son de
     * esa librería, no de la tienda.
     */
    files: ['src/components/mapcn/**/*.{js,jsx}'],
    rules: {
      'react-hooks/refs': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    // Lo que corre en Node y no en el navegador: la vista previa de Vercel, la
    // configuración y los scripts. Las pruebas, con lo que traen las de Vitest.
    files: ['middleware.js', 'vite.config.js', 'scripts/**/*.{js,mjs}', '**/*.test.{js,jsx}'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
])
