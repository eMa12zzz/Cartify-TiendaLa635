import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { clientColors as c, estadoColores, ui } from '../../theme/Usuario/clientColors';
import { useMyOrders } from '../../hooks/Usuario/useMyOrders';
import { fechaCorta } from '../../utils/fecha';
import { IconoRecibo, IconoCheckCirculo } from '../../components/Usuario/IconosCuenta';

/*
 * Recibidos — "Recibos": los pedidos ya ENTREGADOS del cliente, como
 * comprobante de compra. Puerto de `frontend/src/pages/cliente/Recibidos.jsx`.
 * Reutiliza useMyOrders filtrando por estado 'entregado'.
 */
export default function Recibidos() {
  const { orders, loading } = useMyOrders('entregado');

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.h1}>Recibos</Text>

      {loading ? (
        <Text style={styles.cargando}>Cargando tus recibos…</Text>
      ) : orders.length === 0 ? (
        <View style={styles.vacio}>
          <IconoRecibo size={40} color={c.textMuted} />
          <Text style={styles.vacioTitulo}>Todavía no hay recibos</Text>
          <Text style={styles.vacioSub}>Aquí verás el comprobante de cada pedido que ya recibiste.</Text>
        </View>
      ) : (
        orders.map((order) => (
          <View key={order._id} style={styles.card}>
            <View style={styles.cardHead}>
              <View>
                <Text style={styles.reciboId}>Recibo #{String(order._id).slice(-6).toUpperCase()}</Text>
                <Text style={styles.fecha}>{fechaCorta(order.createdAt)}</Text>
              </View>
              <View style={styles.entregado}>
                <IconoCheckCirculo size={16} color={estadoColores.exito} />
                <Text style={styles.entregadoText}>Entregado</Text>
              </View>
            </View>

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

            <View style={styles.cardFoot}>
              <Text style={styles.pago}>Pago: {order.paymentMethod || 'efectivo'}</Text>
              <Text style={styles.total}>Total: ${Number(order.total).toFixed(2)}</Text>
            </View>
          </View>
        ))
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
  reciboId: { fontSize: ui.size.sm, fontWeight: ui.weight.bold, color: c.textPrimary },
  fecha: { fontSize: ui.size.xs, color: c.textMuted, marginTop: 2 },
  entregado: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  entregadoText: { fontSize: ui.size.xs, fontWeight: ui.weight.semibold, color: estadoColores.exito },

  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  itemText: { fontSize: ui.size.sm, color: c.textSecondary },

  cardFoot: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 12, borderTopWidth: 1, borderTopColor: c.cardBorder,
  },
  pago: { fontSize: ui.size.xs, color: c.textMuted },
  total: { fontSize: ui.size.base, fontWeight: ui.weight.bold, color: c.textPrimary },
});
