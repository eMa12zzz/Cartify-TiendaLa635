import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bike, X, ChevronRight, Clock } from 'lucide-react-native';
import { usePedidoActivoCtx } from '../../context/PedidoActivoContext';
import { useAuth } from '../../hooks/useAuth';
import { useTema } from '../../context/TemaContext';
import { useSeguimientoEnVivo } from '../../hooks/useSeguimientoEnVivo';
import { useTiempoPorZona } from '../../hooks/useTiempoPorZona';
import { pasosDe, indiceDePaso } from '../../utils/pasosPedido';
import { navegarA } from '../../navigation/navigationRef';
import { AIRE_ABAJO_MINIMO, ALTURA_BARRA_FLOTANTE } from '../UI/BarraInferior';
import CodigoEntrega from './CodigoEntrega';
import PasosPedido from './PasosPedido';
import { suscribirseAActividad } from '../../utils/actividadUsuario';

/*
 * ============================================================
 * BURBUJA DE PEDIDO — el seguimiento sin salir de la tienda
 * ============================================================
 * Copia de `frontend/src/components/Store/BurbujaPedido.jsx`: mientras un
 * pedido no esté entregado, el cliente lo ve flotando en la esquina en
 * cualquier apartado en el que esté — no solo en "Pedidos", que es la
 * pestaña donde iría a buscarlo si no existiera esto.
 *
 * Vive montada junto al navegador (ver App.js), no dentro de una pantalla:
 * así sigue ahí al cambiar de apartado o al abrir el carrito, en vez de
 * desaparecer y tener que ir a buscar el estado a mano.
 *
 * ── Qué NO trae, a propósito ──
 * La web muestra un mapita en miniatura con el repartidor acercándose
 * (MapaSeguimiento). Aquí no: el texto de la espera ("Llega en 10 min
 * aprox.", "Ya casi toca su puerta") ya dice lo que importa, y meter un mapa
 * chico aquí es una WebView más corriendo todo el tiempo que la burbuja está
 * abierta. Si hace falta el mapa de verdad, es un siguiente paso, no parte
 * de este.
 *
 * Va abajo a la IZQUIERDA porque no hay nada propio de la app en esa
 * esquina (el asistente de voz y el carrito viven en la barra de arriba).
 * ============================================================
 */

const VERDE_LATIDO = '#8ee6a8';

const BurbujaPedido = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colores } = useTema();
  const { orders } = usePedidoActivoCtx();
  const [abierta, setAbierta] = useState(false);

  /*
   * Cerrar NO desaparece la burbuja: la encoge. Si el pedido avanza (lo
   * empiezan a preparar, sale el repartidor) se reabre sola.
   */
  const [encogidaEn, setEncogidaEn] = useState(null); // { id, novedad }

  /*
   * Aparte de "encogida" (la decide el cliente, tocando la X): "oculta" la
   * decide la propia pantalla, cuando el cliente está haciendo otra cosa
   * —scrolleando, cambiando de pestaña— y la burbuja se corre casi entera
   * fuera de la pantalla para no estorbar. Un pedacito se queda a la vista a
   * propósito: sigue ahí, se puede volver a sacar con un toque, y no es un
   * "cerrar" del todo.
   */
  const [oculta, setOculta] = useState(false);
  const [anchoPildora, setAnchoPildora] = useState(0);

  const esCliente = user?.type === 'client';

  const enCurso = esCliente
    ? (orders || [])
        .filter((o) => ['pagado', 'preparando', 'en_camino'].includes(o.status))
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0]
    : null;

  // Los hooks necesitan el id ANTES de cualquier return: no se llaman a medias.
  const seguimiento = useSeguimientoEnVivo(enCurso?._id, !!enCurso);
  const zona = useTiempoPorZona(
    !enCurso || seguimiento.enVivo ? null : enCurso.deliveryLat,
    !enCurso || seguimiento.enVivo ? null : enCurso.deliveryLng
  );

  // El puntito que respira, en la burbuja cerrada: ver estilos.pulso.
  const pulso = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const bucle = Animated.loop(
      Animated.timing(pulso, {
        toValue: 1,
        duration: 1800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    );
    bucle.start();
    return () => bucle.stop();
  }, [pulso]);

  // 0 = a la vista, 1 = corrida casi entera fuera de pantalla.
  const desplazamiento = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(desplazamiento, {
      toValue: oculta ? 1 : 0,
      duration: oculta ? 260 : 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [oculta, desplazamiento]);

  /*
   * El último pedido visto, para seguir pintando algo coherente MIENTRAS la
   * burbuja entera se desvanece. Sin esto, en cuanto el pedido se entrega
   * `enCurso` pasa a `undefined` de golpe y la animación de salida no tiene
   * qué mostrar durante esos 180ms — se vería un hueco en blanco, no un
   * desvanecido.
   */
  const ultimoPedidoRef = useRef(null);
  if (enCurso) ultimoPedidoRef.current = enCurso;
  const pedido = enCurso || ultimoPedidoRef.current;

  const estado = pedido ? seguimiento.estado || pedido.status : null;

  // "Hay pedido activo AHORA" usa `enCurso` (el dato fresco), no `pedido`
  // (que puede ser el último recordado): es lo que decide si la burbuja
  // tiene que estar entrando o saliendo.
  const hayPedidoActivo = esCliente && !!enCurso && estado !== 'cancelado' && estado !== 'entregado';

  /*
   * Presencia de TODA la burbuja: entra con un resorte al aparecer el
   * primer pedido en curso, y sale con un fundido al entregarse o
   * cancelarse. `montada` mantiene el árbol vivo durante esos 180ms de
   * salida; sin él, el `return null` de más abajo la borraría de un
   * frame a otro y no habría nada que animar.
   */
  const [montada, setMontada] = useState(false);
  const presencia = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (hayPedidoActivo) {
      setMontada(true);
      setOculta(false);
      Animated.spring(presencia, {
        toValue: 1,
        friction: 9,
        tension: 60,
        useNativeDriver: true,
      }).start();
    } else if (montada) {
      Animated.timing(presencia, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setMontada(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hayPedidoActivo]);

  /*
   * Quien avisa "el usuario se movió" no sabe nada de esta burbuja —son
   * media docena de listas sueltas y la barra de pestañas, ver
   * utils/actividadUsuario.js—; aquí solo se escucha. Si la tarjeta estaba
   * abierta se cierra de una vez: no tiene sentido correr 290px de tarjeta
   * fuera de pantalla, cuando lo que se guarda es la píldora chica.
   */
  useEffect(() => {
    if (!montada) return;
    return suscribirseAActividad(() => {
      setAbierta(false);
      setOculta(true);
    });
  }, [montada]);

  /*
   * Presencia de la TARJETA (el panel expandido) aparte de la burbuja: se
   * abre y se cierra muchas más veces de las que la burbuja entera aparece
   * o desaparece, así que tiene su propio fundido con un empujoncito desde
   * abajo — la misma idea que `.card-in` en la web, pero disparada por
   * `abierta` en vez de por el montaje.
   */
  const [tarjetaMontada, setTarjetaMontada] = useState(false);
  const presenciaTarjeta = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (abierta) {
      setTarjetaMontada(true);
      Animated.timing(presenciaTarjeta, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else if (tarjetaMontada) {
      Animated.timing(presenciaTarjeta, {
        toValue: 0,
        duration: 160,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setTarjetaMontada(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierta]);

  if (!montada || !pedido) return null;

  const esDomicilio = pedido.deliveryType === 'delivery';
  const PASOS = pasosDe(pedido.deliveryType);
  const pasoActual = indiceDePaso(PASOS, estado);
  const paso = PASOS[pasoActual] || PASOS[0];
  const estaEnCamino = estado === 'en_camino';
  const enCamino = estaEnCamino && seguimiento.enVivo;

  const novedad = `${estado}|${enCamino ? 'en-camino' : ''}`;
  const encogida = encogidaEn?.id === String(pedido._id) && encogidaEn?.novedad === novedad;

  const encoger = () => {
    setAbierta(false);
    setEncogidaEn({ id: String(pedido._id), novedad });
  };

  const agrandar = () => {
    setEncogidaEn(null);
    setAbierta(true);
  };

  const irAPedidos = () => navegarA('Tabs', { screen: 'pedidos' });

  /*
   * Arriba de la píldora flotante, no encima. `ALTURA_BARRA_FLOTANTE` es el
   * mismo alto que ModalPromo.js ya usa para no tapar su botón de guardar —
   * ver components/UI/BarraInferior.js. Se suma siempre, aunque en las
   * pantallas sueltas (Carrito, Checkout...) esa píldora no exista: ahí la
   * burbuja queda con un poco más de aire abajo de lo estrictamente
   * necesario, que es preferible a que tape el menú en las pantallas donde
   * sí está.
   */
  const posicion = {
    left: Math.max(20, insets.left),
    bottom: Math.max(insets.bottom, AIRE_ABAJO_MINIMO) + ALTURA_BARRA_FLOTANTE + 12,
  };

  // Ancho fijo cuando está encogida (botonRedondo, 44); medido cuando no
  // (el texto de la píldora cambia — "Preparando", "Ya casi llega"... — así
  // que su ancho no se puede saber de antemano, hay que preguntarle).
  const ANCHO_ENCOGIDA = 44;
  /*
   * Lo mínimo para que asome el puntito verde y ni una letra del texto — a
   * ojo contra el dibujo real, no contra la cuenta de paddings de memoria,
   * que salió corta. La confianza al tocarlo no depende de este número: la
   * da el hitSlop de abajo, pensado para una tira angosta.
   */
  const PEDACITO_VISIBLE = 15;
  const anchoActual = encogida ? ANCHO_ENCOGIDA : anchoPildora;
  const maxDesplazamiento = Math.max(anchoActual - PEDACITO_VISIBLE, 0);

  /*
   * La capa de toque de "oculta" (más abajo) va anclada al borde de la
   * PANTALLA (left: 0), no a `posicion.left` como el resto de la burbuja.
   * Ojo con esto: el pedacito visible queda a la IZQUIERDA de
   * `posicion.left` (ahí es donde termina el filo de la píldora ya
   * trasladada), no a la derecha — anclarla en `posicion.left` como el resto
   * dejaba la capa entera tapando el hueco de al lado en vez del filo.
   */
  const estiloCapturaOculta = {
    position: 'absolute',
    left: 0,
    bottom: posicion.bottom,
    width: posicion.left + PEDACITO_VISIBLE + 24,
    height: (encogida ? ANCHO_ENCOGIDA : 52) + 24,
  };

  const estiloPresencia = {
    opacity: presencia,
    transform: [
      { scale: presencia.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
      {
        translateX: desplazamiento.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -maxDesplazamiento],
        }),
      },
    ],
  };

  /*
   * Encogida: un botón redondo con el icono del paso, nada más. Ocupa poco,
   * no tapa la tienda y siempre se puede volver.
   */
  if (encogida) {
    const Icono = estaEnCamino ? Bike : paso.Icono;
    return (
      <>
        <Animated.View style={[estilos.botonRedondo, posicion, estiloPresencia, { backgroundColor: colores.marca }]}>
          <Pressable
            onPress={() => { setOculta(false); agrandar(); }}
            accessibilityRole="button"
            accessibilityLabel={`Ver su pedido: ${enCamino ? seguimiento.espera : paso.label}`}
            style={estilos.botonRedondoToque}
          >
            <Icono size={19} color="#FFFFFF" strokeWidth={2.3} />
          </Pressable>
        </Animated.View>
        {/* Ver el porqué de este Modal en el comentario grande junto al
            otro uso, más abajo. */}
        {oculta && (
          <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={() => setOculta(false)}>
            <View style={estilos.capaModalOculto} pointerEvents="box-none">
              <Pressable
                onPress={() => { setOculta(false); agrandar(); }}
                style={estiloCapturaOculta}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Mostrar el seguimiento del pedido"
              />
            </View>
          </Modal>
        )}
      </>
    );
  }

  return (
    <>
    <Animated.View style={[estilos.contenedor, posicion, estiloPresencia]}>
      {tarjetaMontada && (
        <Animated.View
          style={{
            opacity: presenciaTarjeta,
            transform: [
              { translateY: presenciaTarjeta.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
              { scale: presenciaTarjeta.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
            ],
          }}
        >
          <View style={estilos.tarjeta}>
            <View style={[estilos.cabecera, { backgroundColor: colores.marca }]}>
              <Text style={estilos.cabeceraTexto}>
                Pedido #{String(pedido._id).slice(-6).toUpperCase()}
              </Text>
              <Pressable onPress={encoger} hitSlop={8} accessibilityRole="button" accessibilityLabel="Encoger el seguimiento">
                <X size={16} color="#FFFFFF" />
              </Pressable>
            </View>

            {enCamino && (
              <View style={[estilos.bloqueInfo, { backgroundColor: seguimiento.yaCasi ? '#EFFAF1' : '#F7FAFF' }]}>
                <View style={estilos.filaIconoTexto}>
                  <Bike size={15} color={seguimiento.yaCasi ? '#14663A' : '#173F94'} strokeWidth={2.4} />
                  <Text style={[estilos.infoTitulo, { color: seguimiento.yaCasi ? '#14663A' : '#173F94' }]}>
                    {seguimiento.yaCasi ? 'Ya casi toca su puerta' : seguimiento.espera}
                  </Text>
                </View>
                <Text style={[estilos.infoDetalle, { color: seguimiento.yaCasi ? '#3C7A55' : '#5B76B0' }]}>
                  {seguimiento.repartidor ? `${seguimiento.repartidor} · ` : ''}
                  {seguimiento.distancia ? `a ${seguimiento.distancia} de su dirección` : 'Le llevan su pedido'}
                </Text>
              </View>
            )}

            {/*
              El tiempo real a su zona, mientras nadie ha salido todavía. Se
              apaga en cuanto hay repartidor en vivo (arriba): dos tiempos
              distintos en la misma tarjeta solo confunden.
            */}
            {!enCamino && esDomicilio && zona.hayDatos && (
              <View style={[estilos.bloqueInfo, { backgroundColor: '#F8FAF8' }]}>
                <View style={estilos.filaIconoTexto}>
                  <Clock size={14} color="#14663A" strokeWidth={2.4} />
                  <Text style={[estilos.infoTitulo, { color: '#14663A' }]}>{zona.texto}</Text>
                </View>
                <Text style={[estilos.infoDetalle, { color: '#6E8A78' }]}>{zona.respaldo}</Text>
              </View>
            )}

            <CodigoEntrega codigo={pedido.deliveryCode} estado={estado} compacto />

            <View style={estilos.cuerpo}>
              <PasosPedido deliveryType={pedido.deliveryType} estado={estado} />

              {esDomicilio && seguimiento.senalFria && (
                <Text style={estilos.notaPequena}>
                  Su pedido va en camino. La última novedad del repartidor fue hace{' '}
                  {seguimiento.minutosDesdeUltimoDato || 1} min.
                </Text>
              )}

              {esDomicilio && pedido.deliveryAddress && (
                <Text style={estilos.notaPequena}>Se lo llevamos a: {pedido.deliveryAddress}</Text>
              )}

              <Pressable onPress={irAPedidos} style={estilos.botonVerPedido}>
                <Text style={[estilos.botonVerPedidoTexto, { color: colores.marca }]}>Ver el pedido</Text>
                <ChevronRight size={14} color={colores.marca} />
              </Pressable>
            </View>
          </View>
        </Animated.View>
      )}

      {/* La burbuja: el icono del paso actual y su nombre */}
      <Pressable
        onPress={() => { setOculta(false); setAbierta((v) => !v); }}
        onLayout={(e) => setAnchoPildora(e.nativeEvent.layout.width)}
        accessibilityRole="button"
        accessibilityState={{ expanded: abierta }}
        accessibilityLabel={enCamino ? `Su pedido va en camino. ${seguimiento.espera}` : `Su pedido: ${paso.label}`}
        style={[estilos.botonBurbuja, { backgroundColor: seguimiento.yaCasi ? '#14663A' : colores.marca }]}
        /*
         * Generoso arriba y abajo a propósito: la píldora tiene las puntas
         * totalmente redondeadas (borderRadius 999), así que el filito que
         * queda a la vista al estar "oculta" se angosta cerca del borde
         * superior e inferior — sin este margen, tocar un poco fuera del
         * centro vertical del filo caía fuera de la forma real.
         */
        hitSlop={{ top: 22, bottom: 22, left: 10, right: 14 }}
      >
        {estaEnCamino ? (
          <Bike size={19} color="#FFFFFF" strokeWidth={2.2} />
        ) : (
          <paso.Icono size={19} color="#FFFFFF" strokeWidth={2.2} />
        )}
        <Text style={estilos.botonBurbujaTexto}>
          {enCamino ? (seguimiento.yaCasi ? 'Ya casi llega' : seguimiento.espera) : paso.label}
        </Text>
        {/* El puntito que respira: dice "esto sigue en curso" sin decir nada */}
        <View style={estilos.pulsoContenedor}>
          <Animated.View
            style={[
              estilos.pulsoAnillo,
              {
                opacity: pulso.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }),
                transform: [{ scale: pulso.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] }) }],
              },
            ]}
          />
          <View style={estilos.pulsoPunto} />
        </View>
      </Pressable>
    </Animated.View>

    {/*
      Por qué un Modal y no solo una capa aparte con más elevación: ya se
      intentó eso primero (misma esquina, sin el transform de la píldora,
      con hitSlop, hasta con contenido adentro para que no se aplanara) y el
      toque SIGUE cayendo en la tarjeta de producto de atrás — con TODO
      dibujado encima, incluido el color de fondo bien visible en el lugar
      correcto. La elevación/zIndex no está ganando la negociación de quién
      responde al toque contra lo que sea que haya debajo en el FlatList.
      Un Modal transparente abre una VENTANA nativa aparte, por encima de
      toda la Activity — no compite por elevación con nada, gana siempre.
      `pointerEvents="box-none"` en el envoltorio dejando pasar el toque a
      la tienda en el resto de la pantalla; el Pressable de adentro sí lo
      atrapa donde está, sin transform ni traducción.
    */}
    {oculta && (
      <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={() => setOculta(false)}>
        <View style={estilos.capaModalOculto} pointerEvents="box-none">
          <Pressable
            onPress={() => { setOculta(false); setAbierta((v) => !v); }}
            style={estiloCapturaOculta}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Mostrar el seguimiento del pedido"
          />
        </View>
      </Modal>
    )}
    </>
  );
};

const estilos = StyleSheet.create({
  contenedor: {
    position: 'absolute',
    zIndex: 900,
    elevation: 12,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 10,
  },
  // Toda la pantalla del Modal — pero "box-none" dice que ella misma no
  // atrapa nada, solo lo hace el Pressable que vive adentro (ver
  // estiloCapturaOculta). Sin esto, el Modal entero bloquearía la tienda
  // aunque el usuario toque bien lejos de la burbuja.
  capaModalOculto: {
    flex: 1,
  },
  botonRedondo: {
    position: 'absolute',
    zIndex: 900,
    elevation: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  botonRedondoToque: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tarjeta: {
    width: 290,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ECE7E1',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cabeceraTexto: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bloqueInfo: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2ED',
  },
  filaIconoTexto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoTitulo: {
    fontSize: 13,
    fontWeight: '800',
  },
  infoDetalle: {
    fontSize: 11.5,
    marginTop: 2,
  },
  cuerpo: {
    padding: 14,
  },
  notaPequena: {
    fontSize: 11.5,
    color: '#9CA3AF',
    marginTop: 10,
    lineHeight: 16,
  },
  botonVerPedido: {
    marginTop: 12,
    width: '100%',
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  botonVerPedidoTexto: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  botonBurbuja: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 999,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
  },
  botonBurbujaTexto: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pulsoContenedor: {
    width: 8,
    height: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulsoAnillo: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: VERDE_LATIDO,
  },
  pulsoPunto: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: VERDE_LATIDO,
  },
});

export default BurbujaPedido;
