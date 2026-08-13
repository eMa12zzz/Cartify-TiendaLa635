import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors, typography, spacing, radius } from '../../theme/Usuario';
import { formatCurrency } from '../../utils/formatCurrency';
import { useCart } from '../../hooks/Usuario/useCart';
import { useAsync } from '../../hooks/Usuario/useProducts';
import { getCheckoutInfo, checkoutCart } from '../../api/Usuario/cart';
import PrimaryButton from '../../components/Usuario/PrimaryButton';


export default function CheckoutScreen({ navigation }) {
  const { items, itemsTotal, subtotal, clearCart } = useCart();
  const { data: info, loading } = useAsync(getCheckoutInfo, []);
  const [confirmando, setConfirmando] = useState(false);

  if (loading || !info) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  const total = itemsTotal + info.shippingCost;

  const confirmarPedido = () => {
    Alert.alert(
      'Confirmar pedido',
      `Vas a pagar ${formatCurrency(total)} con ${info.paymentMethod}. ¿Confirmas tu pedido?`,
      [
        { text: 'Revisar de nuevo', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              setConfirmando(true);
              const order = await checkoutCart({ items });
              clearCart();
              Alert.alert('¡Pedido realizado! 🎉', 'Tu pedido se envió a la tienda y ya lo están preparando.', [
                { text: 'Ver mi pedido', onPress: () => navigation.navigate('OrderDetail', { orderId: order.orderId }) },
              ]);
            } catch (err) {
              Alert.alert('No se pudo completar el pedido', err.message || 'Intenta de nuevo en un momento.');
            } finally {
              setConfirmando(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <IconoCerrar size={18} />
        </TouchableOpacity>
        <Text style={styles.title}>Checkout</Text>
        <View style={{ width: 18 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg }}>
        <View style={styles.deliveryPill}>
          <IconoPin size={13} />
          <Text style={styles.deliveryPillText}>{info.deliveryWindow}</Text>
        </View>

        <TouchableOpacity style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Información de entrega</Text>
            <IconoChevronDerecha size={13} />
          </View>
          <Text style={styles.cardHint}>Entregar a</Text>
          <View style={styles.infoRow}>
            <IconoPin size={14} />
            <Text style={styles.infoText}>{info.deliveryAddress}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Método de pago</Text>
            <IconoChevronDerecha size={13} />
          </View>
          <Text style={styles.cardHint}>Pagar con</Text>
          <View style={styles.infoRow}>
            <IconoTarjeta size={16} />
            <Text style={styles.infoText}>{info.paymentMethod}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Revisar pedido</Text>
          </View>
          <View style={styles.reviewRow}>
            {items.slice(0, 5).map(item => (
              <Image
                key={item.product.id}
                source={{ uri: item.product.images?.[0] }}
                style={styles.reviewThumb}
              />
            ))}
            {items.length > 5 && (
              <View style={[styles.reviewThumb, styles.reviewMore]}>
                <Text style={styles.reviewMoreText}>+{items.length - 5}</Text>
              </View>
            )}
            <View style={{ flex: 1 }} />
            <IconoChevronDerecha size={13} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumen de pedido</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Costo de envío</Text>
            <Text style={styles.summaryValue}>{formatCurrency(info.shippingCost)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tarifa de servicio</Text>
            <Text style={styles.summaryValue}>{formatCurrency(info.serviceFee)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total de artículos</Text>
            <Text style={styles.summaryValue}>{formatCurrency(itemsTotal)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
          </View>
        </View>

        <View style={{ marginTop: spacing.lg, marginBottom: spacing.xl }}>
          <PrimaryButton
            label={confirmando ? 'Confirmando...' : 'Confirmar pedido'}
            leftContent={<IconoCheck size={16} />}
            rightContent={<Text style={styles.confirmTotal}>{formatCurrency(total)}</Text>}
            onPress={confirmarPedido}
            loading={confirmando}
            disabled={items.length === 0}
          />
        </View>
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
  deliveryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: spacing.lg,
  },
  deliveryPillText: { color: colors.textSecondary, fontSize: typography.size.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardTitle: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.text },
  cardHint: { color: colors.textMuted, fontSize: typography.size.xs, marginBottom: spacing.xs },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  infoText: { color: colors.primary, fontWeight: typography.weight.semibold, flex: 1 },
  reviewRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  reviewThumb: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
  },
  reviewMore: { alignItems: 'center', justifyContent: 'center' },
  reviewMoreText: { fontSize: typography.size.xs, color: colors.textSecondary, fontWeight: typography.weight.semibold },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  summaryLabel: { color: colors.textSecondary },
  summaryValue: { color: colors.text },
  totalRow: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.divider },
  totalLabel: { fontWeight: typography.weight.bold, color: colors.text },
  totalValue: { fontWeight: typography.weight.bold, color: colors.text },
  confirmTotal: { color: colors.textOnPrimary, fontWeight: typography.weight.bold },
});
