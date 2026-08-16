import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import SearchBar from '../../components/Usuario/SearchBar';
import ProductCard from '../../components/Usuario/ProductCard';
import { colors, typography, spacing, radius } from '../../theme/Usuario';
import { searchProducts } from '../../api/Usuario/products';
import { useAsync } from '../../hooks/Usuario/useProducts';
import { useCart } from '../../hooks/Usuario/useCart';

const FILTERS = ['Todos', '$4 - 12$', '$4 - 12$', '$4 - 12$', '$4 - 12$'];

export default function SearchResultsScreen({ route, navigation }) {
  const { query } = route.params;
  const { data: results, loading } = useAsync(() => searchProducts(query), [query]);
  const { itemsCount, addToCart } = useCart();

  const goToProduct = product => navigation.navigate('ProductDetail', { productId: product.id });
  const goToCart = () => navigation.navigate('Cart');

  const agregarAlCarrito = product => {
    addToCart(product, 1);
    Alert.alert('Agregado al carrito', `${product.name} se agregó a tu carrito.`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <IconoCerrar size={18} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <SearchBar value={query} onChangeText={() => {}} editable={false} />
        </View>
      </View>

      <TouchableOpacity style={styles.cartFab} onPress={goToCart}>
        <IconoCarrito size={18} />
        {itemsCount > 0 && (
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{itemsCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <FlatList
        data={FILTERS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, idx) => `${item}-${idx}`}
        contentContainerStyle={styles.filterList}
        renderItem={({ item, index }) => (
          <View style={[styles.filterChip, index === 0 && styles.filterChipActive]}>
            <Text style={[styles.filterLabel, index === 0 && styles.filterLabelActive]}>
              {item}
            </Text>
          </View>
        )}
      />

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={{ paddingHorizontal: spacing.lg, justifyContent: 'space-between' }}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          renderItem={({ item }) => (
            <View style={{ marginBottom: spacing.md, width: '48%' }}>
              <ProductCard product={item} onPress={goToProduct} onAdd={agregarAlCarrito} />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  cartFab: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.text,
    borderRadius: radius.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: { color: colors.textOnPrimary, fontSize: 10, fontWeight: typography.weight.bold },
  filterList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  filterLabel: {
    fontSize: typography.size.sm,
    color: colors.text,
  },
  filterLabelActive: {
    color: colors.textOnPrimary,
  },
});
