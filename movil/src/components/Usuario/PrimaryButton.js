import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, typography, spacing, radius } from '../../theme/Usuario';

export default function PrimaryButton({
  label,
  onPress,
  leftContent,
  rightContent,
  loading = false,
  disabled = false,
  variant = 'filled', // 'filled' | 'outline'
}) {
  const isOutline = variant === 'outline';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isOutline ? styles.outline : styles.filled,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      <View style={styles.side}>{leftContent}</View>
      {loading ? (
        <ActivityIndicator color={isOutline ? colors.primary : colors.textOnPrimary} />
      ) : (
        <Text style={[styles.label, isOutline ? styles.labelOutline : styles.labelFilled]}>
          {label}
        </Text>
      )}
      <View style={styles.side}>{rightContent}</View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
  },
  filled: {
    backgroundColor: colors.primary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  side: {
    minWidth: 24,
  },
  label: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    flex: 1,
    textAlign: 'center',
  },
  labelFilled: {
    color: colors.textOnPrimary,
  },
  labelOutline: {
    color: colors.primary,
  },
});
