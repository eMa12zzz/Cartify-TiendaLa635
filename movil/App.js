/*
 * ============================================================
 * CARTIFY MÓVIL — entrada de la app
 * ============================================================
 * Solo arma los proveedores y entrega el árbol a `RootNavigator`
 * (src/navigation/). La navegación en sí —qué pantalla se ve, cómo se pasa de
 * una a otra— vive ahí y no aquí.
 *
 * El orden de los proveedores no es casual:
 *
 *   SafeAreaProvider  va afuera de todo: la barra de abajo le pregunta cuánto
 *                     mide la franja de gestos del teléfono, y un proveedor no
 *                     puede contestarle a quien no envuelve.
 *   AvisoProvider     porque dibuja sus avisos DESPUÉS de sus hijos: así el
 *                     aviso queda encima de la tienda y de las hojas de
 *                     detalle. Envuelto al revés, quedaría debajo.
 *   AuthProvider      porque la tienda y los favoritos necesitan saber de quién
 *                     es la sesión.
 *   TemaProvider      trae los ajustes de la tienda y decide la temporada.
 *   FavoritosProvider y TiendaProvider van últimos: usan los anteriores.
 *
 * `FavoritosProvider` manda a la pantalla de entrar con `navegarA` en vez de
 * un `setPantalla` local: no puede recibir la navegación por props porque él
 * envuelve al propio `RootNavigator`, no al revés.
 */

import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { AvisoProvider } from './src/context/AvisoContext';
import { FavoritosProvider } from './src/context/FavoritosContext';
import { TemaProvider } from './src/context/TemaContext';
import { TiendaProvider } from './src/context/TiendaContext';
import { navegarA } from './src/navigation/navigationRef';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AvisoProvider>
        <AuthProvider>
          <TemaProvider>
            <FavoritosProvider alPedirSesion={() => navegarA('Login')}>
              <TiendaProvider>
                <StatusBar style="dark" />
                <RootNavigator />
              </TiendaProvider>
            </FavoritosProvider>
          </TemaProvider>
        </AuthProvider>
      </AvisoProvider>
    </SafeAreaProvider>
  );
}
