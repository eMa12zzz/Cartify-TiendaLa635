import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../../theme/Usuario';

export default function QuantitySelector({ quantity, onIncrease, onDecrease, size = 'md' }) {
  const isSmall = size === 'sm';

  return (
    <View style={[styles.container, isSmall && styles.containerSmall]}>
      <TouchableOpacity onPress={onDecrease} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.symbol}>−</Text>
      </TouchableOpacity>
      <Text style={styles.quantity}>{quantity}</Text>
      <TouchableOpacity onPress={onIncrease} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.symbol}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  containerSmall: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  symbol: {
    fontSize: typography.size.base,
    color: colors.primary,
    fontWeight: typography.weight.bold,
    width: 18,
    textAlign: 'center',
  },
  quantity: {
    fontSize: typography.size.base,
    color: colors.text,
    fontWeight: typography.weight.semibold,
    marginHorizontal: spacing.sm,
  },
});
