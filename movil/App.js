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
 *   EdadProvider      el candado de los +18: necesita la sesión (por si ya
 *                     hay un DUI guardado) Y el tema (su modal se pinta con
 *                     colores.marca, igual que el resto de la tienda) — por
 *                     eso va DESPUÉS de los dos, no antes. Poniéndolo antes
 *                     de TemaProvider, ModalConfirmarEdad —que EdadProvider
 *                     dibuja junto a sus hijos, no adentro— se queda sin
 *                     TemaContext y truena con "useTema debe usarse dentro
 *                     de <TemaProvider>" en cuanto se abre.
 *   FavoritosProvider y TiendaProvider van últimos: usan los anteriores.
 *   PedidoActivoProvider necesita la sesión (AuthProvider), nada más — va
 *                     junto a TiendaProvider porque a quien de verdad le
 *                     importa es a BurbujaPedido, que vive ahí al lado.
 *
 * `FavoritosProvider` manda a la pantalla de entrar con `navegarA` en vez de
 * un `setPantalla` local: no puede recibir la navegación por props porque él
 * envuelve al propio `RootNavigator`, no al revés.
 *
 * `BurbujaPedido` va como hermano de `RootNavigator`, no adentro de una
 * pantalla: así el seguimiento del pedido sigue viéndose al cambiar de
 * apartado (Tienda, Asistente, Perfil) en vez de desaparecer con la pantalla
 * en la que se abrió.
 */

import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// Solo por su efecto secundario: deja GoogleSignin.configure() hecho desde
// el arranque. Ver src/config/googleSignIn.js.
import './src/config/googleSignIn';
import { AuthProvider } from './src/context/AuthContext';
import { AvisoProvider } from './src/context/AvisoContext';
import { EdadProvider } from './src/context/EdadContext';
import { FavoritosProvider } from './src/context/FavoritosContext';
import { TemaProvider } from './src/context/TemaContext';
import { TiendaProvider } from './src/context/TiendaContext';
import { PedidoActivoProvider } from './src/context/PedidoActivoContext';
import { navegarA } from './src/navigation/navigationRef';
import RootNavigator from './src/navigation/RootNavigator';
import BurbujaPedido from './src/components/Tienda/BurbujaPedido';

export default function App() {
  return (
    <SafeAreaProvider>
      <AvisoProvider>
        <AuthProvider>
          <TemaProvider>
            <EdadProvider>
              <FavoritosProvider alPedirSesion={() => navegarA('Login')}>
                <TiendaProvider>
                  <PedidoActivoProvider>
                    <StatusBar style="dark" />
                    <RootNavigator />
                    <BurbujaPedido />
                  </PedidoActivoProvider>
                </TiendaProvider>
              </FavoritosProvider>
            </EdadProvider>
          </TemaProvider>
        </AuthProvider>
      </AvisoProvider>
    </SafeAreaProvider>
  );
}
