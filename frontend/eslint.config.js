import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
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
     * Las reglas que trae react-hooks 7 para el React Compiler quedan como
     * AVISO, no como error. La tienda no usa ese compilador, y lo que marcan
     * (un setState dentro de un efecto, leer un ref al pintar…) son patrones
     * que el compilador no sabe optimizar, no fallas: revisados uno por uno,
     * ninguno rompía nada. Siguen apareciendo para irlos limpiando con calma.
     *
     * Las de siempre —las reglas de los hooks, las variables sin usar— sí son
     * error, y la revisión automática de GitHub (pruebas.yml) no deja pasar
     * un cambio con una.
     */
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/incompatible-library': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/immutability': 'warn',
      // Solo afecta la recarga en caliente al programar, no a la tienda.
      'react-refresh/only-export-components': 'warn',
      // { quitado, ...resto } para sacar campos antes de guardar es a propósito.
      'no-unused-vars': ['error', { ignoreRestSiblings: true }],
    },
  },
  {
    // Lo que corre en Node y no en el navegador: la vista previa de Vercel y
    // la configuración. Las pruebas, con lo que traen las de Vitest.
    files: ['middleware.js', 'vite.config.js', '**/*.test.{js,jsx}'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
])
