/*
 * ============================================================
 * DETALLE DE PRODUCTO
 * ============================================================
 * La foto en grande, el precio y de ahí al carrito. Es la versión corta de
 * `ProductDetailModal.jsx`: se dejaron fuera las reseñas y las
 * recomendaciones, que son dos apartados enteros (uno pega contra
 * /api/review y el otro arma similitudes entre productos) y no entran en esta
 * pantalla.
 *
 * ── Una diferencia con la web, a propósito ──
 *
 * La web agrega de uno en uno: su botón llama a `onAgregarAlCarrito(producto, 1)`
 * y punto. Aquí hay un selector de cantidad, y se mueve al PASO de la unidad
 * del producto: de uno en uno las piezas, de media en media las libras.
 *
 * No es un capricho. En la web, quien quiere media libra de queso abre el
 * carrito y la corrige ahí; en un teléfono ese viaje son dos pantallas de ida
 * y dos de vuelta. Y agregar "1" a un producto que se vende por peso, cuando
 * el propio sistema sabe que su paso es 0.5, es hacer que el cliente pida más
 * de lo que quería. Ver utils/unidades.js.
 * ============================================================
 */

import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// El Image de expo-image y no el de react-native: el nativo no decodifica
// WebP/AVIF de forma fiable, y las fotos vienen de Cloudinary en .webp.
import { Image } from 'expo-image';
import { COLORES } from '../../theme/colores';
import { useTema } from '../../context/TemaContext';
import { useEdad } from '../../context/EdadContext';
import Boton from '../UI/Boton';
import { Equis, Mas, Menos, Paquete } from '../UI/Iconos';
import { useBotonAtras } from '../../hooks/useBotonAtras';
import { cantidadConUnidad, esPorLibra, esSoloAdultos, pasoDe, piezasEnTexto, ajustarCantidad } from '../../utils/unidades';
import { AIRE_ABAJO_MINIMO, ALTURA_BARRA_FLOTANTE } from '../UI/BarraInferior';

/*
 * `conBarraFlotante`: true solo cuando quien abre este detalle vive DENTRO
 * de un apartado del Tab (Inicio, Asistente, Favoritos) — ahí la píldora de
 * abajo flota por encima y tapa el botón "Agregar" si no se le deja hueco.
 * Desde Carrito o Sección no hace falta: son pantallas de Stack que
 * reemplazan el Tab entero, sin píldora detrás, y sumar el hueco ahí solo
 * dejaría un espacio muerto bajo el botón.
 */
const ModalProducto = ({ producto, alCerrar, alAgregar, conBarraFlotante = false }) => {
  const [fallóImagen, setFallóImagen] = useState(false);
  const { colores } = useTema();
  const { bottom } = useSafeAreaInsets();
  const paso = pasoDe(producto);
  const [cantidad, setCantidad] = useState(paso);
  /*
   * Defensa extra, no la puerta principal: la puerta es TarjetaProducto (ahí
   * se tapa la foto y no se llega hasta aquí). Pero esta ficha también se
   * abre desde el asistente de voz (Asistente.js → mostrarProducto), que no
   * pasa por esa tarjeta — así que "Agregar" vuelve a preguntar por su
   * cuenta, igual que useDetalleProducto.js en la web.
   */
  const { mayorConfirmado, pedirConfirmacion } = useEdad();

  // La hoja entra deslizándose desde abajo mientras el fondo se oscurece,
  // y sale al revés al cerrar — nunca desaparece de golpe.
  const fondoOpacidad = useRef(new Animated.Value(0)).current;
  const panelY = useRef(new Animated.Value(300)).current;
  const cerrandoRef = useRef(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fondoOpacidad, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(panelY, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fondoOpacidad, panelY]);

  /*
   * Todo lo que cierra —tocar fuera, la "X", el botón atrás de Android, o
   * agregar y salir— pasa por aquí: primero la hoja baja y el fondo se
   * aclara, y solo CUANDO terminan de verdad se avisa al que llama
   * (alCerrar), que es quien de verdad la quita de pantalla.
   * `cerrandoRef` evita relanzar la animación si tocan dos veces seguidas.
   */
  const cerrarConAnimacion = () => {
    if (cerrandoRef.current) return;
    cerrandoRef.current = true;
    Animated.parallel([
      Animated.timing(fondoOpacidad, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(panelY, {
        toValue: 300,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => alCerrar());
  };

  // El botón de atrás de Android cierra la hoja, no la app. Ver el hook.
  useBotonAtras(cerrarConAnimacion);

  /*
   * Arrastrar el asa. Se guarda el alto real del panel (varía con el
   * contenido: un producto con descripción larga mide distinto que uno
   * sin ella) para poder comparar contra SU mitad, no un número fijo.
   */
  const panelAlturaRef = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      // Recién a partir de un arrastre de verdad: un toque corto en el asa
      // (que ya no hace nada) no debe robarle el gesto a nadie.
      onMoveShouldSetPanResponder: (_evento, gesto) => Math.abs(gesto.dy) > 4,
      /*
       * Sin esto, un arrastre largo terminaba en el ScrollView de abajo
       * pidiendo (y llevándose) el control a medio camino — el gesto se
       * "soltaba" ahí (onPanResponderTerminate) y el toque de "pasó la
       * mitad" nunca llegaba a evaluarse: la hoja SIEMPRE volvía a subir,
       * sin importar cuánto se hubiera bajado. Rechazar la cesión mantiene
       * el gesto entero, de principio a fin, en manos de este asa.
       */
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_evento, gesto) => {
        // Solo baja. Arrastrar hacia arriba no "abre más" — no hay más.
        if (gesto.dy > 0) panelY.setValue(gesto.dy);
      },
      onPanResponderRelease: (_evento, gesto) => {
        const mitad = (panelAlturaRef.current || 400) / 2;
        if (gesto.dy > mitad) {
          cerrarConAnimacion();
        } else {
          // No pasó de la mitad: vuelve a su lugar, con el mismo resorte
          // que la apertura.
          Animated.timing(panelY, {
            toValue: 0,
            duration: 200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start();
        }
      },
      // Si soltó a medio arrastre sin terminar el gesto (una llamada entra,
      // por ejemplo), que no se quede la hoja a medio bajar.
      onPanResponderTerminate: () => {
        Animated.timing(panelY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  if (!producto) return null;

  const agotado = producto.stock === 0;
  const contenido = piezasEnTexto(producto);
  const topeAlcanzado = cantidad >= producto.stock;

  const mover = (delta) => {
    const siguiente = ajustarCantidad(producto, cantidad + delta);
    // Nunca por debajo de un paso ni por encima de lo que hay.
    setCantidad(Math.max(paso, Math.min(siguiente, producto.stock)));
  };

  return (
    /*
     * Una vista sobre la pantalla, no un <Modal>. El Modal de React Native se
     * dibuja en una capa nativa por encima de TODO, y ahí el aviso de
     * "agregado al carrito" quedaba tapado. Ver hooks/useBotonAtras.js.
     */
    <View style={estilos.capa}>
      <Animated.View style={[estilos.fondo, { opacity: fondoOpacidad }]}>
        {/*
          Tocar fuera cierra. Es un Pressable del tamaño del fondo DEBAJO del
          panel, no un envoltorio: envolviéndolo, cada toque dentro del panel
          burbujearía hasta aquí y cerraría el detalle al intentar tocar "+".
        */}
        <Pressable style={estilos.zonaCierre} onPress={cerrarConAnimacion} accessibilityLabel="Cerrar" />

        <Animated.View
          style={[estilos.panel, { transform: [{ translateY: panelY }] }]}
          onLayout={(e) => { panelAlturaRef.current = e.nativeEvent.layout.height; }}
        >
          <View style={estilos.encabezado}>
            {/*
              El asa ahora sí se arrastra: baja con el dedo, y al soltar
              decide sola — pasó la mitad del panel, cierra; si no, vuelve
              a subir. La zona de agarre es más grande que el dibujo (38x4)
              para no repetir el problema de un blanco angosto.
            */}
            <View style={estilos.zonaAsa} {...panResponder.panHandlers}>
              <View style={estilos.asa} />
            </View>
            <Pressable
              onPress={cerrarConAnimacion}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Cerrar el detalle"
              style={estilos.cerrar}
            >
              <Equis size={16} color={COLORES.textoSuave} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={estilos.contenido} bounces={false}>
            <View style={estilos.marcoImagen}>
              {producto.imagen && !fallóImagen ? (
                <Image
                  source={{ uri: producto.imagen }}
                  contentFit="contain"
                  style={estilos.imagen}
                  onError={() => setFallóImagen(true)}
                />
              ) : (
                <Paquete size={64} />
              )}
            </View>

            {!!producto.marca && <Text style={estilos.marca}>{producto.marca.toUpperCase()}</Text>}

            <View style={estilos.filaNombre}>
              <Text style={estilos.nombre}>{producto.nombre}</Text>
              {esSoloAdultos(producto) && (
                <View style={estilos.marca18}>
                  <Text style={estilos.marca18Texto}>+18</Text>
                </View>
              )}
            </View>

            <View style={estilos.filaPrecio}>
              {!!producto.precioAnterior && (
                <Text style={estilos.precioViejo}>${Number(producto.precioAnterior).toFixed(2)}</Text>
              )}
              <Text style={estilos.precio}>
                ${Number(producto.precio).toFixed(2)}
                {esPorLibra(producto) && <Text style={estilos.porUnidad}>/lb</Text>}
              </Text>
            </View>

            {!!contenido && <Text style={estilos.contenidoTexto}>{contenido}</Text>}

            <View
              style={[
                estilos.estadoStock,
                { backgroundColor: colores.marcaSuave },
                agotado && estilos.estadoAgotado,
              ]}
            >
              <Text
                style={[
                  estilos.estadoTexto,
                  { color: colores.marcaOscuro },
                  agotado && estilos.estadoTextoAgotado,
                ]}
              >
                {agotado
                  ? 'Agotado'
                  : `En existencia · ${cantidadConUnidad(producto, producto.stock)}`}
              </Text>
            </View>

            {!!producto.descripcion && (
              <>
                <Text style={estilos.tituloSeccion}>Descripción</Text>
                <Text style={estilos.descripcion}>{producto.descripcion}</Text>
              </>
            )}

            {!agotado && (
              <>
                <Text style={estilos.tituloSeccion}>Cantidad</Text>
                <View style={estilos.selector}>
                  <Pressable
                    onPress={() => mover(-paso)}
                    disabled={cantidad <= paso}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Quitar uno"
                    style={({ pressed }) => [
                      estilos.botonPaso,
                      pressed && { backgroundColor: colores.marcaSuave },
                      cantidad <= paso && estilos.botonPasoApagado,
                    ]}
                  >
                    <Menos size={13} color={cantidad <= paso ? COLORES.marcador : COLORES.texto} />
                  </Pressable>

                  <Text style={estilos.cantidad}>{cantidadConUnidad(producto, cantidad)}</Text>

                  <Pressable
                    onPress={() => mover(paso)}
                    disabled={topeAlcanzado}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Agregar uno"
                    style={({ pressed }) => [
                      estilos.botonPaso,
                      pressed && { backgroundColor: colores.marcaSuave },
                      topeAlcanzado && estilos.botonPasoApagado,
                    ]}
                  >
                    <Mas size={13} color={topeAlcanzado ? COLORES.marcador : COLORES.texto} />
                  </Pressable>
                </View>
              </>
            )}
          </ScrollView>

          {/*
            El botón vive FUERA del scroll: es a lo que se vino, y en un
            producto con descripción larga quedaba al final de todo, a dos
            deslizadas de distancia.
          */}
          <View
            style={[
              estilos.pie,
              conBarraFlotante && {
                paddingBottom: 26 + Math.max(bottom, AIRE_ABAJO_MINIMO) + ALTURA_BARRA_FLOTANTE,
              },
            ]}
          >
            <Boton
              texto={agotado ? 'Agotado' : `Agregar · $${(producto.precio * cantidad).toFixed(2)}`}
              deshabilitado={agotado}
              color={colores.marca}
              colorPresionado={colores.marcaOscuro}
              alPresionar={() => {
                const meter = () => {
                  alAgregar(producto, cantidad);
                  cerrarConAnimacion();
                };
                if (esSoloAdultos(producto) && !mayorConfirmado) {
                  pedirConfirmacion(meter);
                  return;
                }
                meter();
              }}
            />
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const estilos = StyleSheet.create({
  capa: {
    ...StyleSheet.absoluteFillObject,
    // Por encima de la tienda, por debajo del aviso (que se dibuja después,
    // ya fuera de esta pantalla).
    zIndex: 10,
    elevation: 10,
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
    // Tope de alto: el detalle es una hoja que sube, no una pantalla entera.
    maxHeight: '88%',
  },
  /*
   * minHeight a propósito: "cerrar" es absoluta y mide más (top:8 + 32 de
   * alto = 40) que lo que este encabezado ocupaba antes solo con el asa
   * (~14px). Sin este mínimo, el ScrollView de abajo —que se dibuja
   * DESPUÉS, ya que es el hermano siguiente— quedaba encima de la mitad de
   * abajo de la "X" y se robaba el toque: se veía perfecto pero no cerraba.
   */
  encabezado: {
    paddingTop: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    minHeight: 44,
  },
  // La zona de agarre del asa: bastante más ancha y alta que el dibujo
  // (38x4) para que arrastrarla no dependa de acertarle a algo angosto.
  zonaAsa: {
    paddingVertical: 14,
    paddingHorizontal: 60,
  },
  // El asa de la hoja: dice "esto se puede bajar" sin escribirlo.
  asa: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORES.borde,
  },
  // Más metida en la esquina que antes (era right:14, top:6).
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
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 18,
  },
  marcoImagen: {
    backgroundColor: '#F4F4F5',
    height: 210,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    marginBottom: 16,
  },
  imagen: {
    width: '100%',
    height: '100%',
  },
  marca: {
    fontSize: 11,
    color: '#AAAAAA',
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  filaNombre: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  nombre: {
    fontSize: 21,
    fontWeight: '700',
    color: COLORES.tituloFuerte,
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  marca18: {
    backgroundColor: COLORES.error,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  marca18Texto: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  filaPrecio: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 9,
    marginTop: 10,
  },
  precioViejo: {
    fontSize: 14,
    color: '#BBBBBB',
    textDecorationLine: 'line-through',
  },
  precio: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORES.tituloFuerte,
  },
  porUnidad: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORES.textoTenue,
  },
  contenidoTexto: {
    fontSize: 12.5,
    color: COLORES.textoTenue,
    marginTop: 3,
    fontWeight: '500',
  },
  // El fondo y el color de letra los pone la temporada en línea; aquí solo la
  // forma. Dejarlos escritos además sería tener dos verdades sobre lo mismo.
  estadoStock: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 13,
    marginTop: 14,
  },
  estadoAgotado: {
    backgroundColor: '#FDECEC',
  },
  estadoTexto: {
    fontSize: 12,
    fontWeight: '700',
  },
  estadoTextoAgotado: {
    color: '#C0392B',
  },
  tituloSeccion: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORES.tituloVentaja,
    marginTop: 20,
    marginBottom: 7,
  },
  descripcion: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORES.textoVentaja,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    borderWidth: 1,
    borderColor: COLORES.borde,
    borderRadius: 12,
    padding: 4,
  },
  botonPaso: {
    width: 38,
    height: 38,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F6F5F4',
  },
  botonPasoApagado: {
    backgroundColor: '#FAFAFA',
  },
  cantidad: {
    minWidth: 66,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: COLORES.texto,
  },
  pie: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 26,
    borderTopWidth: 1,
    borderTopColor: COLORES.linea,
  },
});

export default ModalProducto;
