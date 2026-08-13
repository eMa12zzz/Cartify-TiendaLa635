import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../../theme/Usuario';

export default function Header({ 
  location = '10115 New York', 
  onMenuPress, 
  onCartPress, 
  onLocationPress,
  cartCount = 0 
}) {
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        onPress={onMenuPress} 
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={styles.menuButton}
      >
        <Text style={styles.menuIcon}>☰</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.locationWrap} onPress={onLocationPress}>
        <Text style={styles.pin}>📍</Text>
        <Text style={styles.locationText}>{location}</Text>
        <Text style={styles.chevron}>⌄</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.cartButton} 
        onPress={onCartPress}
        activeOpacity={0.8}
      >
        <Text style={styles.cartIcon}>🛒</Text>
        {cartCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{cartCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: typography.size.lg,
    color: colors.text,
  },
  locationWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pin: { 
    fontSize: typography.size.sm, 
    marginRight: 4 
  },
  locationText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.primary,
  },
  chevron: { 
    color: colors.primary, 
    marginLeft: 4 
  },
  cartButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    position: 'relative',
  },
  cartIcon: {
    fontSize: 18,
    color: colors.textOnPrimary,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.danger || '#FF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});