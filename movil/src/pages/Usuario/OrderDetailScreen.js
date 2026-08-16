import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors, typography, spacing, radius } from '../../theme/Usuario';
import { formatCurrency } from '../../utils/formatCurrency';
import { getOrderById, cancelOrder } from '../../api/Usuario/orders';
import { useAsync } from '../../hooks/Usuario/useProducts';
import PrimaryButton from '../../components/Usuario/PrimaryButton';


export default function OrderDetailScreen({ route, navigation }) {
  const { orderId } = route.params;
  const { data: order, loading, refetch } = useAsync(() => getOrderById(orderId), [orderId]);

  if (loading || !order) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  const handleCancel = () => {
    Alert.alert('Cancelar pedido', '¿Seguro que quieres cancelar este pedido?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, cancelar',
        style: 'destructive',
        onPress: async () => {
          await cancelOrder(order.id);
          await refetch();
          Alert.alert('Pedido cancelado', 'Tu pedido se canceló correctamente.');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <IconoCerrar size={18} />
        </TouchableOpacity>
        <Text style={styles.title}>Detalles del pedido</Text>
        <TouchableOpacity>
          <Text style={styles.help}>Ayuda</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg }}>
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Orden en curso</Text>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>{order.statusLabel}</Text>
            </View>
          </View>
          <Text style={styles.eta}>El tiempo estimado es de {order.estimatedMinutes} minutos.</Text>

          <View style={styles.progressWrap}>
            <View style={styles.progressCircle}>
              <IconoCheck size={16} />
            </View>
            <Text style={styles.placedLabel}>Pedido realizado</Text>
            <Text style={styles.placedDate}>{order.placedAt}</Text>
            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pagar con</Text>
          <View style={styles.infoRow}>
            <IconoTarjeta size={16} />
            <Text style={styles.infoText}>{order.paymentMethod}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dirección de entrega</Text>
          <View style={styles.infoRow}>
            <IconoPin size={14} />
            <Text style={styles.infoText}>{order.deliveryAddress}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumen de pedido</Text>
          <View style={styles.infoRow}>
            <IconoEtiqueta size={13} />
            <Text style={styles.orderNumber}>Número de pedido {order.id}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Costo de envío</Text>
            <Text style={styles.summaryValue}>{formatCurrency(order.shippingCost)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tarifa de servicio</Text>
            <Text style={styles.summaryValue}>{formatCurrency(order.serviceFee)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(order.total)}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.itemsHeaderRow}>
            <Text style={styles.cardTitle}>Productos</Text>
            <Text style={styles.itemsHeaderRight}>Cantidad</Text>
          </View>
          {order.items.map(item => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemImage} />
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
              </View>
              <Text style={styles.itemQty}>{item.quantity}x</Text>
            </View>
          ))}
        </View>

        {order.status === 'in_progress' && (
          <View style={styles.cancelBox}>
            <Text style={styles.cancelNote}>
              Puedes cancelar tu pedido antes de que esté preparado.
            </Text>
            <PrimaryButton label="Cancelar pedido" variant="outline" onPress={handleCancel} />
          </View>
        )}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: { fontSize: typography.size.md, fontWeight: typography.weight.bold, color: colors.text },
  help: { color: colors.primary, fontSize: typography.size.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusLabel: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.text },
  statusPill: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  statusPillText: { color: colors.primary, fontSize: typography.size.xs, fontWeight: typography.weight.semibold },
  eta: { color: colors.primary, fontSize: typography.size.sm, marginTop: 4 },
  progressWrap: { alignItems: 'center', marginTop: spacing.lg },
  progressCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  placedLabel: { fontWeight: typography.weight.semibold, color: colors.text },
  placedDate: { color: colors.textMuted, fontSize: typography.size.xs, marginTop: 2 },
  progressTrack: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    width: '100%',
    marginTop: spacing.md,
  },
  progressFill: {
    height: 4,
    width: '30%',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  cardTitle: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.text, marginBottom: spacing.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  infoText: { color: colors.textSecondary, flex: 1 },
  orderNumber: { color: colors.textMuted, fontSize: typography.size.sm, marginBottom: spacing.sm },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs, marginTop: spacing.xs },
  summaryLabel: { color: colors.textSecondary },
  summaryValue: { color: colors.text },
  totalRow: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.divider },
  totalLabel: { fontWeight: typography.weight.bold, color: colors.text },
  totalValue: { fontWeight: typography.weight.bold, color: colors.text },
  itemsHeaderRow: { flexDirection: 'row', justifyContent: 'space-between' },
  itemsHeaderRight: { color: colors.textMuted, fontSize: typography.size.xs },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  itemImage: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    marginRight: spacing.md,
  },
  itemName: { color: colors.text, fontWeight: typography.weight.medium },
  itemPrice: { color: colors.primary, fontSize: typography.size.sm },
  itemQty: { color: colors.text },
  cancelBox: { alignItems: 'center', marginTop: spacing.lg },
  cancelNote: { color: colors.textMuted, textAlign: 'center', marginBottom: spacing.lg, fontSize: typography.size.sm },
});
