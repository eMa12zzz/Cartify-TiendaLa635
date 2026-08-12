import { useState } from 'react';
import {
  ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet,
} from 'react-native';
import { clientColors as c, estadoColores, ui } from '../../theme/Usuario/clientColors';
import { useMyOrders } from '../../hooks/Usuario/useMyOrders';
import { orderService } from '../../api/Usuario/orderService';
import { aviso } from '../../utils/aviso';
import { fechaCorta } from '../../utils/fecha';
import { Estrella } from '../../components/UI/Iconos';
import { IconoPaquete } from '../../components/Usuario/IconosCuenta';

/*
 * MisPedidos — historial de pedidos del cliente (área "Mi Cuenta").
 * Puerto de `frontend/src/pages/cliente/MisPedidos.jsx`. La carga vive en
 * useMyOrders; aquí solo pintamos la lista de tarjetas de pedido.
 */

// Etiquetas + colores de estado (semánticos, no cambian con la paleta).
const estadoInfo = {
  pagado:     { label: 'Pagado',     ...estadoColores.pagado },
  preparando: { label: 'Preparando', ...estadoColores.preparando },
  entregado:  { label: 'Entregado',  ...estadoColores.entregado },
  cancelado:  { label: 'Cancelado',  ...estadoColores.cancelado },
};

/*
 * Valoración del SERVICIO de entrega (no del producto). Sale solo en los
 * pedidos a domicilio ya entregados. Una vez enviada, se muestra de solo lectura.
 */
const ValoracionServicio = ({ order }) => {
  const [sel, setSel] = useState(order.serviceRating?.rating || 0);
  const [comentario, setComentario] = useState(order.serviceRating?.comment || '');
  const [enviando, setEnviando] = useState(false);
  const [guardado, setGuardado] = useState(!!order.serviceRating?.rating);

  const enviar = async () => {
    if (!sel) { aviso('Elegí de 1 a 5 estrellas'); return; }
    setEnviando(true);
    try {
      await orderService.rateService(order._id, { rating: sel, comment: comentario });
      setGuardado(true);
      aviso('¡Gracias por valorar el servicio!');
    } catch {
      // El error ya se avisó en la capa de red.
    } finally {
      setEnviando(false);
    }
  };

  return (
    <View style={styles.valoracion}>
      <Text style={styles.valTitulo}>
        {guardado ? 'Valoraste el servicio de entrega' : '¿Qué tal estuvo la entrega?'}
      </Text>

      <View style={styles.estrellas}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity
            key={n}
            disabled={guardado || enviando}
            onPress={() => setSel(n)}
            style={{ padding: 2 }}
          >
            <Estrella size={20} color={sel >= n ? estadoColores.estrella : c.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

      {!guardado ? (
        <>
          <TextInput
            style={styles.textarea}
            value={comentario}
            onChangeText={setComentario}
            placeholder="¿Algo que contar del reparto? (opcional)"
            placeholderTextColor={c.textMuted}
            multiline
            numberOfLines={2}
          />
          <TouchableOpacity
            style={[styles.valBtn, enviando && { opacity: 0.6 }]}
            onPress={enviar}
            disabled={enviando}
          >
            <Text style={styles.valBtnText}>{enviando ? 'Enviando…' : 'Enviar valoración'}</Text>
          </TouchableOpacity>
        </>
      ) : (
        !!comentario && <Text style={styles.valComentario}>“{comentario}”</Text>
      )}
    </View>
  );
};

export default function MisPedidos() {
  const { orders, loading } = useMyOrders();

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.h1}>Mis pedidos</Text>

      {loading ? (
        <Text style={styles.cargando}>Cargando tus pedidos…</Text>
      ) : orders.length === 0 ? (
        <View style={styles.vacio}>
          <IconoPaquete size={40} color={c.textMuted} />
          <Text style={styles.vacioTitulo}>Aún no tienes pedidos</Text>
          <Text style={styles.vacioSub}>Cuando compres en la tienda, tus pedidos aparecerán aquí.</Text>
        </View>
      ) : (
        orders.map((order) => {
          const estado = estadoInfo[order.status] || estadoInfo.pagado;
          return (
            <View key={order._id} style={styles.card}>
              {/* Encabezado del pedido */}
              <View style={styles.cardHead}>
                <View>
                  <Text style={styles.pedidoId}>
                    Pedido #{String(order._id).slice(-6).toUpperCase()}
                  </Text>
                  <Text style={styles.fecha}>{fechaCorta(order.createdAt)}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: estado.bg }]}>
                  <Text style={[styles.badgeText, { color: estado.color }]}>{estado.label}</Text>
                </View>
              </View>

              {/* Productos del pedido */}
              <View style={{ marginBottom: 12 }}>
                {order.items?.map((item, i) => (
                  <View key={i} style={styles.itemRow}>
                    <Text style={styles.itemText}>
                      {item.amount}× {item.name || item.productId?.name || 'Producto'}
                    </Text>
                    <Text style={styles.itemText}>${(item.price * item.amount).toFixed(2)}</Text>
                  </View>
                ))}
              </View>

              {/* Pie: puntos ganados + total */}
              <View style={styles.cardFoot}>
                {order.pointsEarned > 0 ? (
                  <View style={styles.puntos}>
                    <Estrella size={14} color={c.accent} />
                    <Text style={styles.puntosText}>+{order.pointsEarned} puntos</Text>
                  </View>
                ) : <View />}
                <Text style={styles.total}>Total: ${Number(order.total).toFixed(2)}</Text>
              </View>

              {/* Valorar el servicio: solo en domicilios ya entregados. */}
              {order.deliveryType === 'delivery' && order.status === 'entregado' && (
                <ValoracionServicio order={order} />
              )}
            </View>
          );
        })
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20 },
  h1: { fontSize: ui.size.xxl, fontWeight: ui.weight.bold, color: c.textPrimary, marginBottom: 24 },
  cargando: { fontSize: ui.size.sm, color: c.textSecondary },

  vacio: { alignItems: 'center', paddingVertical: 64 },
  vacioTitulo: { fontSize: ui.size.sm, fontWeight: ui.weight.semibold, color: c.textPrimary, marginTop: 12, marginBottom: 4 },
  vacioSub: { fontSize: ui.size.sm, color: c.textSecondary, textAlign: 'center' },

  card: {
    backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder,
    borderRadius: ui.radius.xl, padding: 20, marginBottom: 16,
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  pedidoId: { fontSize: ui.size.sm, fontWeight: ui.weight.bold, color: c.textPrimary },
  fecha: { fontSize: ui.size.xs, color: c.textMuted, marginTop: 2 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: ui.radius.full },
  badgeText: { fontSize: ui.size.xs, fontWeight: ui.weight.semibold },

  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  itemText: { fontSize: ui.size.sm, color: c.textSecondary },

  cardFoot: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 12, borderTopWidth: 1, borderTopColor: c.cardBorder,
  },
  puntos: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  puntosText: { fontSize: ui.size.xs, fontWeight: ui.weight.medium, color: c.accent },
  total: { fontSize: ui.size.base, fontWeight: ui.weight.bold, color: c.textPrimary },

  valoracion: { borderTopWidth: 1, borderTopColor: c.cardBorder, paddingTop: 12, marginTop: 12 },
  valTitulo: { fontSize: ui.size.xs, fontWeight: ui.weight.bold, color: c.textPrimary, marginBottom: 6 },
  estrellas: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  textarea: {
    backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder, borderRadius: ui.radius.lg,
    paddingHorizontal: 12, paddingVertical: 8, fontSize: ui.size.sm, color: c.textPrimary,
    textAlignVertical: 'top', marginBottom: 8, minHeight: 52,
  },
  valBtn: { alignSelf: 'flex-start', backgroundColor: c.primary, borderRadius: ui.radius.full, paddingHorizontal: 20, paddingVertical: 8 },
  valBtnText: { color: c.buttonText, fontSize: ui.size.sm, fontWeight: ui.weight.bold },
  valComentario: { fontSize: ui.size.sm, color: c.textSecondary },
});
