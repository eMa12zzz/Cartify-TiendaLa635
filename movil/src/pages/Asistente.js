/*
 * ============================================================
 * ASISTENTE POR VOZ — el apartado, ahora de verdad
 * ============================================================
 * Reemplaza al placeholder ("Todavía no está disponible"). La lógica vive en
 * useAsistenteVoz; aquí solo se pinta. Ver ese archivo para lo que se dejó
 * afuera a propósito (elegir voz, ir a un producto específico, el upsell).
 * ============================================================
 */

import { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HelpCircle, Mic, Volume2, VolumeX } from 'lucide-react-native';
import { useColores, useEstilos, useModo } from '../context/ModoContext';
import Tiqui from '../components/Tiqui/Tiqui';
import { LLAVE_TIQUI_PRESENTADO } from './ConoceATiqui';
import { leer } from '../utils/almacen';
import { ALTURA_ESTADO } from '../theme/pantalla';
import { useTema } from '../context/TemaContext';
import { useTienda } from '../context/TiendaContext';
import { useAsistenteVoz } from '../hooks/useAsistenteVoz';
import { navegarA } from '../navigation/navigationRef';
import ModalProducto from '../components/Tienda/ModalProducto';
import { AIRE_ABAJO_MINIMO, ALTURA_BARRA_FLOTANTE } from '../components/UI/BarraInferior';

const Asistente = () => {
  const { colores } = useTema();
  const COLORES = useColores();
  const estilos = useEstilos(crearEstilos);
  const { bottom } = useSafeAreaInsets();
  const { productos, carrito, totalCarrito, agregarAlCarrito, eliminarDelCarrito, actualizarCantidad, limpiarCarrito } = useTienda();
  // Lo que pidió VER por voz ("muéstrame las manzanas"), no lo que agregó.
  const [productoAbierto, setProductoAbierto] = useState(null);

  const {
    activo, escuchando, muteado, transcripcion, historial, pensando, hablando,
    iniciar, detener, toggleMute, interrumpir,
  } = useAsistenteVoz({
    productos, carrito, totalCarrito, agregarAlCarrito, eliminarDelCarrito, actualizarCantidad, limpiarCarrito,
    mostrarProducto: setProductoAbierto,
  });

  const pulso = useRef(new Animated.Value(1)).current;
  const chatRef = useRef(null);
  const { oscuro } = useModo();

  /*
   * La primera vez que se entra aquí, Tiqui se presenta sola (ConoceATiqui).
   * Es lo que distingue a la tienda: no se deja a que alguien la descubra
   * por casualidad. Después se puede volver a ver con "¿Quién es Tiqui?".
   */
  useEffect(() => {
    let vivo = true;
    leer(LLAVE_TIQUI_PRESENTADO).then((visto) => {
      if (vivo && visto !== '1') navegarA('ConoceATiqui');
    });
    return () => { vivo = false; };
  }, []);

  // El anillo late mientras escucha; se para en cuanto deja de hacerlo.
  useEffect(() => {
    if (!escuchando) {
      pulso.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, { toValue: 1.12, duration: 550, useNativeDriver: true }),
        Animated.timing(pulso, { toValue: 1, duration: 550, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [escuchando, pulso]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollToEnd({ animated: true });
  }, [historial]);

  const items = carrito.reduce((a, i) => a + i.cantidad, 0);

  const estadoTexto = pensando
    ? 'Pensando…'
    : hablando ? 'Toca para interrumpir'
    : !activo ? 'Toca para empezar'
    : escuchando ? 'Escuchando…' : 'Un momento…';
  const micColor = escuchando ? COLORES.error : activo ? '#D97706' : colores.marca;

  const alTocarMic = hablando ? interrumpir : activo ? detener : iniciar;

  // La cara de Tiqui dice lo mismo que el texto de estado, sin tener que leerlo.
  const pose = escuchando ? 'escucha' : pensando ? 'piensa' : hablando ? 'habla' : historial.length === 0 ? 'saludo' : 'normal';
  // Como en la web: navy con rasgos blancos, y al revés en modo oscuro.
  const coloresTiqui = oscuro
    ? { cuerpo: '#FFFFFF', rasgo: '#003049' }
    : { cuerpo: '#003049', rasgo: '#FFFFFF' };

  return (
    <View style={estilos.pantalla}>
      <View style={[estilos.barra, { paddingTop: ALTURA_ESTADO + 10 }]}>
        <Text style={estilos.titulo} accessibilityRole="header">Tiqui, tu asistente</Text>
        <View style={estilos.acciones}>
          <TouchableOpacity
            onPress={() => navegarA('ConoceATiqui')}
            accessibilityRole="button"
            accessibilityLabel="¿Quién es Tiqui? Ver la presentación"
            hitSlop={8}
            style={estilos.accion}
          >
            <HelpCircle size={22} color={colores.marca} strokeWidth={1.8} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={toggleMute}
            accessibilityRole="button"
            accessibilityLabel={muteado ? 'Activar voz' : 'Silenciar voz'}
            hitSlop={8}
            style={estilos.accion}
          >
            {muteado
              ? <VolumeX size={22} color={COLORES.textoSuave} strokeWidth={1.8} />
              : <Volume2 size={22} color={colores.marca} strokeWidth={1.8} />}
          </TouchableOpacity>
        </View>
      </View>

      <View style={estilos.cuerpo}>
        {/* Tiqui, arriba del micrófono: a quien se le habla. Más chico cuando ya hay charla. */}
        <Tiqui
          pose={pose}
          extra={escuchando ? 'ondas' : null}
          alto={historial.length === 0 ? 150 : 96}
          cuerpo={coloresTiqui.cuerpo}
          rasgo={coloresTiqui.rasgo}
          cordon="#009AEB"
          acento="#009AEB"
        />

        <Animated.View style={[estilos.circulo, { backgroundColor: micColor, transform: [{ scale: pulso }] }]}>
          <TouchableOpacity style={estilos.tocable} onPress={alTocarMic} accessibilityRole="button" accessibilityLabel={estadoTexto}>
            <Mic size={44} color="#fff" strokeWidth={1.8} />
          </TouchableOpacity>
        </Animated.View>

        <Text style={[estilos.estado, { color: escuchando ? COLORES.error : colores.marca }]}>{estadoTexto}</Text>

        {escuchando && transcripcion ? (
          <Text style={estilos.transcripcion} numberOfLines={2}>…{transcripcion}</Text>
        ) : null}

        {historial.length === 0 ? (
          <Text style={estilos.bajada}>
            Soy Tiqui. Toca el micrófono y dime, por ejemplo: "quiero dos manzanas y una leche" o "¿qué ofertas hay?".
          </Text>
        ) : (
          <ScrollView ref={chatRef} style={estilos.chat} contentContainerStyle={estilos.chatContenido}>
            {historial.map((m) => (
              <View
                key={m.id}
                style={[
                  estilos.burbuja,
                  m.tipo === 'user'
                    ? { alignSelf: 'flex-end', backgroundColor: colores.marca }
                    : { alignSelf: 'flex-start', backgroundColor: COLORES.papelGris },
                ]}
              >
                <Text style={[estilos.burbujaTexto, m.tipo === 'user' && { color: '#fff' }]}>{m.texto}</Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      <TouchableOpacity accessibilityRole="button"
        activeOpacity={carrito.length === 0 ? 1 : 0.7}
        onPress={() => carrito.length > 0 && navegarA('Carrito')}
        style={[
          estilos.carritoResumen,
          {
            borderColor: colores.marcaSuave,
            backgroundColor: colores.marcaTenue,
            // Esta barra es el último hijo de la pantalla, no contenido que
            // se desliza: si no le deja hueco a la píldora de abajo (que
            // flota por ENCIMA, pintada por el propio Tab Navigator), el
            // toque en "Tu carrito" lo captura la píldora y no esto.
            paddingBottom: 14 + Math.max(bottom, AIRE_ABAJO_MINIMO) + ALTURA_BARRA_FLOTANTE,
          },
        ]}
      >
        <View style={estilos.carritoFila}>
          <Text style={estilos.carritoTitulo}>Tu carrito ({items})</Text>
          <Text style={[estilos.carritoTotal, { color: colores.marcaTexto }]}>${totalCarrito.toFixed(2)}</Text>
        </View>
        {carrito.length === 0 ? (
          <Text style={estilos.carritoVacio}>Aún no has agregado nada.</Text>
        ) : (
          <Text style={estilos.carritoDetalle} numberOfLines={2}>
            {carrito.map((i) => `${i.cantidad}× ${i.nombre}`).join(' · ')}
          </Text>
        )}
      </TouchableOpacity>

      {productoAbierto && (
        <ModalProducto
          producto={productoAbierto}
          alCerrar={() => setProductoAbierto(null)}
          alAgregar={agregarAlCarrito}
          conBarraFlotante
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.linea,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titulo: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORES.tituloFuerte,
    letterSpacing: -0.4,
  },
  acciones: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  // 44 × 44: el mínimo para atinarle con el pulgar sin tocar el de al lado.
  accion: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cuerpo: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 16,
  },
  circulo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginTop: 8,
    marginBottom: 14,
  },
  tocable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  estado: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  transcripcion: {
    fontSize: 14,
    fontStyle: 'italic',
    color: COLORES.textoSuave,
    textAlign: 'center',
    marginBottom: 8,
  },
  bajada: {
    fontSize: 14.5,
    lineHeight: 22,
    color: COLORES.textoSuave,
    textAlign: 'center',
    marginTop: 8,
  },
  chat: {
    flex: 1,
    width: '100%',
    marginTop: 8,
  },
  chatContenido: {
    gap: 8,
    paddingBottom: 12,
  },
  burbuja: {
    maxWidth: '85%',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
  },
  burbujaTexto: {
    fontSize: 14,
    color: COLORES.tituloFuerte,
  },
  carritoResumen: {
    borderTopWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  carritoFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  carritoTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORES.tituloFuerte,
  },
  carritoTotal: {
    fontSize: 17,
    fontWeight: '800',
  },
  carritoVacio: {
    fontSize: 13,
    color: COLORES.textoTenue,
    marginTop: 4,
  },
  carritoDetalle: {
    fontSize: 13,
    color: COLORES.textoSuave,
    marginTop: 4,
  },
});

export default Asistente;
