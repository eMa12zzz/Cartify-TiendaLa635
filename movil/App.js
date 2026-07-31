/*
 * ============================================================
 * CARTIFY MÓVIL — entrada de la app
 * ============================================================
 * Por ahora la app abre directo en iniciar sesión. Cuando existan más
 * pantallas se decide con qué se navega entre ellas; hoy no hay entre qué.
 * ============================================================
 */

import { StatusBar } from 'expo-status-bar';
import LoginClient from './src/pages/LoginClient';

export default function App() {
  return (
    <>
      {/* Barra de estado oscura sobre el fondo blanco de la tienda. */}
      <StatusBar style="dark" />
      <LoginClient />
    </>
  );
}
