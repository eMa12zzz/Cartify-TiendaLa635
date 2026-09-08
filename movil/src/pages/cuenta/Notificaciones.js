/*
 * ============================================================
 * NOTIFICACIONES — qué avisos quiere recibir
 * ============================================================
 * Los tres interruptores de `frontend/src/pages/cliente/Notificaciones.jsx`,
 * con las mismas claves, porque escriben en el mismo documento: cambiar uno
 * desde el teléfono tiene que verse al abrir la tienda en la computadora.
 *
 * ── Se guarda solo (y se deshace solo si falla) ──
 *
 * No hay botón de guardar. Un interruptor que se mueve pero no cuenta hasta que
 * uno baja a apretar "Guardar" es la manera de que la gente salga de la
 * pantalla creyendo que ya quedó. Se manda al tocarlo, como en la web.
 *
 * El interruptor se pinta ANTES de que conteste el servidor, porque un switch
 * que se queda quieto medio segundo se toca dos veces. Si el guardado falla, se
 * devuelve a donde estaba y se avisa: quedarse encendido de mentira sería
 * prometer avisos que nunca van a llegar.
 *
 * ── De momento esto es una preferencia, no una notificación ──
 *
 * Marcar la casilla guarda la preferencia en la cuenta; todavía no hay avisos
 * push saliendo hacia el teléfono, ni aquí ni en la web. Se dice tal cual abajo
 * de la lista: prometer "le avisamos cuando su pedido esté cerca" y que nunca
 * suene nada es peor que no ofrecerlo.
 * ============================================================
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORES } from '../../theme/colores';
import { useAuth } from '../../hooks/useAuth';
import { useTema } from '../../context/TemaContext';
import { useAviso } from '../../context/AvisoContext';
import { getCliente, actualizarNotificaciones } from '../../api/clienteApi';
import BarraCuenta from '../../components/Cuenta/BarraCuenta';
import Boton from '../../components/UI/Boton';

// Los mismos valores por defecto que la web, para que un cliente nuevo vea lo
// mismo en los dos lados antes de tocar nada.
const POR_DEFECTO = { promociones: true, nuevosProductos: true, pedidoCerca: false };

const OPCIONES = [
  { clave: 'promociones', titulo: 'Promociones nuevas', sub: 'Avíseme de ofertas y descuentos.' },
  { clave: 'nuevosProductos', titulo: 'Productos nuevos', sub: 'Avíseme cuando lleguen productos.' },
  { clave: 'pedidoCerca', titulo: 'Mi pedido va en camino', sub: 'Avíseme cuando mi pedido esté cerca.' },
];

// Mismo tiempo que --dur-press en la web: es el mismo interruptor, misma duración.
const DURACION_INTERRUPTOR = 160;

/*
 * El interruptor. La bolita se mueve con `transform` y no cambiando `left`
 * porque es lo único que no obliga a recalcular la posición de todo lo que
 * tiene al lado en cada fotograma — mismo criterio que el de la web. El color
 * del riel no admite el driver nativo, así que todo el progreso (bolita y
 * color) corre por un solo `Animated.Value` en el hilo de JS.
 */
const Interruptor = ({ encendido, alTocar, color, etiqueta }) => {
  const progreso = useRef(new Animated.Value(encendido ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progreso, {
      toValue: encendido ? 1 : 0,
      duration: DURACION_INTERRUPTOR,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [encendido, progreso]);

  return (
    <Pressable
      onPress={alTocar}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityState={{ checked: encendido }}
      accessibilityLabel={etiqueta}
    >
      <Animated.View
        style={[
          estilos.riel,
          {
            backgroundColor: progreso.interpolate({
              inputRange: [0, 1],
              outputRange: [COLORES.borde, color],
            }),
          },
        ]}
      >
        <Animated.View
          style={[
            estilos.bolita,
            {
              transform: [
                { translateX: progreso.interpolate({ inputRange: [0, 1], outputRange: [0, 19] }) },
              ],
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
};

const Notificaciones = ({ alVolver }) => {
  const { user } = useAuth();
  const { colores } = useTema();
  const { avisar } = useAviso();

  const [prefs, setPrefs] = useState(POR_DEFECTO);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const cliente = await getCliente(user.id);
      setPrefs({ ...POR_DEFECTO, ...(cliente?.notificationPrefs || {}) });
    } catch (e) {
      setError(e?.message || 'No se pudieron cargar sus preferencias');
    } finally {
      setCargando(false);
    }
  }, [user?.id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const alternar = async (clave) => {
    const antes = prefs;
    const despues = { ...prefs, [clave]: !prefs[clave] };

    setPrefs(despues); // se ve al instante
    try {
      // Solo la que cambió: el controlador la mezcla con las que ya estaban.
      await actualizarNotificaciones(user.id, { [clave]: despues[clave] });
    } catch (e) {
      setPrefs(antes);
      avisar(e?.message || 'No se pudo guardar la preferencia', 'error');
    }
  };

  return (
    <View style={estilos.pantalla}>
      <BarraCuenta titulo="Notificaciones" alVolver={alVolver} />

      {cargando ? (
        <View style={estilos.centro}>
          <ActivityIndicator size="large" color={colores.marca} />
        </View>
      ) : error ? (
        <View style={estilos.centro}>
          <Text style={estilos.errorTitulo}>No se pudieron cargar sus preferencias</Text>
          <Text style={estilos.errorTexto}>{error}</Text>
          <View style={estilos.botonError}>
            <Boton
              texto="Reintentar"
              alPresionar={cargar}
              color={colores.marca}
              colorPresionado={colores.marcaOscuro}
            />
          </View>
        </View>
      ) : (
        <View style={estilos.cuerpo}>
          {OPCIONES.map((op) => (
            <View key={op.clave} style={estilos.fila}>
              <View style={estilos.textos}>
                <Text style={estilos.titulo}>{op.titulo}</Text>
                <Text style={estilos.sub}>{op.sub}</Text>
              </View>

              <Interruptor
                encendido={!!prefs[op.clave]}
                alTocar={() => alternar(op.clave)}
                color={colores.marca}
                etiqueta={op.titulo}
              />
            </View>
          ))}

          <Text style={estilos.pie}>
            Por ahora esto queda guardado en su cuenta. Los avisos al teléfono todavía no están
            encendidos.
          </Text>
        </View>
      )}
    </View>
  );
};

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: COLORES.fondo,
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  errorTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORES.tituloFuerte,
  },
  errorTexto: {
    fontSize: 13.5,
    lineHeight: 20,
    color: COLORES.textoSuave,
    textAlign: 'center',
  },
  botonError: {
    marginTop: 12,
    alignSelf: 'stretch',
  },
  cuerpo: {
    padding: 16,
    gap: 10,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    borderWidth: 1,
    borderColor: COLORES.lineaCard,
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 14,
  },
  textos: {
    flexShrink: 1,
    gap: 2,
  },
  titulo: {
    fontSize: 14.5,
    fontWeight: '600',
    color: COLORES.tituloVentaja,
  },
  sub: {
    fontSize: 12.5,
    lineHeight: 18,
    color: COLORES.textoSuave,
  },
  riel: {
    width: 46,
    height: 27,
    borderRadius: 14,
    padding: 2.5,
    justifyContent: 'center',
  },
  bolita: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },
  pie: {
    marginTop: 6,
    paddingHorizontal: 4,
    fontSize: 12.5,
    lineHeight: 19,
    color: COLORES.textoTenue,
    textAlign: 'center',
  },
});

export default Notificaciones;
