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
 * ── Las pantallas ahora son de dos clases ──
 *
 * APARTADOS (`inicio`, `asistente`, `pedidos`, `perfil`): los cuatro de la
 * barra de abajo. Son hermanos, se cambia entre ellos tocando la barra y
 * ninguno "vuelve" a otro. Ver components/UI/BarraInferior.js.
 *
 * PANTALLAS SUELTAS (`login`, `register`, `verification`, `carrito`,
 * `seccion`): se abren desde algún lado y traen su propio botón para volver.
 * Estas NO llevan barra abajo — el carrito ya tiene su propia franja con el
 * total, y dos barras pegadas dejan el pulgar sin saber cuál toca.
 *
 * ── El orden de los proveedores no es casual ──
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
 * ── Por qué el estado de navegación vive en `Raiz` y no más adentro ──
 *
 * Porque FavoritosProvider lo necesita: tocar el corazón sin sesión tiene que
 * poder mandar a la pantalla de entrar. Un proveedor que envuelve a la
 * navegación no puede leer un estado que vive dentro de ella, así que el
 * estado sube y el proveedor lo recibe.
 * ============================================================
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { AvisoProvider } from './src/context/AvisoContext';
import { FavoritosProvider } from './src/context/FavoritosContext';
import { TemaProvider } from './src/context/TemaContext';
import { TiendaProvider, useTienda } from './src/context/TiendaContext';
import { useAuth } from './src/hooks/useAuth';
import { useBotonAtras } from './src/hooks/useBotonAtras';
import { COLORES } from './src/theme/colores';
import ModalProducto from './src/components/Tienda/ModalProducto';
import BarraInferior, { APARTADOS } from './src/components/UI/BarraInferior';
import Asistente from './src/pages/Asistente';
import Carrito from './src/pages/Carrito';
import Checkout from './src/pages/Checkout';
import Confirmacion from './src/pages/Confirmacion';
import Inicio from './src/pages/Inicio';
import LoginClient from './src/pages/LoginClient';
import Pedidos from './src/pages/Pedidos';
import Perfil from './src/pages/Perfil';
import Register from './src/pages/Register';
import Seccion from './src/pages/Seccion';
import Verification from './src/pages/Verification';

/*
 * Las claves de los cuatro apartados, sacadas de la propia barra en vez de
 * escritas otra vez aquí. Escritas dos veces, el día que se agregue un quinto
 * apartado la barra lo dibujaría y esta lista no lo reconocería como apartado:
 * saldría sin barra abajo y sin manera de volver.
 */
const CLAVES_APARTADO = APARTADOS.map((a) => a.clave);

/*
 * Los que no se pueden ver sin cuenta. La tienda y el asistente sí: en la web
 * también se entra a mirar sin sesión, y la sesión se pide para pagar, no para
 * pasar. Pero "sus pedidos" y "su cuenta" no existen si no hay un "usted".
 */
const CON_SESION = ['pedidos', 'perfil'];

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
   * A dónde iba quien tuvo que pasar por el login primero. Puede ser un
   * apartado ("pedidos", "perfil") o el carrito, cuando lo que quería era pagar.
   *
   * Va en un ref y no en un estado a propósito. El efecto de abajo es el que
   * decide dónde se cae al entrar; si esto fuera estado, LIMPIARLO volvería a
   * disparar ese efecto —ahora ya vacío— y mandaría a la tienda al fotograma
   * siguiente de haber llegado a donde se pidió. El ref cambia sin repintar
   * nada, que es justo lo que se necesita.
   */
  const destinoPendiente = useRef(null);

  /*
   * La respuesta de `POST /order`: el pedido tal cual quedó guardado. Vive aquí
   * y no en el checkout porque la pantalla que lo pinta es OTRA —la de
   * confirmación—, y el checkout ya se fue para cuando esa aparece.
   */
  const [pedidoHecho, setPedidoHecho] = useState(null);

  /*
   * Al entrar —o al arrancar con la sesión ya guardada— se cae en la tienda,
   * salvo que se estuviera yendo a otro lado: quien tocó "Pedidos" sin sesión
   * quería ver sus pedidos, y dejarlo en la portada después de escribir su
   * correo y su contraseña lo obliga a volver a tocar el mismo botón.
   */
  useEffect(() => {
    if (!isAuthenticated) return;
    setPantalla(destinoPendiente.current || 'inicio');
    destinoPendiente.current = null;
  }, [isAuthenticated]);

  /*
   * Y al revés: al cerrar sesión desde "Perfil", ese apartado y el de los
   * pedidos se quedan sin nada que mostrar, así que se cae a la tienda —que es
   * lo que hay para quien no tiene cuenta.
   *
   * Va en un efecto y no en el render de `Pantallas` como estaba: el estado
   * vive AQUÍ, y cambiarlo mientras se dibuja otro componente es lo que React
   * avisa con "Cannot update a component while rendering a different one".
   */
  useEffect(() => {
    if (!isAuthenticated && CON_SESION.includes(pantalla)) setPantalla('inicio');
  }, [isAuthenticated, pantalla]);

  /*
   * Tocar un apartado de la barra. Los dos que necesitan cuenta no se abren a
   * medias: se manda a entrar y se apunta a dónde iba (ver el ref de arriba).
   */
  const cambiarApartado = useCallback(
    (clave) => {
      if (CON_SESION.includes(clave) && !isAuthenticated) {
        destinoPendiente.current = clave;
        setPantalla('login');
        return;
      }
      setPantalla(clave);
    },
    [isAuthenticated]
  );

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
          cambiarApartado={cambiarApartado}
          destinoPendiente={destinoPendiente}
          pedidoHecho={pedidoHecho}
          setPedidoHecho={setPedidoHecho}
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
  cambiarApartado,
  destinoPendiente,
  pedidoHecho,
  setPedidoHecho,
  correoPendiente,
  setCorreoPendiente,
  seccionAbierta,
  setSeccionAbierta,
}) => {
  const esApartado = CLAVES_APARTADO.includes(pantalla);

  /*
   * El botón de atrás de Android, estando en un apartado que no es la tienda,
   * devuelve a la tienda en vez de cerrar la app. Es lo que hace cualquier app
   * con barra abajo, y sin esto salir de "Mis pedidos" con el gesto de siempre
   * cerraba la aplicación entera.
   *
   * Va ANTES de los `if` de abajo porque un hook no puede quedar detrás de un
   * return: React los cuenta por orden en cada render y saltarse uno rompe la
   * lista. El propio hook sabe apagarse con su segundo argumento.
   *
   * Las hojas de detalle registran el suyo DESPUÉS —al montarse— y Android
   * atiende al último que se apuntó, así que estando abierto el detalle de un
   * producto el atrás sigue cerrando la hoja y no cambiando de apartado.
   */
  useBotonAtras(
    useCallback(() => setPantalla('inicio'), [setPantalla]),
    esApartado && pantalla !== 'inicio'
  );

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
   * Los cuatro apartados van todos por aquí, con la misma barra abajo. Se
   * arman de una sola forma y no cada uno por su lado: pegarle la barra a cada
   * pantalla es la manera de que un día una se quede sin ella.
   *
   * La barra va DEBAJO y no encima: se lleva su franja de la pantalla en vez de
   * taparle el final a la lista. Flotando habría que acordarse de dejarle
   * relleno abajo a cada lista de la app, y la última fila de productos
   * terminaría escondida detrás en la que se olvide.
   */
  if (esApartado) {
    return (
      <View style={estilos.conBarra}>
        <View style={estilos.contenido}>
          {pantalla === 'inicio' && (
            <Inicio
              irACarrito={() => setPantalla('carrito')}
              irASeccion={(seccion) => {
                setSeccionAbierta(seccion);
                setPantalla('seccion');
              }}
            />
          )}

          {pantalla === 'asistente' && <Asistente />}

          {/*
            Sin sesión no hay nada que mostrar en estos dos. El efecto de `Raiz`
            ya está llevando a la tienda; esto solo evita pintar una pantalla
            vacía en el fotograma que queda en medio.
          */}
          {pantalla === 'pedidos' && isAuthenticated && <Pedidos />}

          {/*
            Perfil lleva su propia navegación adentro (mis datos, puntos,
            favoritos, direcciones, avisos) y no necesita que se le diga cómo
            volver: la tienda está a un toque, en la barra de abajo y en el
            mismo sitio siempre.
          */}
          {pantalla === 'perfil' && isAuthenticated && <Perfil />}
        </View>

        <BarraInferior apartado={pantalla} alCambiar={cambiarApartado} />
      </View>
    );
  }

  if (pantalla === 'carrito') {
    return (
      <Carrito
        irAInicio={() => setPantalla('inicio')}
        /*
         * Pagar sin cuenta no se puede: el pedido tiene que ir a nombre de
         * alguien. En vez de dejarlo llegar al checkout para que ahí le digan
         * que no, se le manda a entrar y se le devuelve al carrito con todo lo
         * que ya había puesto — que sigue guardado, porque el carrito vive en
         * TiendaContext y no en esta pantalla.
         */
        irAPagar={() => {
          if (!isAuthenticated) {
            destinoPendiente.current = 'carrito';
            setPantalla('login');
            return;
          }
          setPantalla('checkout');
        }}
      />
    );
  }

  if (pantalla === 'checkout') {
    return (
      <Checkout
        alVolver={() => setPantalla('carrito')}
        alConfirmar={(respuesta) => {
          setPedidoHecho(respuesta);
          setPantalla('confirmacion');
        }}
      />
    );
  }

  if (pantalla === 'confirmacion' && pedidoHecho) {
    return (
      <Confirmacion
        respuesta={pedidoHecho}
        alCerrar={() => {
          setPedidoHecho(null);
          setPantalla('inicio');
        }}
      />
    );
  }

  if (pantalla === 'seccion' && seccionAbierta) {
    return (
      <PantallaSeccion seccion={seccionAbierta} alVolver={() => setPantalla('inicio')} />
    );
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
      irATienda={() => {
        /*
         * "Seguir viendo sin cuenta" cancela el apartado al que se iba. Sin
         * esto, alguien que tocó "Pedidos", se arrepintió y se fue a la tienda,
         * al entrar dos días después caía en sus pedidos sin haberlo pedido —
         * la app se acordaba de una intención que él ya había soltado.
         */
        destinoPendiente.current = null;
        setPantalla('inicio');
      }}
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
    <SafeAreaProvider>
      <AvisoProvider>
        <AuthProvider>
          <TemaProvider>
            <Raiz />
          </TemaProvider>
        </AuthProvider>
      </AvisoProvider>
    </SafeAreaProvider>
  );
}

const estilos = StyleSheet.create({
  arranque: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORES.fondo,
  },
  // Un apartado: la pantalla arriba y la barra abajo, en columna.
  conBarra: {
    flex: 1,
    backgroundColor: COLORES.fondo,
  },
  /*
   * El `flex: 1` es lo que le deja a la pantalla TODO lo que sobra después de
   * la barra. Sin él, cada pantalla se encoge a lo que mide su contenido y las
   * listas se quedan sin altura donde desplazarse: la portada aparecía como una
   * franja de dos dedos con la barra pegada debajo.
   */
  contenido: {
    flex: 1,
  },
});
