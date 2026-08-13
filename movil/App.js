/*
 * ============================================================
 * CARTIFY MÓVIL — entrada de la app
 * ============================================================
 * Al iniciar, si aún no hay una dirección de entrega guardada, se muestra el
 * selector de dirección con mapa (como la Bienvenida de la web). Si ya hay una,
 * arranca directo en la TIENDA. Desde ahí: carrito, checkout y "Mi Cuenta".
 *
 * Proveedores (de afuera hacia adentro):
 *   AuthProvider      — la sesión.
 *   FavoritosProvider — el corazón de los productos.
 *   EdadProvider      — el candado +18.
 *   DireccionProvider — la dirección de entrega activa.
 *   TiendaProvider    — catálogo + carrito.
 * ============================================================
 */

import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { FavoritosProvider } from './src/context/Usuario/FavoritosContext';
import { EdadProvider } from './src/context/Usuario/EdadContext';
import { DireccionProvider } from './src/context/Usuario/DireccionContext';
import { TiendaProvider } from './src/context/Usuario/TiendaContext';

import Tienda from './src/pages/Usuario/Tienda';
import ProductoDetalle from './src/pages/Usuario/ProductoDetalle';
import Carrito from './src/pages/Usuario/Carrito';
import Checkout from './src/pages/Usuario/Checkout';
import SelectorDireccion from './src/pages/Usuario/SelectorDireccion';
import AsistenteVoz from './src/pages/Usuario/AsistenteVoz';
import Impresiones from './src/pages/Usuario/Impresiones';
import MiCuentaLayout from './src/pages/Usuario/MiCuentaLayout';
// Flujo de sesión (login → registro → verificación).
import LoginClient from './src/pages/Login/LoginClient';
import Register from './src/pages/Login/Register';
import Verification from './src/pages/Login/Verification';

const Navegacion = () => {
  // La app abre en el LOGIN. Desde ahí se puede "Seguir viendo la tienda"
  // (irATienda) sin cuenta, o iniciar sesión / registrarse.
  const [pantalla, setPantalla] = useState('login');
  const [params, setParams] = useState({});
  const navegar = (nombre, p = {}) => { setPantalla(nombre); setParams(p); };
  const nav = { navigate: navegar, goBack: () => navegar('tienda'), push: navegar };

  switch (pantalla) {
    case 'direccion':
      return <SelectorDireccion navigation={nav} />;
    case 'detalle':
      return <ProductoDetalle route={{ params }} navigation={{ ...nav, goBack: () => navegar('tienda') }} />;
    case 'carrito':
      return <Carrito navigation={{ ...nav, goBack: () => navegar('tienda') }} />;
    case 'checkout':
      return <Checkout navigation={{ ...nav, goBack: () => navegar('carrito') }} />;
    case 'asistente':
      return <AsistenteVoz navigation={{ ...nav, goBack: () => navegar('tienda') }} />;
    case 'impresiones':
      return <Impresiones navigation={{ ...nav, goBack: () => navegar('tienda') }} />;
    case 'miCuenta':
      return <MiCuentaLayout navigation={{ ...nav, goBack: () => navegar('tienda') }} />;

    // ── Flujo de sesión ──
    case 'login':
      return <LoginClient irARegistro={() => navegar('registro')} irATienda={() => navegar('tienda')} />;
    case 'registro':
      return <Register irALogin={() => navegar('login')} alPedirCodigo={(correo) => navegar('verificacion', { correo })} />;
    case 'verificacion':
      return (
        <Verification
          correo={params.correo}
          alVerificar={() => navegar('tienda')}
          alVolver={() => navegar('registro')}
        />
      );

    case 'tienda':
    default:
      return <Tienda navigation={nav} />;
  }
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <FavoritosProvider>
          <EdadProvider>
            <DireccionProvider>
              <TiendaProvider>
                <StatusBar style="dark" />
                <Navegacion />
              </TiendaProvider>
            </DireccionProvider>
          </EdadProvider>
        </FavoritosProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
