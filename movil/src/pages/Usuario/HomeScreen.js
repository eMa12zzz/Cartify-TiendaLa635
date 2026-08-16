import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Header from '../../components/Usuario/Header';
import SearchBar from '../../components/Usuario/SearchBar';
import CategoryPill from '../../components/Usuario/CategoryPill';
import ProductCard from '../../components/Usuario/ProductCard';
import { colors, typography, spacing, radius } from '../../theme/Usuario';
import { getHomeSections } from '../../api/Usuario/products';
import { useAsync } from '../../hooks/Usuario/useProducts';
import { useCart } from '../../hooks/Usuario/useCart';

export default function HomeScreen({ navigation }) {
  const { data, loading, error } = useAsync(getHomeSections, []);
  const [selectedCategory, setSelectedCategory] = useState('Lacteos');
  const { addToCart, itemsCount } = useCart();

  const goToProduct = product => navigation.navigate('ProductDetail', { productId: product.id });
  const goToSearch = () => navigation.navigate('Search');
  const goToCart = () => navigation.navigate('Cart');

  const agregarAlCarrito = product => {
    addToCart(product, 1);
    Alert.alert('Agregado al carrito', `${product.name} se agregó a tu carrito.`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text>No pudimos cargar el inicio. Intenta de nuevo.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header onCartPress={goToCart} cartCount={itemsCount} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <SearchBar
          value=""
          onChangeText={() => {}}
          editable={false}
          onPress={goToSearch}
        />

        {/* Banners */}
        <FlatList
          data={data.banners}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.lg }}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.banner}>
              <Text style={styles.bannerTitle}>{item.title}</Text>
              <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
            </View>
          )}
        />

        {/* Categorías */}
        <FlatList
          data={data.categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
          keyExtractor={item => item}
          renderItem={({ item }) => (
            <CategoryPill
              label={item}
              selected={item === selectedCategory}
              onPress={() => setSelectedCategory(item)}
            />
          )}
        />

        {/* Secciones de productos */}
        {data.sections.map(section => (
          <View key={section.id} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <TouchableOpacity>
                <Text style={styles.sectionLink}>Ver todos (+{section.products.length}) ›</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={section.products}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: spacing.lg }}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <ProductCard
                  product={item}
                  onPress={goToProduct}
                  onAdd={agregarAlCarrito}
                />
              )}
            />
          </View>
        ))}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  banner: {
    width: 220,
    height: 110,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    marginRight: spacing.md,
    justifyContent: 'center',
  },
  bannerTitle: {
    fontWeight: typography.weight.bold,
    fontSize: typography.size.base,
    color: colors.text,
  },
  bannerSubtitle: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },
  categoryList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
  sectionLink: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
});
