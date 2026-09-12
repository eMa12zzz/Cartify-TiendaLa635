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

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Package } from 'lucide-react-native';
import { COLORES } from '../theme/colores';
import { ALTURA_ESTADO } from '../theme/pantalla';
import { useAuth } from '../hooks/useAuth';
import { useTema } from '../context/TemaContext';
import { getPedidosDeCliente } from '../api/pedidosApi';
// Los estados y su color viven en utils/pasosPedido.js: este historial y
// ModalPedido necesitan la misma chapa, y ya hubo un bug antes por tenerla
// copiada en dos archivos que un día dejaron de decir lo mismo.
import { ESTADOS_PEDIDO as ESTADOS } from '../utils/pasosPedido';
import Boton from '../components/UI/Boton';
import { Estrella } from '../components/UI/Iconos';
import PastillasCategoria from '../components/Tienda/PastillasCategoria';
import ModalPedido from '../components/Tienda/ModalPedido';
import { avisarActividad } from '../utils/actividadUsuario';

// Las tres ventanas de tiempo del filtro (además de "Todos", que ya resuelve
// PastillasCategoria). "Semana pasada"/"Mes pasado" son ventanas RODANTES
// —últimos 7 y últimos 30 días— y no la semana/mes de calendario anterior:
// es lo que espera alguien que busca "mis pedidos recientes", sin sorpresas
// por dónde cae el lunes.
const FILTROS_FECHA = ['Hoy', 'Semana pasada', 'Mes pasado'];
const DIA_MS = 24 * 60 * 60 * 1000;

const dentroDelFiltro = (iso, filtro) => {
  if (!filtro) return true;
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return false;

  if (filtro === 'Hoy') {
    const hoy = new Date();
    return (
      fecha.getFullYear() === hoy.getFullYear() &&
      fecha.getMonth() === hoy.getMonth() &&
      fecha.getDate() === hoy.getDate()
    );
  }

  const limite = filtro === 'Semana pasada' ? 7 * DIA_MS : 30 * DIA_MS;
  return Date.now() - fecha.getTime() <= limite;
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

const TarjetaPedido = ({ pedido, alPresionar }) => {
  const estado = ESTADOS[pedido.status] || ESTADOS.pagado;

  return (
    <Pressable
      onPress={alPresionar}
      accessibilityRole="button"
      accessibilityLabel={`Ver el detalle del pedido ${numeroCorto(pedido._id)}`}
      style={({ pressed }) => [estilos.tarjeta, pressed && estilos.tarjetaPresionada]}
    >
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
    </Pressable>
  );
};

const Pedidos = () => {
  const { user } = useAuth();
  const { colores } = useTema();

  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState(null); // null = "Todos"
  const [pedidoAbierto, setPedidoAbierto] = useState(null);

  // El más nuevo arriba, sin depender de en qué orden lo haya mandado el
  // servidor — mismo criterio defensivo que ya usa PedidoActivoContext para
  // elegir el pedido en curso.
  const pedidosFiltrados = useMemo(
    () =>
      pedidos
        .filter((p) => dentroDelFiltro(p.createdAt, filtro))
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    [pedidos, filtro]
  );

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
    <View style={estilos.pantalla}>
      <View style={[estilos.barra, { paddingTop: ALTURA_ESTADO + 10 }]}>
        <Text style={estilos.titulo}>Mis pedidos</Text>
        {!cargando && !error && pedidos.length > 0 && (
          <Text style={estilos.conteo}>
            {pedidosFiltrados.length} {pedidosFiltrados.length === 1 ? 'pedido' : 'pedidos'}
          </Text>
        )}
      </View>

      {!cargando && !error && pedidos.length > 0 && (
        // El View envolvente no es decoración: PastillasCategoria es un
        // ScrollView sin alto propio, y un ScrollView suelto dentro de un
        // padre flex:1 se estira a ocupar el espacio libre en vez de
        // encogerse a su contenido — el mismo View que ya lo envuelve en
        // Inicio.js es lo que evita eso ahí.
        <View>
          <PastillasCategoria categorias={FILTROS_FECHA} seleccionada={filtro} alSeleccionar={setFiltro} />
        </View>
      )}

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
      ) : pedidosFiltrados.length === 0 ? (
        // Un vacío distinto: sí ha comprado, solo que no en este período.
        <View style={estilos.centro}>
          <Package size={38} color={COLORES.marcador} strokeWidth={1.5} />
          <Text style={estilos.vacioTitulo}>Nada por aquí</Text>
          <Text style={estilos.vacioTexto}>No tiene pedidos en ese período.</Text>
        </View>
      ) : (
        <FlatList
          data={pedidosFiltrados}
          keyExtractor={(p) => String(p._id)}
          contentContainerStyle={estilos.lista}
          onScrollBeginDrag={avisarActividad}
          renderItem={({ item }) => (
            <TarjetaPedido pedido={item} alPresionar={() => setPedidoAbierto(item)} />
          )}
        />
      )}

      {pedidoAbierto && (
        <ModalPedido pedido={pedidoAbierto} alCerrar={() => setPedidoAbierto(null)} />
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
  tarjetaPresionada: {
    transform: [{ scale: 0.98 }],
    borderColor: COLORES.lineaCard,
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
