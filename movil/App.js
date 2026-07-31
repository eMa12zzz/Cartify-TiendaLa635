/*
 * ============================================================
 * CARTIFY MÓVIL — entrada de la app
 * ============================================================
 * Aquí se decide qué pantalla se ve. Son dos decisiones encadenadas:
 *
 *   1. ¿Hay sesión? Si la hay, no hay nada que elegir: se entra.
 *   2. Si no la hay, se está en alguno de los tres pasos de conseguirla:
 *      entrar, registrarse, o escribir el código que llegó al correo.
 *
 * Va con `useState` y no con una librería de navegación a propósito.
 * react-navigation y expo-router traen su propio modelo de rutas, sus
 * dependencias nativas y su configuración, y meter todo eso para tres
 * pantallas encadenadas es decidir hoy algo que conviene decidir cuando se
 * sepa cómo queda el resto de la app (tienda, carrito, pedidos, reparto).
 *
 * Cuando llegue ese momento, este archivo es el único que cambia: las
 * pantallas ya reciben a dónde ir por props y no saben nada de cómo se navega.
 * ============================================================
 */

import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { useAuth } from './src/hooks/useAuth';
import Bienvenida from './src/pages/Bienvenida';
import LoginClient from './src/pages/LoginClient';
import Register from './src/pages/Register';
import Verification from './src/pages/Verification';

const Navegacion = () => {
  const { isAuthenticated } = useAuth();
  const [pantalla, setPantalla] = useState('login');
  /*
   * A qué correo se mandó el código. Solo sirve para poder escribirlo en la
   * pantalla de verificación: el servidor no lo necesita, porque los datos del
   * registro viajan en la cookie que dejó el paso anterior.
   */
  const [correoPendiente, setCorreoPendiente] = useState('');

  /*
   * Con sesión abierta no se pregunta nada más. Al cerrarla, `isAuthenticated`
   * vuelve a false y esto cae solo en la pantalla que diga `pantalla`; por eso
   * al verificar y al entrar se deja siempre en 'login'.
   */
  if (isAuthenticated) return <Bienvenida />;

  if (pantalla === 'register') {
    return (
      <Register
        irALogin={() => setPantalla('login')}
        alPedirCodigo={(correo) => {
          setCorreoPendiente(correo);
          setPantalla('verification');
        }}
      />
    );
  }

  if (pantalla === 'verification') {
    return (
      <Verification
        correo={correoPendiente}
        // Cuenta creada: se entra por la puerta normal, con su correo y su clave.
        alVerificar={() => setPantalla('login')}
        alVolver={() => setPantalla('register')}
      />
    );
  }

  return (
    <LoginClient
      irARegistro={() => setPantalla('register')}
      /*
       * "Seguir viendo la tienda" todavía no lleva a ningún lado: la pantalla
       * de la tienda es la siguiente tarea. Se deja el botón puesto porque es
       * parte del trato de esta pantalla —se puede mirar sin cuenta— y quitarlo
       * ahora sería rediseñarla.
       */
      irATienda={undefined}
    />
  );
};

export default function App() {
  return (
    <AuthProvider>
      {/* Barra de estado oscura sobre el fondo blanco de la tienda. */}
      <StatusBar style="dark" />
      <Navegacion />
    </AuthProvider>
  );
}
