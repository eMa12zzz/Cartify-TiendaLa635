/*
 * ============================================================
 * PEDIDOS — el historial de compras del cliente
 * ============================================================
 * El equivalente de `frontend/src/pages/cliente/MisPedidos.jsx`: una tarjeta por
 * compra con su número, su fecha, en qué va, qué llevaba y cuánto sumó.
 *
 * Trae los datos aquí mismo y no en un contexto, al revés que la tienda o los
 * favoritos: esos dos los necesitan varias pantallas a la vez (el corazón de una
 * tarjeta, el contador del carrito), pero los pedidos solo se miran en esta. Un
 * proveedor para un solo consumidor es una capa que hay que leer para entender
 * algo que se explica solo.
 *
 * ── Los colores de estado no siguen la temporada ──
 *
 * Son los mismos cuatro de la web, fijos. "Entregado" tiene que verse verde en
 * diciembre igual que en agosto: ahí el color no decora, informa, y un pedido
 * cancelado pintado del rojo navideño se leería como que todo está bien.
 * ============================================================
 */

import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { Package } from 'lucide-react-native';
import { COLORES } from '../theme/colores';
import { ALTURA_ESTADO } from '../theme/pantalla';
import { useAuth } from '../hooks/useAuth';
import { useTema } from '../context/TemaContext';
import { getPedidosDeCliente } from '../api/pedidosApi';
import Boton from '../components/UI/Boton';
import { Estrella } from '../components/UI/Iconos';
import { useAlturaBarraInferior } from '../components/UI/BarraInferior';

// Los cuatro estados del modelo Order, con el color con el que los pinta la web.
const ESTADOS = {
  pagado: { texto: 'Pagado', color: '#2563EB', fondo: '#E8EFFD' },
  preparando: { texto: 'Preparando', color: '#D97706', fondo: '#FBF0DF' },
  entregado: { texto: 'Entregado', color: '#16A34A', fondo: '#E4F5EA' },
  cancelado: { texto: 'Cancelado', color: '#DC2626', fondo: '#FBE7E7' },
};

/*
 * "12 ene 2026". La web usa `toLocaleDateString('es-SV', ...)` y aquí se hace
 * igual, pero con respaldo: Android sin los datos de idioma cargados devuelve la
 * fecha en inglés en vez de reventar, y eso se ve mal pero no rompe nada.
 */
const fechaCorta = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('es-SV', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
};

/*
 * El número que se le enseña al cliente son los últimos seis del id de Mongo, en
 * mayúsculas — mismo criterio que la web. El id entero mide 24 caracteres: nadie
 * lo dicta por teléfono, y seis bastan para que en el mostrador encuentren cuál
 * es.
 */
const numeroCorto = (id) => String(id || '').slice(-6).toUpperCase();

const TarjetaPedido = ({ pedido }) => {
  const estado = ESTADOS[pedido.status] || ESTADOS.pagado;

  return (
    <View style={estilos.tarjeta}>
      <View style={estilos.cabecera}>
        <View style={estilos.identidad}>
          <Text style={estilos.numero}>Pedido #{numeroCorto(pedido._id)}</Text>
          <Text style={estilos.fecha}>{fechaCorta(pedido.createdAt)}</Text>
        </View>

        <View style={[estilos.chapa, { backgroundColor: estado.fondo }]}>
          <Text style={[estilos.chapaTexto, { color: estado.color }]}>{estado.texto}</Text>
        </View>
      </View>

      <View style={estilos.lineas}>
        {(pedido.items || []).map((item, i) => (
          /*
           * La clave es el índice porque las líneas del pedido no tienen `_id`
           * propio (el esquema las guarda con `_id: false`) y el mismo producto
           * puede aparecer dos veces. Es un caso donde el índice sí sirve: la
           * lista de un pedido cerrado no se reordena ni se le quitan renglones.
           */
          <View key={i} style={estilos.linea}>
            <Text style={estilos.lineaNombre} numberOfLines={1}>
              {/* `name` es la foto del nombre al momento de comprar; si un
                  pedido viejo no la trae, se cae al producto poblado. */}
              {item.amount}× {item.name || item.productId?.name || 'Producto'}
            </Text>
            <Text style={estilos.lineaPrecio}>
              ${(Number(item.price) * Number(item.amount)).toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      <View style={estilos.pie}>
        {pedido.pointsEarned > 0 ? (
          <View style={estilos.puntos}>
            <Estrella size={13} color={COLORES.marca} />
            <Text style={estilos.puntosTexto}>+{pedido.pointsEarned} puntos</Text>
          </View>
        ) : (
          // Un hueco vacío para que el total se quede pegado a la derecha
          // aunque el pedido no haya dado puntos.
          <View />
        )}
        <Text style={estilos.total}>Total: ${Number(pedido.total).toFixed(2)}</Text>
      </View>
    </View>
  );
};

const Pedidos = () => {
  const { user } = useAuth();
  const { colores } = useTema();
  // La píldora flotante vive ENCIMA de la pantalla, no en su propio renglón:
  // sin este relleno en la pantalla entera, la lista se desliza hasta el
  // borde de abajo de verdad y cualquier pedido pasa un momento detrás de
  // la barra al hacer scroll, no solo el último.
  const alturaBarra = useAlturaBarraInferior();

  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Los pedidos son de un CLIENTE. El personal entra por la misma puerta, y
  // preguntar por los pedidos de un id de empleado devuelve una lista vacía que
  // se leería como "usted nunca ha comprado". Mismo criterio que useMyOrders.
  const esCliente = user?.type === 'client' && !!user?.id;

  const cargar = useCallback(async () => {
    if (!esCliente) {
      setPedidos([]);
      setCargando(false);
      return;
    }

    setCargando(true);
    setError('');

    try {
      const lista = await getPedidosDeCliente(user.id);
      setPedidos(Array.isArray(lista) ? lista : []);
    } catch (e) {
      /*
       * Se distingue "no ha comprado nada" de "no se pudo preguntar". Sin este
       * estado, el backend apagado se ve exactamente igual que un cliente nuevo
       * — y uno de los dos tiene arreglo.
       */
      setError(e?.message || 'No se pudieron cargar sus pedidos');
    } finally {
      setCargando(false);
    }
  }, [esCliente, user?.id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <View style={[estilos.pantalla, { paddingBottom: alturaBarra }]}>
      <View style={[estilos.barra, { paddingTop: ALTURA_ESTADO + 10 }]}>
        <Text style={estilos.titulo}>Mis pedidos</Text>
        {!cargando && !error && pedidos.length > 0 && (
          <Text style={estilos.conteo}>
            {pedidos.length} {pedidos.length === 1 ? 'pedido' : 'pedidos'}
          </Text>
        )}
      </View>

      {cargando ? (
        <View style={estilos.centro}>
          <ActivityIndicator size="large" color={colores.marca} />
        </View>
      ) : error ? (
        <View style={estilos.centro}>
          <Text style={estilos.errorTitulo}>No se pudieron cargar sus pedidos</Text>
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
      ) : pedidos.length === 0 ? (
        // Vacío es una invitación, no una disculpa (igual que en la web).
        <View style={estilos.centro}>
          <Package size={38} color={COLORES.marcador} strokeWidth={1.5} />
          <Text style={estilos.vacioTitulo}>Todavía no tiene pedidos</Text>
          <Text style={estilos.vacioTexto}>
            Cuando compre en la tienda, sus pedidos van a aparecer aquí.
          </Text>
        </View>
      ) : (
        <FlatList
          data={pedidos}
          keyExtractor={(p) => String(p._id)}
          contentContainerStyle={estilos.lista}
          renderItem={({ item }) => <TarjetaPedido pedido={item} />}
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
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.linea,
  },
  titulo: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORES.tituloFuerte,
    letterSpacing: -0.4,
  },
  conteo: {
    fontSize: 12.5,
    fontWeight: '500',
    color: COLORES.subtitulo,
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
  vacioTitulo: {
    marginTop: 4,
    fontSize: 15.5,
    fontWeight: '700',
    color: COLORES.tituloFuerte,
  },
  vacioTexto: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORES.textoSuave,
    textAlign: 'center',
  },
  lista: {
    padding: 16,
    gap: 12,
  },
  tarjeta: {
    borderWidth: 1,
    borderColor: COLORES.lineaCard,
    borderRadius: 14,
    padding: 15,
    gap: 12,
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  identidad: {
    flexShrink: 1,
    gap: 2,
  },
  numero: {
    fontSize: 14.5,
    fontWeight: '700',
    color: COLORES.tituloVentaja,
  },
  fecha: {
    fontSize: 12,
    color: COLORES.textoTenue,
  },
  chapa: {
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  chapaTexto: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  lineas: {
    gap: 5,
  },
  linea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  lineaNombre: {
    flexShrink: 1,
    fontSize: 13.5,
    color: COLORES.textoVentaja,
  },
  lineaPrecio: {
    fontSize: 13.5,
    color: COLORES.textoVentaja,
  },
  pie: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: COLORES.lineaCard,
  },
  puntos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  puntosTexto: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORES.marca,
  },
  total: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORES.tituloFuerte,
  },
});

export default Pedidos;
