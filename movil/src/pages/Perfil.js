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
 * Las cinco pantallas de la cuenta se abren y se cierran contra este archivo,
 * en su propio `useState`. No suben a `Raiz` como el resto porque son de este
 * apartado y de ninguno más: metidas allá arriba, la lista de pantallas de la
 * app pasaría de siete a doce y ninguna de las cinco nuevas se podría alcanzar
 * desde otro lado.
 *
 * El efecto que se busca es el de cualquier app con barra abajo: entrar a "Mis
 * datos" NO saca de la cuenta —la barra sigue ahí, con su icono encendido— y la
 * flecha de arriba vuelve a esta lista, no a la tienda.
 *
 * ── De la web no está todo ──
 *
 * Faltan tres de los ítems de allá, y cada uno por su razón:
 *
 *   Pedidos    no falta: es uno de los cuatro apartados de la barra de abajo,
 *              que es un lugar MEJOR que un renglón aquí adentro.
 *   Recibos    en la web es la lista de los pedidos ya entregados. Aquí cada
 *              pedido enseña su estado en la propia tarjeta, así que un segundo
 *              apartado para ver los mismos pedidos otra vez, filtrados, sería
 *              partir en dos una lista que cabe entera.
 *   Pagos      pide el saldo digital, el canje de tarjetas de regalo y la
 *              pasarela. Es un apartado entero, no un renglón.
 *   Ayuda      son preguntas frecuentes más los canales REALES de la tienda, y
 *              el único canal real (el WhatsApp) sale de una variable de Vite
 *              que en móvil no existe. Traer las preguntas sin los contactos
 *              deja un centro de ayuda que no lleva a ninguna persona.
 * ============================================================
 */

import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Bell, ChevronRight, Heart, LogOut, MapPin, Star, User } from 'lucide-react-native';
import { COLORES } from '../theme/colores';
import { ALTURA_ESTADO } from '../theme/pantalla';
import { useAuth } from '../hooks/useAuth';
import { useBotonAtras } from '../hooks/useBotonAtras';
import { useTema } from '../context/TemaContext';
import { getCliente } from '../api/clienteApi';
import Direcciones from './cuenta/Direcciones';
import Favoritos from './cuenta/Favoritos';
import MisDatos from './cuenta/MisDatos';
import Notificaciones from './cuenta/Notificaciones';
import Puntos from './cuenta/Puntos';

/*
 * Los iconos son los mismos con los que la web pinta este menú (ver
 * ClienteLayout): User, Star, Heart, MapPin y Bell.
 */
const SECCIONES = [
  { clave: 'datos', titulo: 'Mis datos', sub: 'Nombre, correo y teléfono', icono: User },
  { clave: 'puntos', titulo: 'Puntos de fidelidad', sub: 'Su saldo y cuánto valen', icono: Star },
  { clave: 'favoritos', titulo: 'Mis favoritos', sub: 'Lo que marcó con el corazón', icono: Heart },
  { clave: 'direcciones', titulo: 'Direcciones', sub: 'A dónde le llevamos el pedido', icono: MapPin },
  { clave: 'avisos', titulo: 'Notificaciones', sub: 'Qué avisos quiere recibir', icono: Bell },
];

const PANTALLAS = {
  datos: MisDatos,
  puntos: Puntos,
  favoritos: Favoritos,
  direcciones: Direcciones,
  avisos: Notificaciones,
};

const Perfil = () => {
  const { user, logout } = useAuth();
  const { colores } = useTema();

  const [seccion, setSeccion] = useState(null);
  const [cliente, setCliente] = useState(null);

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

  const salir = () => {
    Alert.alert(
      '¿Cerrar sesión?',
      'Tendrá que volver a escribir su correo y su contraseña para entrar de nuevo.',
      [
        { text: 'Quedarme', style: 'cancel' },
        { text: 'Cerrar sesión', style: 'destructive', onPress: logout },
      ]
    );
  };

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
      </View>

      <ScrollView contentContainerStyle={estilos.cuerpo}>
        {/* Quién está dentro */}
        <View style={estilos.cabecera}>
          <View style={[estilos.avatar, { backgroundColor: colores.marca }]}>
            <Text style={estilos.avatarTexto}>{inicial}</Text>
          </View>
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
          Cerrar sesión no es un botón café: es la salida, y la salida se ofrece
          sin insistir. Igual mide 50 de alto, que es lo que un dedo necesita.
        */}
        <Pressable
          onPress={salir}
          accessibilityRole="button"
          style={({ pressed }) => [estilos.salir, pressed && estilos.salirPresionado]}
        >
          <LogOut size={17} color={COLORES.error} strokeWidth={2} />
          <Text style={estilos.salirTexto}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
};

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: COLORES.fondo,
  },
  barra: {
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
  salir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    marginTop: 22,
    borderRadius: 12,
  },
  salirPresionado: {
    backgroundColor: '#FDECEC',
  },
  salirTexto: {
    fontSize: 14.5,
    fontWeight: '600',
    color: COLORES.error,
  },
});

export default Perfil;
