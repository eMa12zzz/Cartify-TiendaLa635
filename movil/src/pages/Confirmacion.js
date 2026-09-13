/*
 * ============================================================
 * CONFIRMACIÓN — el pedido ya está hecho
 * ============================================================
 * La tercera vista de `ShoppingCart.jsx`: el visto verde, el número del
 * pedido, en qué va y qué llevaba.
 *
 * ── Se pinta el pedido que devolvió el servidor, no el carrito ──
 *
 * Es la diferencia con la web, y no es un capricho. Allá esta pantalla dibuja
 * los `items` del carrito y una fecha hecha con `new Date()` en el navegador:
 * lo que se enseña es lo que se PIDIÓ, no lo que quedó guardado. Los dos casi
 * siempre coinciden, pero cuando no —el servidor recalcula el total, aplica los
 * puntos que de verdad tenía, redondea distinto— el cliente se lleva un número
 * que nadie más va a volver a ver.
 *
 * Aquí se pinta la respuesta de `POST /order`, que trae el pedido tal cual
 * quedó, con su `_id` de verdad. Ese número es el que va a decir en el
 * mostrador, y el mismo que va a encontrar en "Mis pedidos".
 *
 * ── El carrito se vacía al SALIR de aquí, no al llegar ──
 *
 * Si se vaciara al crear el pedido, esta pantalla se dibujaría sobre una lista
 * que se acaba de quedar vacía. Se vacía cuando el cliente cierra, que es
 * cuando ya no lo necesita nadie.
 * ============================================================
 */

import { useMemo, useState } from 'react';
import { StyleSheet, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bike, Check, Package } from 'lucide-react-native';
import { COLORES } from '../theme/colores';
import { ALTURA_ESTADO } from '../theme/pantalla';
import { useTema } from '../context/TemaContext';
import { useTienda } from '../context/TiendaContext';
import { useBotonAtras } from '../hooks/useBotonAtras';
import { useSeguimientoEnVivo } from '../hooks/useSeguimientoEnVivo';
import { pasosDe, indiceDePaso } from '../utils/pasosPedido';
import Boton from '../components/UI/Boton';
import { Estrella } from '../components/UI/Iconos';
import CodigoEntrega from '../components/Tienda/CodigoEntrega';
import MapaSeguimiento from '../components/Tienda/MapaSeguimiento';

/*
 * Una fila por producto, con su propia foto. El pedido que devuelve
 * `POST /order` no viene con `items.productId` poblado (ver el comentario
 * grande más arriba: acá se pinta la respuesta cruda del servidor) — así que
 * la imagen no sale de ahí, sino del catálogo que la tienda YA tiene cargado
 * en memoria para el listado normal (mismo id de producto, cero peticiones
 * nuevas y sin tocar el backend).
 */
const FilaProducto = ({ item, imagen }) => {
  const [fallóImagen, setFallóImagen] = useState(false);

  return (
    <View style={estilos.filaProducto}>
      <View style={estilos.miniatura}>
        {imagen && !fallóImagen ? (
          <Image
            source={{ uri: imagen }}
            contentFit="contain"
            style={estilos.miniaturaImagen}
            onError={() => setFallóImagen(true)}
          />
        ) : (
          <Package size={19} color={COLORES.marcador} strokeWidth={1.5} />
        )}
      </View>
      <Text style={estilos.nombreProducto} numberOfLines={2}>
        {item.name || 'Producto'}
      </Text>
      <Text style={estilos.cantidad}>×{item.amount}</Text>
      <Text style={estilos.precio}>
        ${(Number(item.price) * Number(item.amount)).toFixed(2)}
      </Text>
    </View>
  );
};

const fechaLarga = (iso) => {
  try {
    return new Date(iso || Date.now()).toLocaleDateString('es-SV', {
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

const Confirmacion = ({ respuesta, alCerrar }) => {
  const { colores } = useTema();
  // Mismo caso que Carrito.js: sin esto "Volver a la tienda" queda debajo de
  // la franja de gestos de Android.
  const { bottom } = useSafeAreaInsets();
  const { vaciarTrasPedido, productos } = useTienda();
  const imagenPorId = useMemo(
    () => new Map(productos.map((p) => [String(p.id), p.imagen])),
    [productos]
  );

  /*
   * Cerrar es lo único que se puede hacer desde aquí, así que el carrito se
   * vacía justo aquí y no en el checkout: mientras esta pantalla está abierta,
   * el pedido todavía se está leyendo.
   *
   * El botón de atrás de Android hace lo mismo. Sin esto cerraba la app y
   * dejaba el carrito con los productos que ya se habían comprado: al volver a
   * abrir, el contador seguía marcando tres.
   */
  const cerrar = () => {
    vaciarTrasPedido();
    alCerrar();
  };

  useBotonAtras(cerrar);

  const pedido = respuesta?.order || {};
  const items = Array.isArray(pedido.items) ? pedido.items : [];
  const puntosGanados = Number(respuesta?.pointsEarned) || 0;
  const descuento = Number(respuesta?.discount) || 0;

  /*
   * El pedido en sí (productos, subtotal, total, puntos) se queda como llegó
   * de POST /order a propósito — ver el comentario grande arriba de este
   * archivo. Pero el ESTADO no: recién hecho el pedido, esta pantalla se
   * queda abierta un rato (el cliente lee el código, la dirección...), y si
   * en ese rato la tienda ya lo puso a preparar, mostrar "Recibido" tachado
   * de pasado es peor que no decir nada — la burbuja de abajo, viendo el
   * mismo pedido, ya lo diría distinto. Mismo hook y mismo criterio que
   * BurbujaPedido.js: `seguimiento.estado` manda si contesta, `pedido.status`
   * de respaldo mientras no ha contestado la primera vez.
   */
  const seguimiento = useSeguimientoEnVivo(pedido._id, !!pedido._id);
  const estado = seguimiento.estado || pedido.status;

  // Los pasos que le tocan a ESTE pedido: "En camino" solo si es a domicilio.
  // Antes esta pantalla traía sus tres pasos fijos ("Recibida, En camino,
  // Entregada") sin importar cómo lo pidieron, así que un retiro en el local
  // se veía con un paso de reparto que nunca le iba a tocar.
  const PASOS = pasosDe(pedido.deliveryType);
  const pasoActual = indiceDePaso(PASOS, estado);

  /*
   * El mapa: la dirección de entrega desde el principio (para que el
   * cliente vea A DÓNDE se lo van a llevar apenas paga), y el punto del
   * repartidor solo cuando de verdad va en camino con señal fresca. Mismo
   * criterio que `SeguimientoConfirmacion.jsx` en la web.
   */
  const esDomicilio = pedido.deliveryType === 'delivery';
  const enCamino = esDomicilio && seguimiento.enVivo;
  const tieneDestino = esDomicilio && seguimiento.destino?.lat != null && seguimiento.destino?.lng != null;

  // Los últimos seis del id, en mayúsculas: el mismo número corto que enseña
  // "Mis pedidos", para que sean reconociblemente el mismo pedido.
  const numero = String(pedido._id || '').slice(-6).toUpperCase();

  return (
    <View style={estilos.pantalla}>
      <ScrollView contentContainerStyle={[estilos.cuerpo, { paddingTop: ALTURA_ESTADO + 24 }]}>
        <View style={[estilos.circulo, { backgroundColor: colores.marca }]}>
          <Check size={34} color="#FFFFFF" strokeWidth={3.5} />
        </View>

        <Text style={estilos.titulo}>Su pedido está hecho</Text>
        {!!numero && <Text style={estilos.numero}>Pedido #{numero}</Text>}
        <Text style={estilos.fecha}>Recibido el {fechaLarga(pedido.createdAt)}</Text>

        {/* ── En qué va ── */}
        <View style={estilos.linea}>
          {PASOS.map((paso, i) => {
            // Inclusivo (<=), no exclusivo: el paso actual también cuenta
            // como "hecho" aquí — esta fila no distingue "en curso" de
            // "completado" con un tercer color, a propósito, para que se lea
            // igual de simple que en la web (ver EstadoPedido.jsx).
            const hecho = i <= pasoActual;
            return (
              <View key={paso.id} style={estilos.paso}>
                <View style={estilos.pasoMarca}>
                  {/*
                    La rayita va PRIMERO en el árbol para que el punto se
                    pinte encima de ella y no al revés. React Native apila por
                    orden de aparición sin importar `position: absolute`, así
                    que con el punto primero la raya terminaba tapando la
                    mitad de los puntos apagados —del mismo tono que ella— y
                    se veían mordidos en vez de redondos.
                  */}
                  {i < PASOS.length - 1 && <View style={estilos.raya} />}
                  <View
                    style={[
                      estilos.punto,
                      hecho ? { backgroundColor: colores.marca } : estilos.puntoApagado,
                    ]}
                  />
                </View>
                <Text style={[estilos.pasoTexto, hecho && { color: colores.marca, fontWeight: '700' }]}>
                  {paso.label}
                </Text>
              </View>
            );
          })}
        </View>

        {tieneDestino && (
          <View style={estilos.marcoMapa}>
            <MapaSeguimiento
              punto={enCamino ? seguimiento.punto : null}
              destino={seguimiento.destino}
              alto={180}
              colorMarca={colores.marca}
            />
            <View style={estilos.infoMapa}>
              {enCamino ? (
                <>
                  <Bike size={15} color={seguimiento.yaCasi ? '#14663A' : '#173F94'} strokeWidth={2.4} />
                  <Text style={[estilos.infoMapaTexto, { color: seguimiento.yaCasi ? '#14663A' : '#173F94' }]}>
                    {seguimiento.yaCasi ? 'Ya casi toca su puerta' : seguimiento.espera}
                    {seguimiento.distancia ? ` · a ${seguimiento.distancia}` : ''}
                  </Text>
                </>
              ) : estado === 'entregado' ? (
                <>
                  <Check size={15} color={COLORES.textoSuave} strokeWidth={2.4} />
                  <Text style={estilos.infoMapaTexto}>Entregado en su dirección</Text>
                </>
              ) : (
                <Text style={estilos.infoMapaTexto}>
                  Aquí le llevaremos su pedido. En cuanto el repartidor salga, verá su punto moverse.
                </Text>
              )}
            </View>
          </View>
        )}

        <View style={estilos.bloqueCodigo}>
          <CodigoEntrega
            codigo={pedido.deliveryCode}
            deliveryType={pedido.deliveryType}
            estado={estado}
          />
        </View>

        {/* ── Qué llevaba ── */}
        <View style={estilos.tarjeta}>
          <Text style={estilos.tarjetaTitulo}>Productos</Text>

          {items.map((item, i) => (
            // La clave es el índice porque las líneas del pedido no tienen id
            // propio (el esquema las guarda con `_id: false`).
            <FilaProducto key={i} item={item} imagen={imagenPorId.get(String(item.productId))} />
          ))}

          <View style={estilos.separador} />

          <Fila etiqueta="Subtotal" valor={`$${Number(pedido.subtotal || 0).toFixed(2)}`} />
          {descuento > 0 && (
            <Fila etiqueta="Descuento por puntos" valor={`−$${descuento.toFixed(2)}`} verde />
          )}
          <View style={estilos.filaTotal}>
            <Text style={estilos.totalEtiqueta}>Total</Text>
            <Text style={estilos.totalValor}>${Number(pedido.total || 0).toFixed(2)}</Text>
          </View>
        </View>

        {/* ── Cómo y dónde ── */}
        <View style={estilos.tarjeta}>
          <Fila
            etiqueta={pedido.deliveryType === 'delivery' ? 'Envío a domicilio' : 'Retiro en el local'}
            valor={
              pedido.paymentMethod === 'saldo'
                ? 'Pagado con saldo'
                : pedido.paymentMethod === 'tarjeta'
                  ? 'Paga con tarjeta'
                  : 'Paga en efectivo'
            }
          />
          {!!pedido.deliveryAddress && (
            <Text style={estilos.direccion}>{pedido.deliveryAddress}</Text>
          )}
          {!!pedido.deliveryReference && (
            <Text style={estilos.referencia}>{pedido.deliveryReference}</Text>
          )}
          {/*
            Se dice DÓNDE se paga, no solo con qué. Es la pregunta que sigue
            —"¿entonces cuándo pago?"— y con la pasarela todavía sin conectar la
            respuesta importa: nadie va a cobrarle desde la app.
          */}
          {pedido.paymentMethod !== 'saldo' && (
            <Text style={estilos.aclaracion}>
              {pedido.deliveryType === 'delivery'
                ? 'Se paga al recibir el pedido.'
                : 'Se paga al pasar a traerlo.'}
            </Text>
          )}
        </View>

        {puntosGanados > 0 && (
          <View style={[estilos.puntos, { backgroundColor: colores.marcaTenue }]}>
            <Estrella size={15} color={colores.marca} />
            <Text style={[estilos.puntosTexto, { color: colores.marca }]}>
              Ganó {puntosGanados} {puntosGanados === 1 ? 'punto' : 'puntos'} con esta compra
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={[estilos.pie, { paddingBottom: Math.max(bottom + 10, 18) }]}>
        <Boton
          texto="Volver a la tienda"
          alPresionar={cerrar}
          color={colores.marca}
          colorPresionado={colores.marcaOscuro}
        />
      </View>
    </View>
  );
};

const Fila = ({ etiqueta, valor, verde }) => (
  <View style={estilos.fila}>
    <Text style={estilos.filaEtiqueta}>{etiqueta}</Text>
    <Text style={[estilos.filaValor, verde && estilos.filaValorVerde]}>{valor}</Text>
  </View>
);

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: COLORES.fondo,
  },
  cuerpo: {
    paddingHorizontal: 20,
    paddingBottom: 26,
    alignItems: 'center',
  },
  circulo: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  titulo: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORES.tituloFuerte,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  numero: {
    marginTop: 6,
    fontSize: 14.5,
    fontWeight: '700',
    color: COLORES.tituloVentaja,
  },
  fecha: {
    marginTop: 3,
    fontSize: 12.5,
    color: COLORES.textoTenue,
    textAlign: 'center',
  },
  linea: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    marginTop: 24,
    marginBottom: 4,
  },
  bloqueCodigo: {
    alignSelf: 'stretch',
    marginTop: 20,
  },
  marcoMapa: {
    alignSelf: 'stretch',
    marginTop: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORES.lineaCard,
    overflow: 'hidden',
  },
  infoMapa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F7F7F7',
  },
  infoMapaTexto: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORES.textoSuave,
  },
  paso: {
    flex: 1,
    alignItems: 'center',
    gap: 7,
  },
  pasoMarca: {
    width: '100%',
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  punto: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  puntoApagado: {
    backgroundColor: COLORES.borde,
  },
  // Va de la mitad de ESTE punto a la mitad del siguiente: empieza en el centro
  // (left: 50%) y mide un paso completo (width: 100%), así el otro extremo cae
  // justo en el centro del próximo paso, sin importar cuánto mida el texto.
  raya: {
    position: 'absolute',
    left: '50%',
    width: '100%',
    height: 2,
    backgroundColor: COLORES.linea,
  },
  pasoTexto: {
    fontSize: 12,
    color: COLORES.textoTenue,
    textAlign: 'center',
  },
  tarjeta: {
    alignSelf: 'stretch',
    marginTop: 20,
    borderWidth: 1,
    borderColor: COLORES.lineaCard,
    borderRadius: 14,
    padding: 15,
    gap: 9,
  },
  tarjetaTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORES.tituloFuerte,
  },
  filaProducto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  miniatura: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F7F7',
    padding: 5,
  },
  miniaturaImagen: {
    width: '100%',
    height: '100%',
  },
  nombreProducto: {
    flex: 1,
    fontSize: 13.5,
    color: COLORES.textoVentaja,
  },
  cantidad: {
    fontSize: 12.5,
    color: COLORES.textoTenue,
  },
  precio: {
    fontSize: 13.5,
    fontWeight: '600',
    color: COLORES.tituloVentaja,
    minWidth: 58,
    textAlign: 'right',
  },
  separador: {
    height: 1,
    backgroundColor: COLORES.lineaCard,
    marginVertical: 2,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  filaEtiqueta: {
    flexShrink: 1,
    fontSize: 13,
    color: COLORES.textoSuave,
  },
  filaValor: {
    fontSize: 13,
    color: COLORES.textoVentaja,
  },
  filaValorVerde: {
    color: '#16A34A',
    fontWeight: '600',
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
  aclaracion: {
    fontSize: 12,
    color: COLORES.textoSuave,
    fontStyle: 'italic',
  },
  puntos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'stretch',
    marginTop: 14,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  puntosTexto: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  pie: {
    paddingHorizontal: 20,
    paddingTop: 12,
    // paddingBottom real se pone en línea, con la franja de gestos sumada.
    borderTopWidth: 1,
    borderTopColor: COLORES.linea,
  },
});

export default Confirmacion;
