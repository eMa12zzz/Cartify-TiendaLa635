import React from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../../theme/Usuario';
import { formatCurrency } from '../../utils/formatCurrency';
import { useCart } from '../../hooks/Usuario/useCart';
import CartHeader from '../../components/Usuario/CartHeader';
import CartItemRow from '../../components/Usuario/CartItemRow';
import PrimaryButton from '../../components/Usuario/PrimaryButton';
import ProductCard from '../../components/Usuario/ProductCard';
import { getRecommendations } from '../../api/Usuario/products';
import { useAsync } from '../../hooks/Usuario/useProducts';
import { checkoutCart } from '../../api/Usuario/cart';

export default function CartScreen({ navigation }) {
  const { items, itemsTotal, deliveryFee, subtotal, updateQuantity, removeFromCart, clearCart } =
    useCart();
  const { data: recommendations } = useAsync(() => getRecommendations(null), []);

  const handleCheckout = async () => {
    const order = await checkoutCart({ items });
    clearCart();
    navigation.navigate('OrderDetail', { orderId: order.orderId });
  };

  return (
    <SafeAreaView style={styles.container}>
      <CartHeader 
        title="Mi Carrito" 
        onClose={() => navigation.goBack()}
        rightContent={
          items.length > 0 && (
            <View style={styles.itemCount}>
              <Text style={styles.itemCountText}>{items.length} items</Text>
            </View>
          )
        }
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🛒</Text>
            <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
            <Text style={styles.emptySubtitle}>¡Explora nuestros productos y comienza a comprar!</Text>
            <TouchableOpacity 
              style={styles.exploreButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.exploreButtonText}>Explorar productos</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.deliveryInfo}>
              <Text style={styles.deliveryIcon}>📍</Text>
              <Text style={styles.deliveryText}>Envío a domicilio disponible</Text>
              <Text style={styles.deliveryTime}>30-45 min</Text>
            </View>

            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>Resumen del pedido</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal ({items.length} items)</Text>
                <Text style={styles.summaryValue}>{formatCurrency(itemsTotal)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Costo de envío</Text>
                <Text style={styles.summaryValue}>{formatCurrency(deliveryFee)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
              </View>
            </View>

            <Text style={styles.productosLabel}>Productos</Text>
            {items.map(item => (
              <View key={item.product.id} style={{ paddingHorizontal: spacing.lg }}>
                <CartItemRow
                  item={item}
                  onIncrease={id => updateQuantity(id, item.quantity + 1)}
                  onDecrease={id => updateQuantity(id, item.quantity - 1)}
                  onRemove={removeFromCart}
                />
              </View>
            ))}

            <View style={styles.checkoutWrapper}>
              <PrimaryButton
                label="Proceder al pago"
                leftContent={<Text style={styles.buttonIcon}>🛒</Text>}
                rightContent={
                  <Text style={styles.checkoutTotal}>{formatCurrency(subtotal)}</Text>
                }
                onPress={handleCheckout}
                disabled={items.length === 0}
              />
            </View>

            {recommendations && recommendations.length > 0 && (
              <>
                <Text style={[styles.productosLabel, { marginTop: spacing.xl }]}>
                  Productos recomendados
                </Text>
                <FlatList
                  data={recommendations}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: spacing.lg }}
                  keyExtractor={item => item.id}
                  renderItem={({ item }) => (
                    <ProductCard
                      product={item}
                      onPress={p => navigation.navigate('ProductDetail', { productId: p.id })}
                    />
                  )}
                />
              </>
            )}

            <View style={{ height: spacing.xxl }} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyIcon: {
    fontSize: 48,
    opacity: 0.5,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: typography.size.base,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  exploreButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
  },
  exploreButtonText: {
    color: colors.textOnPrimary,
    fontWeight: typography.weight.semibold,
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  deliveryIcon: {
    fontSize: 14,
    marginRight: spacing.sm,
  },
  deliveryText: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
  deliveryTime: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.primary,
  },
  summaryBox: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  summaryTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  summaryRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: spacing.sm 
  },
  summaryLabel: { 
    color: colors.textSecondary 
  },
  summaryValue: { 
    color: colors.text, 
    fontWeight: typography.weight.semibold 
  },
  totalRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  totalLabel: {
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
  totalValue: {
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
  productosLabel: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  checkoutWrapper: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  checkoutTotal: { 
    color: colors.textOnPrimary, 
    fontWeight: typography.weight.bold 
  },
  itemCount: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  itemCountText: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
  },
  buttonIcon: {
    fontSize: 16,
    color: colors.textOnPrimary,
  },
});