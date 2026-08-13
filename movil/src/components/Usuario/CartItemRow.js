import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../../theme/Usuario';
import { formatCurrency } from '../../utils/formatCurrency';
import QuantitySelector from './QuantitySelector';

export default function CartItemRow({ item, onIncrease, onDecrease, onRemove }) {
  const { product, quantity } = item;
  const image = product.images?.[0];

  return (
    <View style={styles.row}>
      <View style={styles.imageContainer}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} resizeMode="contain" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]} />
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        {product.variant && (
          <Text style={styles.variant}>{product.variant}</Text>
        )}
        <Text style={styles.price}>{formatCurrency(product.salePrice)}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          onPress={() => onRemove?.(product.id)}
          style={styles.removeButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.removeIcon}>✕</Text>
        </TouchableOpacity>
        
        <QuantitySelector
          size="sm"
          quantity={quantity}
          onIncrease={() => onIncrease?.(product.id)}
          onDecrease={() => onDecrease?.(product.id)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  imageContainer: {
    width: 64,
    height: 64,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    marginRight: spacing.md,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    backgroundColor: colors.surfaceAlt,
  },
  info: {
    flex: 1,
    marginRight: spacing.sm,
  },
  name: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text,
    marginBottom: 2,
  },
  variant: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginBottom: 2,
  },
  price: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.primary,
  },
  actions: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  removeButton: {
    padding: 4,
  },
  removeIcon: {
    fontSize: 14,
    color: colors.textMuted,
  },
});