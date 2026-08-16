/*
 * ============================================================
 * ROOT NAVIGATOR — todo lo que antes decidía `Raiz` en App.js
 * ============================================================
 * Cada pantalla suelta sigue exactamente igual por dentro (`Carrito.js`,
 * `Checkout.js`, etc.): lo único que cambia es CÓMO llegan sus props de
 * navegación. Antes eran funciones que hacían `setPantalla('x')`; ahora son
 * funciones que hacen `navigation.navigate('X')`. El resto del archivo de cada
 * pantalla no se tocó.
 *
 * ── Por qué `Splash` navega con un efecto y no con el `initialRouteName` ──
 *
 * Porque a dónde ir (Login o Tabs) depende de si había sesión guardada, y eso
 * no se sabe hasta que `AuthProvider` termina de leer el almacén. `Splash` se
 * queda montada ese tiempo (más el mínimo de `useSplashTimer`) y solo entonces
 * decide.
 *
 * ── `AuthWatcher` es el login interactivo, `Splash` es el arranque ──
 *
 * Los dos miran `isAuthenticated`, pero no se pisan: `AuthWatcher` se apaga
 * hasta que `Splash` marca `arranqueResuelto`, así que un login con sesión ya
 * guardada solo lo mueve `Splash`, y un login hecho a mano en la pantalla de
 * entrar solo lo mueve `AuthWatcher`.
 */

import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { useTienda } from '../context/TiendaContext';
import { useSplashTimer } from '../hooks/useSplashTimer';
import { arranqueResuelto, destinoPendiente, irATabs, navegarA, navigationRef } from './navigationRef';
import PantallaCarga from '../pages/PantallaCarga';
import LoginClient from '../pages/LoginClient';
import Register from '../pages/Register';
import Verification from '../pages/Verification';
import Carrito from '../pages/Carrito';
import Checkout from '../pages/Checkout';
import Confirmacion from '../pages/Confirmacion';
import Seccion from '../pages/Seccion';
import ModalProducto from '../components/Tienda/ModalProducto';
import TabMenu from './TabMenu';

const Stack = createNativeStackNavigator();

const SplashRoute = ({ navigation }) => {
  const { isAuthenticated, cargando } = useAuth();
  const mostrarSplash = useSplashTimer(cargando);

  useEffect(() => {
    if (mostrarSplash) return;

    arranqueResuelto.current = true;

    if (isAuthenticated) {
      irATabs(destinoPendiente.current);
      destinoPendiente.current = null;
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }
    // Solo debe correr cuando el splash termina, no en cada cambio de sesión:
    // el login interactivo lo atiende AuthWatcher, no esta pantalla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostrarSplash]);

  return <PantallaCarga />;
};

// Sin pantalla propia: solo escucha. Vive como hermano del Stack para que
// pueda navegar en cuanto `isAuthenticated` pasa a `true` después del arranque
// (login o registro+verificación hechos a mano).
const AuthWatcher = () => {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!arranqueResuelto.current || !isAuthenticated) return;
    irATabs(destinoPendiente.current);
    destinoPendiente.current = null;
  }, [isAuthenticated]);

  return null;
};

const LoginRoute = ({ navigation }) => (
  <LoginClient
    irARegistro={() => navigation.navigate('Register')}
    irATienda={() => {
      destinoPendiente.current = null;
      irATabs(null);
    }}
  />
);

const RegisterRoute = ({ navigation }) => (
  <Register
    irALogin={() => navigation.navigate('Login')}
    alPedirCodigo={(correo) => navigation.navigate('Verification', { correo })}
  />
);

const VerificationRoute = ({ route, navigation }) => (
  <Verification
    correo={route.params?.correo}
    // Cuenta creada: se entra por la puerta normal, con su correo y su clave.
    alVerificar={() => navigation.navigate('Login')}
    alVolver={() => navigation.navigate('Register')}
  />
);

const CarritoRoute = ({ navigation }) => {
  const { isAuthenticated } = useAuth();

  return (
    <Carrito
      irAInicio={() => navigation.navigate('Tabs', { screen: 'inicio' })}
      irAPagar={() => {
        // Pagar sin cuenta no se puede: se manda a entrar y se guarda que
        // venía del carrito, para volver ahí (no al checkout) y que confirme
        // "pagar" otra vez ya con sesión.
        if (!isAuthenticated) {
          destinoPendiente.current = 'Carrito';
          navegarA('Login');
          return;
        }
        navigation.navigate('Checkout');
      }}
    />
  );
};

const CheckoutRoute = ({ navigation }) => (
  <Checkout
    alVolver={() => navigation.goBack()}
    alConfirmar={(respuesta) => navigation.replace('Confirmacion', { respuesta })}
  />
);

const ConfirmacionRoute = ({ route, navigation }) => (
  <Confirmacion
    respuesta={route.params?.respuesta}
    alCerrar={() => navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] })}
  />
);

// Mismo par pantalla+hoja que antes armaba `PantallaSeccion` en App.js: la
// sección lleva su propio detalle de producto abierto.
const SeccionRoute = ({ route, navigation }) => {
  const { agregarAlCarrito } = useTienda();
  const [productoAbierto, setProductoAbierto] = useState(null);

  return (
    <>
      <Seccion
        seccion={route.params?.seccion}
        alVolver={() => navigation.goBack()}
        alVerDetalle={setProductoAbierto}
        alAgregar={agregarAlCarrito}
      />
      {productoAbierto && (
        <ModalProducto
          producto={productoAbierto}
          alCerrar={() => setProductoAbierto(null)}
          alAgregar={agregarAlCarrito}
        />
      )}
    </>
  );
};

const RootNavigator = () => (
  <NavigationContainer ref={navigationRef}>
    <AuthWatcher />
    <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashRoute} />
      <Stack.Screen name="Login" component={LoginRoute} />
      <Stack.Screen name="Register" component={RegisterRoute} />
      <Stack.Screen name="Verification" component={VerificationRoute} />
      <Stack.Screen name="Tabs" component={TabMenu} />
      <Stack.Screen name="Carrito" component={CarritoRoute} />
      <Stack.Screen name="Checkout" component={CheckoutRoute} />
      <Stack.Screen name="Confirmacion" component={ConfirmacionRoute} />
      <Stack.Screen name="Seccion" component={SeccionRoute} />
    </Stack.Navigator>
  </NavigationContainer>
);

export default RootNavigator;
