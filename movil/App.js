/*
 * ============================================================
 * CARTIFY MÓVIL — entrada de la app
 * ============================================================
 * Ya son dos pantallas: entrar y registrarse. Van con un `useState` y no con
 * una librería de navegación a propósito — react-navigation o expo-router
 * traen su propio modelo de rutas, sus dependencias nativas y su
 * configuración, y meter todo eso para alternar entre dos pantallas es decidir
 * hoy algo que conviene decidir cuando se sepa cómo queda el resto de la app
 * (tienda, carrito, pedidos, reparto).
 *
 * Cuando llegue esa tercera pantalla, este archivo es el único que cambia: las
 * dos pantallas ya reciben a dónde ir por props (`irARegistro`, `irALogin`) y
 * no saben nada de cómo se navega.
 * ============================================================
 */

import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import LoginClient from './src/pages/LoginClient';
import Register from './src/pages/Register';

export default function App() {
  const [pantalla, setPantalla] = useState('login');

  return (
    <>
      {/* Barra de estado oscura sobre el fondo blanco de la tienda. */}
      <StatusBar style="dark" />

      {pantalla === 'login' ? (
        <LoginClient
          irARegistro={() => setPantalla('register')}
          /*
           * "Seguir viendo la tienda" todavía no lleva a ningún lado: la
           * pantalla de la tienda es la siguiente tarea. Se deja el botón
           * puesto porque es parte del trato de esta pantalla —se puede mirar
           * sin cuenta— y quitarlo ahora sería rediseñarla.
           */
          irATienda={undefined}
        />
      ) : (
        <Register irALogin={() => setPantalla('login')} />
      )}
    </>
  );
}
