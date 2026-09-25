/*
 * ============================================================
 * PERFIL — la portada de "Mi cuenta"
 * ============================================================
 * Lo que en la web es el menú del `ClienteLayout`: quién está dentro y la lista
 * de las cosas que puede hacer con su cuenta.
 *
 * Reemplaza a la vieja pantalla de Bienvenida, que era una comprobación de que
 * el login funcionaba —el nombre, tres renglones de datos y un botón de salir—
 * y no una cuenta.
 *
 * ── La navegación de adentro vive AQUÍ, no en App.js ──
 *
 * Las pantallas de la cuenta se abren y se cierran contra este archivo, en su
 * propio `useState`. No suben a `Raiz` como el resto porque son de este
 * apartado y de ninguno más: metidas allá arriba, la lista de pantallas de la
 * app se duplicaría y ninguna de las nuevas se podría alcanzar desde otro
 * lado.
 *
 * El efecto que se busca es el de cualquier app con barra abajo: entrar a "Mis
 * datos" NO saca de la cuenta —la barra sigue ahí, con su icono encendido— y la
 * flecha de arriba vuelve a esta lista, no a la tienda.
 *
 * ── De la web no está todo ──
 *
 * Queda afuera un ítem del menú de allá, y no por descuido:
 *
 *   Pedidos    no falta: es uno de los cuatro apartados de la barra de abajo,
 *              que es un lugar MEJOR que un renglón aquí adentro.
 *
 * Pagos y Recibos sí se sumaron después (ver Pagos.js y Recibos.js): el
 * primero reusa el saldo/canje que ya vivía en Checkout.js, y el segundo
 * son los mismos pedidos de Pedidos.js, solo filtrados a los entregados —
 * ningún endpoint nuevo, salvo el de guardar métodos de pago.
 *
 * Preferencias (claro, oscuro o automático) llegó con el modo oscuro de la
 * web — ver Preferencias.js y context/ModoContext.js.
 *
 * Ayuda también se sumó después (ver Ayuda.js): al principio se dejó afuera
 * porque su único canal real, el WhatsApp, salía de una variable de Vite que
 * en Expo no existe — ver el comentario grande de utils/tienda.js para la
 * versión de Expo de lo mismo.
 *
 * ── Cerrar sesión vive arriba a la derecha, no abajo del menú ──
 * Es la única acción de esta pantalla que no abre una sección de la cuenta:
 * un icono aparte en la barra, lejos de la lista, para que no se confunda
 * con un ítem más ni se toque por error al bajar deslizando la lista.
 * ============================================================
 */

import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import {
  Bell, ChevronRight, CreditCard, Heart, HelpCircle, LogOut, MapPin, Receipt, SlidersHorizontal, Star, User,
} from 'lucide-react-native';
import { useColores, useEstilos } from '../context/ModoContext';
import { useAireBarraFlotante } from '../components/UI/BarraInferior';
import { ALTURA_ESTADO } from '../theme/pantalla';
import { useAuth } from '../hooks/useAuth';
import { useBotonAtras } from '../hooks/useBotonAtras';
import { useTema } from '../context/TemaContext';
import { getCliente } from '../api/clienteApi';
import Ayuda from './cuenta/Ayuda';
import Direcciones from './cuenta/Direcciones';
import Favoritos from './cuenta/Favoritos';
import MisDatos from './cuenta/MisDatos';
import Notificaciones from './cuenta/Notificaciones';
import Pagos from './cuenta/Pagos';
import Preferencias from './cuenta/Preferencias';
import Puntos from './cuenta/Puntos';
import Recibos from './cuenta/Recibos';
import ModalConfirmar from '../components/UI/ModalConfirmar';
import HojaTerminos from '../components/UI/HojaTerminos';
import { DOCUMENTOS_LEGALES } from '../utils/legales';
import { navegarA } from '../navigation/navigationRef';
import { registrarTokenPush } from '../api/clienteApi';
import { tokenActual } from '../utils/notificaciones';

/*
 * Los iconos son los mismos con los que la web pinta este menú (ver
 * ClienteLayout): User, Heart, MapPin, CreditCard, Bell, Star, Receipt,
 * SlidersHorizontal y HelpCircle. El orden también es el de allá, menos
 * Pedidos (ver el comentario de arriba) — Ayuda al final, igual que en la
 * barra de la web.
 */
const SECCIONES = [
  { clave: 'datos', titulo: 'Mis datos', sub: 'Nombre, correo y teléfono', icono: User },
  { clave: 'favoritos', titulo: 'Mis favoritos', sub: 'Lo que marcó con el corazón', icono: Heart },
  { clave: 'direcciones', titulo: 'Direcciones', sub: 'A dónde le llevamos el pedido', icono: MapPin },
  { clave: 'pagos', titulo: 'Pagos', sub: 'Su saldo y sus métodos guardados', icono: CreditCard },
  { clave: 'avisos', titulo: 'Notificaciones', sub: 'Qué avisos quiere recibir', icono: Bell },
  { clave: 'puntos', titulo: 'Puntos de fidelidad', sub: 'Su saldo y cuánto valen', icono: Star },
  { clave: 'recibos', titulo: 'Recibos', sub: 'Sus pedidos ya entregados', icono: Receipt },
  { clave: 'preferencias', titulo: 'Preferencias', sub: 'Modo claro u oscuro', icono: SlidersHorizontal },
  { clave: 'ayuda', titulo: 'Ayuda y contacto', sub: 'Preguntas frecuentes y cómo escribirnos', icono: HelpCircle },
];

const PANTALLAS = {
  datos: MisDatos,
  favoritos: Favoritos,
  direcciones: Direcciones,
  pagos: Pagos,
  avisos: Notificaciones,
  puntos: Puntos,
  recibos: Recibos,
  preferencias: Preferencias,
  ayuda: Ayuda,
};

const Perfil = () => {
  // Lo que hay que dejarle libre abajo a la píldora flotante.
  const aireAbajo = useAireBarraFlotante();
  const { user, logout } = useAuth();
  const { colores } = useTema();
  const COLORES = useColores();
  const estilos = useEstilos(crearEstilos);

  const [seccion, setSeccion] = useState(null);
  const [confirmarSalida, setConfirmarSalida] = useState(false);
  const [saliendo, setSaliendo] = useState(false);
  const [cliente, setCliente] = useState(null);
  // El documento legal abierto encima (términos, privacidad, devoluciones) o null.
  const [docLegal, setDocLegal] = useState(null);

  // Al personal no se le puede mostrar una cuenta de cliente: los endpoints de
  // esta pantalla van contra /client/:id y con un id de empleado dan 404. Entra
  // por la misma puerta, pero no viene a comprar. Mismo criterio que la web.
  const esCliente = user?.type === 'client' && !!user?.id;

  const volverALaLista = useCallback(() => setSeccion(null), []);

  // El botón de atrás de Android cierra la pantalla de adentro antes que nada.
  // Se registra DESPUÉS del de App.js, y Android atiende al último apuntado,
  // así que este gana mientras haya una sección abierta.
  useBotonAtras(volverALaLista, seccion !== null);

  /*
   * Los datos se releen cada vez que se vuelve a esta lista, no solo al entrar.
   * Es lo que hace que al guardar el nombre en "Mis datos" el saludo de aquí
   * arriba salga con el nombre nuevo: el `user` de la sesión se llenó al entrar
   * y no se entera de una edición posterior.
   */
  const cargar = useCallback(async () => {
    if (!esCliente) return;
    try {
      setCliente(await getCliente(user.id));
    } catch {
      /*
       * Sin esto se cae al `user` de la sesión, que trae el nombre y el correo
       * de cuando entró. Es información de hace un rato, no información falsa —
       * y dejar la cuenta en blanco porque falló una petición sería peor.
       */
    }
  }, [esCliente, user?.id]);

  useEffect(() => {
    if (seccion === null) cargar();
  }, [seccion, cargar]);

  // La pregunta la hace ModalConfirmar, con la cara de la app: el Alert del
  // sistema era un cuadro gris de Android en medio de la tienda.
  const salir = () => setConfirmarSalida(true);

  // ── Una de las pantallas de adentro ──
  if (seccion) {
    const Pantalla = PANTALLAS[seccion];
    return <Pantalla alVolver={volverALaLista} />;
  }

  // ── La lista ──
  const nombre = cliente?.fullName || user?.fullName || user?.userName || 'Cliente';
  const correo = cliente?.email || user?.email || '';
  const inicial = nombre.substring(0, 1).toUpperCase();

  return (
    <View style={estilos.pantalla}>
      <View style={[estilos.barra, { paddingTop: ALTURA_ESTADO + 10 }]}>
        <Text style={estilos.tituloBarra}>Mi cuenta</Text>

        <Pressable
          onPress={salir}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
          style={({ pressed }) => [
            estilos.botonSalir,
            pressed && { backgroundColor: colores.marcaSuave },
          ]}
        >
          <LogOut size={20} color={COLORES.textoSuave} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[estilos.cuerpo, { paddingBottom: aireAbajo }]}>
        {/* Quién está dentro */}
        <View style={estilos.cabecera}>
          {cliente?.image ? (
            <Image source={{ uri: cliente.image }} contentFit="cover" style={estilos.avatarFoto} />
          ) : (
            <View style={[estilos.avatar, { backgroundColor: colores.marca }]}>
              <Text style={estilos.avatarTexto}>{inicial}</Text>
            </View>
          )}
          <View style={estilos.identidad}>
            <Text style={estilos.nombre} numberOfLines={1}>
              {nombre}
            </Text>
            {!!correo && (
              <Text style={estilos.correo} numberOfLines={1}>
                {correo}
              </Text>
            )}
          </View>
        </View>

        {esCliente ? (
          <View style={estilos.menu}>
            {SECCIONES.map(({ clave, titulo, sub, icono: Icono }) => (
              <Pressable
                key={clave}
                onPress={() => setSeccion(clave)}
                accessibilityRole="button"
                accessibilityLabel={titulo}
                style={({ pressed }) => [
                  estilos.item,
                  pressed && { backgroundColor: colores.marcaTenue },
                ]}
              >
                <View style={[estilos.cuadroIcono, { backgroundColor: colores.marcaSuave }]}>
                  <Icono size={18} color={colores.marca} strokeWidth={2} />
                </View>

                <View style={estilos.itemTextos}>
                  <Text style={estilos.itemTitulo}>{titulo}</Text>
                  <Text style={estilos.itemSub}>{sub}</Text>
                </View>

                <ChevronRight size={18} color={COLORES.marcador} strokeWidth={2} />
              </Pressable>
            ))}
          </View>
        ) : (
          /*
           * Personal de la tienda. No se le esconde la app —puede seguir viendo
           * la tienda— pero tampoco se le enseñan cinco renglones que al tocarlos
           * darían error.
           */
          <View style={estilos.aviso}>
            <Text style={estilos.avisoTexto}>
              Entró con una cuenta del personal. Esta aplicación es la de los clientes: el área de
              reparto y el panel de la tienda están en la versión de computadora.
            </Text>
          </View>
        )}

        {/*
          Lo que se puede leer en cualquier momento, no solo al registrarse:
          la presentación de Tiqui y los documentos legales. Van sueltos, como
          enlaces, sin recuadro: no son secciones de la cuenta.
        */}
        <View style={estilos.extras}>
          <Pressable
            onPress={() => navegarA('ConoceATiqui')}
            accessibilityRole="button"
            style={({ pressed }) => [estilos.extraFila, pressed && { opacity: 0.7 }]}
          >
            <Text style={[estilos.extraTexto, { color: colores.marcaTexto }]}>Conoce a Tiqui, tu asistente</Text>
            <ChevronRight size={16} color={colores.marca} strokeWidth={2.2} />
          </Pressable>
          <View style={estilos.legales}>
            {DOCUMENTOS_LEGALES.map((d) => (
              <Text
                key={d.clave}
                onPress={() => setDocLegal(d.clave)}
                accessibilityRole="link"
                style={estilos.legal}
              >
                {d.titulo}
              </Text>
            ))}
          </View>
        </View>
      </ScrollView>

      {docLegal && <HojaTerminos clave={docLegal} alCerrar={() => setDocLegal(null)} />}

      {confirmarSalida && (
        <ModalConfirmar
          titulo="¿Cerrar sesión?"
          mensaje="Tendrá que volver a escribir su correo y su contraseña para entrar de nuevo."
          textoConfirmar="Cerrar sesión"
          textoCancelar="Quedarme"
          destructivo
          trabajando={saliendo}
          alConfirmar={async () => {
            setSaliendo(true);
            /*
             * Antes de soltar la sesión: que este teléfono deje de recibir los
             * avisos de esta cuenta. No es un detalle de limpieza — sin esto,
             * el próximo "su pedido va en camino" suena en un aparato donde ya
             * entró otra persona.
             *
             * Va con un tope de tiempo y su catch porque cerrar sesión no
             * puede quedarse colgado esperando a la red: si no se pudo dar de
             * baja, el token se cae solo la primera vez que Expo conteste que
             * ya no existe (ver pushExpo.js).
             */
            try {
              const token = await Promise.race([
                tokenActual(),
                new Promise((listo) => setTimeout(() => listo(null), 2500)),
              ]);
              if (token && user?.id) await registrarTokenPush(user.id, token, false);
            } catch {
              // Se cierra igual: la sesión es de quien la está cerrando.
            }
            setSaliendo(false);
            setConfirmarSalida(false);
            logout();
          }}
          alCerrar={() => (saliendo ? undefined : setConfirmarSalida(false))}
        />
      )}
    </View>
  );
};

const crearEstilos = (COLORES) => StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: COLORES.fondo,
  },
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.linea,
  },
  tituloBarra: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORES.tituloFuerte,
    letterSpacing: -0.4,
  },
  botonSalir: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cuerpo: {
    padding: 16,
    paddingBottom: 30,
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 8,
    marginBottom: 18,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFoto: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  // Blanco también en oscuro: va sobre el color de la marca, no sobre el fondo.
  avatarTexto: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  identidad: {
    flexShrink: 1,
    gap: 2,
  },
  nombre: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORES.tituloFuerte,
    letterSpacing: -0.3,
  },
  correo: {
    fontSize: 13,
    color: COLORES.textoSuave,
  },
  menu: {
    gap: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderWidth: 1,
    borderColor: COLORES.lineaCard,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  cuadroIcono: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTextos: {
    flex: 1,
    gap: 1,
  },
  itemTitulo: {
    fontSize: 14.5,
    fontWeight: '600',
    color: COLORES.tituloVentaja,
  },
  itemSub: {
    fontSize: 12.5,
    color: COLORES.textoSuave,
  },
  aviso: {
    borderWidth: 1,
    borderColor: COLORES.lineaCard,
    borderRadius: 14,
    padding: 16,
  },
  avisoTexto: {
    fontSize: 13.5,
    lineHeight: 21,
    color: COLORES.textoSuave,
  },
  // Separado del menú con una línea fina, no con otro recuadro.
  extras: {
    marginTop: 22,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORES.linea,
    gap: 10,
  },
  extraFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
  },
  extraTexto: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  legales: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 16,
  },
  legal: {
    fontSize: 13,
    color: COLORES.textoSuave,
    textDecorationLine: 'underline',
    paddingVertical: 8,
  },
});

export default Perfil;
