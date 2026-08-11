/*
 * ============================================================
 * CARTIFY MÓVIL — entrada de la app
 * ============================================================
 * Aquí se decide qué pantalla se ve.
 *
 * Sigue yendo con `useState` y no con una librería de navegación, por la misma
 * razón que cuando eran tres pantallas: react-navigation y expo-router traen su
 * propio modelo de rutas, sus dependencias nativas y su configuración.
 *
 * Ahora sí conviene decir dónde está el límite, porque ya se ve: cuando haya
 * que volver A DONDE SE ESTABA (abrir un pedido desde una notificación y
 * regresar a la lista, o encadenar tres pantallas y que "atrás" las deshaga
 * una por una) va a hacer falta una pila de verdad. Ya asoma en `seccion`, que
 * tiene que acordarse de cuál sección abrió para poder volver.
 *
 * ── El orden de los proveedores no es casual ──
 *
 *   AvisoProvider     va PRIMERO porque dibuja sus avisos DESPUÉS de sus
 *                     hijos: así el aviso queda encima de la tienda y de las
 *                     hojas de detalle. Envuelto al revés, quedaría debajo.
 *   AuthProvider      porque la tienda y los favoritos necesitan saber de quién
 *                     es la sesión.
 *   TemaProvider      trae los ajustes de la tienda y decide la temporada.
 *   FavoritosProvider y TiendaProvider van últimos: usan los anteriores.
 *
 * ── Por qué el estado de navegación vive en `Raiz` y no más adentro ──
 *
 * Porque FavoritosProvider lo necesita: tocar el corazón sin sesión tiene que
 * poder mandar a la pantalla de entrar. Un proveedor que envuelve a la
 * navegación no puede leer un estado que vive dentro de ella, así que el
 * estado sube y el proveedor lo recibe.
 * ============================================================
 */

import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { AvisoProvider } from './src/context/AvisoContext';
import { FavoritosProvider } from './src/context/FavoritosContext';
import { TemaProvider } from './src/context/TemaContext';
import { TiendaProvider, useTienda } from './src/context/TiendaContext';
import { useAuth } from './src/hooks/useAuth';
import { COLORES } from './src/theme/colores';
import ModalProducto from './src/components/Tienda/ModalProducto';
import Bienvenida from './src/pages/Bienvenida';
import Carrito from './src/pages/Carrito';
import Inicio from './src/pages/Inicio';
import LoginClient from './src/pages/LoginClient';
import Register from './src/pages/Register';
import Seccion from './src/pages/Seccion';
import Verification from './src/pages/Verification';

const Raiz = () => {
  const { isAuthenticated, cargando } = useAuth();
  const [pantalla, setPantalla] = useState('login');
  /*
   * A qué correo se mandó el código. Solo sirve para poder escribirlo en la
   * pantalla de verificación: el servidor no lo necesita, porque los datos del
   * registro viajan en la cookie que dejó el paso anterior.
   */
  const [correoPendiente, setCorreoPendiente] = useState('');
  // La sección abierta en "Ver todos". Se guarda entera y no su clave: la
  // pantalla la pinta tal cual, sin volver a armarla.
  const [seccionAbierta, setSeccionAbierta] = useState(null);

  /*
   * Al entrar —o al arrancar con la sesión ya guardada— se cae en la tienda.
   * Bienvenida quedó como la pantalla de la cuenta, y se llega por el botón de
   * la persona en la barra de arriba.
   */
  useEffect(() => {
    if (isAuthenticated) setPantalla('inicio');
  }, [isAuthenticated]);

  /*
   * Y al revés: al cerrar sesión desde "Mi cuenta", esa pantalla se queda sin
   * nada que mostrar, así que se cae a la tienda —que es lo que hay para quien
   * no tiene cuenta.
   *
   * Va en un efecto y no en el render de `Pantallas` como estaba: el estado
   * vive AQUÍ, y cambiarlo mientras se dibuja otro componente es lo que React
   * avisa con "Cannot update a component while rendering a different one".
   */
  useEffect(() => {
    if (!isAuthenticated && pantalla === 'cuenta') setPantalla('inicio');
  }, [isAuthenticated, pantalla]);

  return (
    <FavoritosProvider alPedirSesion={() => setPantalla('login')}>
      <TiendaProvider>
        {/* Barra de estado oscura sobre el fondo blanco de la tienda. */}
        <StatusBar style="dark" />
        <Pantallas
          cargando={cargando}
          isAuthenticated={isAuthenticated}
          pantalla={pantalla}
          setPantalla={setPantalla}
          correoPendiente={correoPendiente}
          setCorreoPendiente={setCorreoPendiente}
          seccionAbierta={seccionAbierta}
          setSeccionAbierta={setSeccionAbierta}
        />
      </TiendaProvider>
    </FavoritosProvider>
  );
};

const Pantallas = ({
  cargando,
  isAuthenticated,
  pantalla,
  setPantalla,
  correoPendiente,
  setCorreoPendiente,
  seccionAbierta,
  setSeccionAbierta,
}) => {
  /*
   * Mientras se lee la sesión guardada no se pinta nada.
   *
   * Es un instante, pero sin esto quien ya había entrado veía la pantalla de
   * "Iniciar sesión" durante un parpadeo en CADA arranque — justo lo que
   * guardar la sesión venía a evitar.
   */
  if (cargando) {
    return (
      <View style={estilos.arranque}>
        <ActivityIndicator size="large" color={COLORES.marca} />
      </View>
    );
  }

  /*
   * La tienda se ve CON o SIN cuenta, igual que en la web: se entra a mirar y
   * la sesión se pide para pagar, no para pasar. Por eso estas van antes de
   * preguntar por `isAuthenticated`.
   */
  if (pantalla === 'inicio') {
    return (
      <Inicio
        irACarrito={() => setPantalla('carrito')}
        irACuenta={() => setPantalla(isAuthenticated ? 'cuenta' : 'login')}
        irASeccion={(seccion) => {
          setSeccionAbierta(seccion);
          setPantalla('seccion');
        }}
        haySesion={isAuthenticated}
      />
    );
  }

  if (pantalla === 'carrito') {
    return <Carrito irAInicio={() => setPantalla('inicio')} />;
  }

  if (pantalla === 'seccion' && seccionAbierta) {
    return (
      <PantallaSeccion seccion={seccionAbierta} alVolver={() => setPantalla('inicio')} />
    );
  }

  if (pantalla === 'cuenta') {
    // Sin sesión no hay cuenta que mostrar. El efecto de `Raiz` ya está
    // llevando a la tienda; esto solo evita pintar una pantalla vacía en el
    // fotograma que queda en medio.
    if (!isAuthenticated) return null;
    return <Bienvenida alVolver={() => setPantalla('inicio')} />;
  }

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
      irATienda={() => setPantalla('inicio')}
    />
  );
};

/*
 * La sección lleva su propio detalle de producto abierto, igual que la
 * portada: desde "Nuevos en la tienda > Ver todos" se toca una tarjeta y se
 * espera que abra, no que no haga nada.
 */
const PantallaSeccion = ({ seccion, alVolver }) => {
  const { agregarAlCarrito } = useTienda();
  const [productoAbierto, setProductoAbierto] = useState(null);

  return (
    <>
      <Seccion
        seccion={seccion}
        alVolver={alVolver}
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

export default function App() {
  return (
    <AvisoProvider>
      <AuthProvider>
        <TemaProvider>
          <Raiz />
        </TemaProvider>
      </AuthProvider>
    </AvisoProvider>
  );
}

const estilos = StyleSheet.create({
  arranque: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORES.fondo,
  },
});
