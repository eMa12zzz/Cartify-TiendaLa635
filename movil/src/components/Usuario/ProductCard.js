import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../../theme/Usuario';
import { formatCurrency } from '../../utils/formatCurrency';

/**
 * Tarjeta de producto usada en Home, Resultados de búsqueda y Recomendaciones.
 *
 * props:
 * - product: { id, name, variant, pricePerUnit, salePrice, oldPrice, stock, isBestSeller, images }
 * - onPress(product)
 * - onAdd(product)
 * - onToggleFavorite(product)
 * - isFavorite: bool
 */
export default function ProductCard({ product, onPress, onAdd, onToggleFavorite, isFavorite }) {
  const image = product.images?.[0];

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => onPress?.(product)}
    >
      <View style={styles.imageWrap}>
        {product.isBestSeller && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Más vendido</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.favButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={() => onToggleFavorite?.(product)}
        >
          <Text style={{ color: isFavorite ? colors.danger : colors.textMuted }}>
            {isFavorite ? '♥' : '♡'}
          </Text>
        </TouchableOpacity>

        {image ? (
          <Image source={{ uri: image }} style={styles.image} resizeMode="contain" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]} />
        )}
      </View>

      <Text style={styles.name} numberOfLines={1}>
        {product.name}
      </Text>
      {!!product.pricePerUnit && <Text style={styles.pricePerUnit}>{product.pricePerUnit}</Text>}

      <View style={styles.priceRow}>
        <Text style={styles.salePrice}>{formatCurrency(product.salePrice)}</Text>
        {!!product.oldPrice && (
          <Text style={styles.oldPrice}>{formatCurrency(product.oldPrice)}</Text>
        )}
      </View>

      {typeof product.stock === 'number' && (
        <Text style={styles.stock}>{product.stock} Left</Text>
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => onAdd?.(product)}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const CARD_MIN_WIDTH = 150;

const styles = StyleSheet.create({
  card: {
    width: CARD_MIN_WIDTH,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginRight: spacing.md,
  },
  imageWrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  image: {
    width: '80%',
    height: '80%',
  },
  imagePlaceholder: {
    backgroundColor: colors.surfaceAlt,
  },
  badge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    backgroundColor: colors.background,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    zIndex: 2,
  },
  badgeText: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
  },
  favButton: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    zIndex: 2,
  },
  name: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text,
  },
  pricePerUnit: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  salePrice: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.text,
    marginRight: spacing.sm,
  },
  oldPrice: {
    fontSize: typography.size.sm,
    color: colors.priceOld,
    textDecorationLine: 'line-through',
  },
  stock: {
    fontSize: typography.size.xs,
    color: colors.primary,
    marginTop: 2,
  },
  addButton: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: colors.textOnPrimary,
    fontSize: typography.size.md,
    lineHeight: typography.size.md,
    marginTop: -1,
  },
});
