import { useEffect, useRef } from 'react';
import { Animated, Easing, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORES } from '../../theme/colores';
import { useTema } from '../../context/TemaContext';
import { useBotonAtras } from '../../hooks/useBotonAtras';
import { Equis, Estrella } from '../UI/Iconos';
import { ESTADOS_PEDIDO } from '../../utils/pasosPedido';
import CodigoEntrega from './CodigoEntrega';
import PasosPedido from './PasosPedido';

/*
 * ============================================================
 * DETALLE DE PEDIDO — ModalPedido.js
 * ============================================================
 * Qué llevaba, en qué va y cómo se paga un pedido del historial. Se abre al
 * tocar su tarjeta en "Mis pedidos" — mismo patrón que ModalProducto y
 * ModalPromo (hoja que sube desde abajo, con asa para arrastrar y cerrar);
 * ver esos dos archivos para el porqué de cada pieza del gesto, no se repite
 * aquí.
 *
 * A diferencia de la burbuja flotante, esto es una FOTO del pedido tal como
 * quedó la última vez que se refrescó la lista: no sondea el estado en vivo
 * con useSeguimientoEnVivo. Para eso ya está la burbuja mientras el pedido
 * sigue en curso; aquí se viene a revisar un pedido puntual del historial,
 * no a vigilarlo mientras se abre.
 * ============================================================
 */

const fechaLarga = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('es-SV', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
};

const ModalPedido = ({ pedido, alCerrar }) => {
  const { colores } = useTema();
  const { bottom } = useSafeAreaInsets();

  const fondoOpacidad = useRef(new Animated.Value(0)).current;
  const panelY = useRef(new Animated.Value(300)).current;
  const cerrandoRef = useRef(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fondoOpacidad, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(panelY, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fondoOpacidad, panelY]);

  const cerrarConAnimacion = () => {
    if (cerrandoRef.current) return;
    cerrandoRef.current = true;
    Animated.parallel([
      Animated.timing(fondoOpacidad, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(panelY, {
        toValue: 300,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => alCerrar());
  };

  useBotonAtras(cerrarConAnimacion);

  const panelAlturaRef = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evento, gesto) => Math.abs(gesto.dy) > 4,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_evento, gesto) => {
        if (gesto.dy > 0) panelY.setValue(gesto.dy);
      },
      onPanResponderRelease: (_evento, gesto) => {
        const mitad = (panelAlturaRef.current || 400) / 2;
        if (gesto.dy > mitad) {
          cerrarConAnimacion();
        } else {
          Animated.timing(panelY, {
            toValue: 0,
            duration: 200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.timing(panelY, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      },
    })
  ).current;

  if (!pedido) return null;

  const estado = ESTADOS_PEDIDO[pedido.status] || ESTADOS_PEDIDO.pagado;
  const numero = String(pedido._id || '').slice(-6).toUpperCase();
  const items = Array.isArray(pedido.items) ? pedido.items : [];
  const esCancelado = pedido.status === 'cancelado';

  return (
    <View style={estilos.capa}>
      <Animated.View style={[estilos.fondo, { opacity: fondoOpacidad }]}>
        <Pressable style={estilos.zonaCierre} onPress={cerrarConAnimacion} accessibilityLabel="Cerrar" />

        <Animated.View
          style={[estilos.panel, { transform: [{ translateY: panelY }] }]}
          onLayout={(e) => { panelAlturaRef.current = e.nativeEvent.layout.height; }}
        >
          <View style={estilos.encabezado}>
            <View style={estilos.zonaAsa} {...panResponder.panHandlers}>
              <View style={estilos.asa} />
            </View>
            <Pressable
              onPress={cerrarConAnimacion}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Cerrar el detalle del pedido"
              style={estilos.cerrar}
            >
              <Equis size={16} color={COLORES.textoSuave} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={[estilos.contenido, { paddingBottom: Math.max(bottom, 18) + 16 }]}
            bounces={false}
          >
            <View style={estilos.filaTitulo}>
              <View style={estilos.identidad}>
                <Text style={estilos.numero}>Pedido #{numero}</Text>
                <Text style={estilos.fecha}>{fechaLarga(pedido.createdAt)}</Text>
              </View>
              <View style={[estilos.chapa, { backgroundColor: estado.fondo }]}>
                <Text style={[estilos.chapaTexto, { color: estado.color }]}>{estado.texto}</Text>
              </View>
            </View>

            {esCancelado ? (
              <Text style={estilos.notaCancelado}>Este pedido fue cancelado.</Text>
            ) : (
              <View style={estilos.bloquePasos}>
                <PasosPedido deliveryType={pedido.deliveryType} estado={pedido.status} />
              </View>
            )}

            <CodigoEntrega codigo={pedido.deliveryCode} estado={pedido.status} compacto />

            <View style={estilos.tarjeta}>
              <Text style={estilos.tarjetaTitulo}>Productos</Text>
              {items.map((item, i) => (
                // Índice como clave: las líneas del pedido no traen `_id`
                // propio (el esquema las guarda con `_id: false`).
                <View key={i} style={estilos.filaProducto}>
                  <Text style={estilos.nombreProducto} numberOfLines={1}>
                    {item.amount}× {item.name || item.productId?.name || 'Producto'}
                  </Text>
                  <Text style={estilos.precioProducto}>
                    ${(Number(item.price) * Number(item.amount)).toFixed(2)}
                  </Text>
                </View>
              ))}
              <View style={estilos.separador} />
              <View style={estilos.filaTotal}>
                <Text style={estilos.totalEtiqueta}>Total</Text>
                <Text style={estilos.totalValor}>${Number(pedido.total || 0).toFixed(2)}</Text>
              </View>
            </View>

            <View style={estilos.tarjeta}>
              <Text style={estilos.tarjetaTitulo}>
                {pedido.deliveryType === 'delivery' ? 'Envío a domicilio' : 'Retiro en el local'}
              </Text>
              {!!pedido.deliveryAddress && <Text style={estilos.direccion}>{pedido.deliveryAddress}</Text>}
              {!!pedido.deliveryReference && <Text style={estilos.referencia}>{pedido.deliveryReference}</Text>}
              <View style={estilos.separador} />
              <View style={estilos.filaProducto}>
                <Text style={estilos.nombreProducto}>Método de pago</Text>
                <Text style={estilos.precioProducto}>
                  {pedido.paymentMethod === 'saldo'
                    ? 'Saldo'
                    : pedido.paymentMethod === 'tarjeta'
                      ? 'Tarjeta'
                      : 'Efectivo'}
                </Text>
              </View>
            </View>

            {pedido.pointsEarned > 0 && (
              <View style={[estilos.puntos, { backgroundColor: colores.marcaTenue }]}>
                <Estrella size={14} color={colores.marca} />
                <Text style={[estilos.puntosTexto, { color: colores.marca }]}>
                  Ganó {pedido.pointsEarned} {pedido.pointsEarned === 1 ? 'punto' : 'puntos'} con esta compra
                </Text>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const estilos = StyleSheet.create({
  capa: {
    ...StyleSheet.absoluteFillObject,
    /*
     * Más alto que BurbujaPedido.js (zIndex 900 / elevation 12): esta hoja
     * está DENTRO de Pedidos.js, pero la burbuja vive montada como hermana
     * del navegador entero (ver App.js). En Android el "elevation" compara
     * globalmente, no por rama del árbol, así que sin superar el suyo la
     * burbuja se colaba encima del fondo oscuro del modal — se veía
     * literalmente partida por la mitad.
     */
    zIndex: 950,
    elevation: 20,
  },
  fondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  zonaCierre: {
    flex: 1,
  },
  panel: {
    backgroundColor: COLORES.fondo,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '88%',
  },
  encabezado: {
    paddingTop: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    minHeight: 44,
  },
  zonaAsa: {
    paddingVertical: 14,
    paddingHorizontal: 60,
  },
  asa: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORES.borde,
  },
  cerrar: {
    position: 'absolute',
    right: 10,
    top: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contenido: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  filaTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 18,
  },
  identidad: {
    flexShrink: 1,
    gap: 2,
  },
  numero: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORES.tituloFuerte,
  },
  fecha: {
    fontSize: 12.5,
    color: COLORES.textoTenue,
  },
  chapa: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chapaTexto: {
    fontSize: 12,
    fontWeight: '700',
  },
  bloquePasos: {
    borderWidth: 1,
    borderColor: COLORES.lineaCard,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  notaCancelado: {
    fontSize: 13.5,
    color: COLORES.textoSuave,
    backgroundColor: '#FBE7E7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  tarjeta: {
    borderWidth: 1,
    borderColor: COLORES.lineaCard,
    borderRadius: 14,
    padding: 15,
    gap: 9,
    marginBottom: 14,
  },
  tarjetaTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORES.tituloFuerte,
  },
  filaProducto: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  nombreProducto: {
    flex: 1,
    fontSize: 13.5,
    color: COLORES.textoVentaja,
  },
  precioProducto: {
    fontSize: 13.5,
    color: COLORES.textoVentaja,
  },
  separador: {
    height: 1,
    backgroundColor: COLORES.lineaCard,
    marginVertical: 2,
  },
  filaTotal: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  totalEtiqueta: {
    fontSize: 14.5,
    fontWeight: '700',
    color: COLORES.tituloFuerte,
  },
  totalValor: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORES.tituloFuerte,
  },
  direccion: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORES.textoVentaja,
  },
  referencia: {
    fontSize: 11.5,
    color: COLORES.textoTenue,
  },
  puntos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  puntosTexto: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '600',
  },
});

export default ModalPedido;
