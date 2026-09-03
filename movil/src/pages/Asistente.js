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
import { Mic, Volume2, VolumeX } from 'lucide-react-native';
import { COLORES } from '../theme/colores';
import { ALTURA_ESTADO } from '../theme/pantalla';
import { useTema } from '../context/TemaContext';
import { useTienda } from '../context/TiendaContext';
import { useAsistenteVoz } from '../hooks/useAsistenteVoz';
import { navegarA } from '../navigation/navigationRef';
import ModalProducto from '../components/Tienda/ModalProducto';
import { AIRE_ABAJO_MINIMO, ALTURA_BARRA_FLOTANTE } from '../components/UI/BarraInferior';

const Asistente = () => {
  const { colores } = useTema();
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

  return (
    <View style={estilos.pantalla}>
      <View style={[estilos.barra, { paddingTop: ALTURA_ESTADO + 10 }]}>
        <Text style={estilos.titulo}>Asistente por voz</Text>
        <TouchableOpacity onPress={toggleMute} accessibilityLabel={muteado ? 'Activar voz' : 'Silenciar voz'}>
          {muteado
            ? <VolumeX size={22} color={COLORES.textoSuave} strokeWidth={1.8} />
            : <Volume2 size={22} color={colores.marca} strokeWidth={1.8} />}
        </TouchableOpacity>
      </View>

      <View style={estilos.cuerpo}>
        <Animated.View style={[estilos.circulo, { backgroundColor: micColor, transform: [{ scale: pulso }] }]}>
          <TouchableOpacity style={estilos.tocable} onPress={alTocarMic} accessibilityLabel={estadoTexto}>
            <Mic size={44} color="#fff" strokeWidth={1.8} />
          </TouchableOpacity>
        </Animated.View>

        <Text style={[estilos.estado, { color: escuchando ? COLORES.error : colores.marca }]}>{estadoTexto}</Text>

        {escuchando && transcripcion ? (
          <Text style={estilos.transcripcion} numberOfLines={2}>…{transcripcion}</Text>
        ) : null}

        {historial.length === 0 ? (
          <Text style={estilos.bajada}>
            Toca el micrófono y diga, por ejemplo: "quiero una manzana y dos galletas".
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
                    : { alignSelf: 'flex-start', backgroundColor: '#F0F0F0' },
                ]}
              >
                <Text style={[estilos.burbujaTexto, m.tipo === 'user' && { color: '#fff' }]}>{m.texto}</Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      <TouchableOpacity
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
          <Text style={[estilos.carritoTotal, { color: colores.marca }]}>${totalCarrito.toFixed(2)}</Text>
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
  cuerpo: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 28,
  },
  circulo: {
    width: 104,
    height: 104,
    borderRadius: 52,
    marginBottom: 16,
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
