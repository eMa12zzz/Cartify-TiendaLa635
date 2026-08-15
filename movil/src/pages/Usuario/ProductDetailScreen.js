import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors, typography, spacing, radius } from '../../theme/Usuario';
import { formatCurrency } from '../../utils/formatCurrency';
import { getProductById, getRecommendations } from '../../api/Usuario/products';
import { useAsync } from '../../hooks/Usuario/useProducts';
import { useCart } from '../../hooks/Usuario/useCart';
import PrimaryButton from '../../components/Usuario/PrimaryButton';
import ProductCard from '../../components/Usuario/ProductCard';

const RATING_BREAKDOWN = [
  { stars: 5, pct: 0.8 },
  { stars: 4, pct: 0.6 },
  { stars: 3, pct: 0.6 },
  { stars: 2, pct: 0.6 },
  { stars: 1, pct: 0.2 },
];

export default function ProductDetailScreen({ route, navigation }) {
  const { productId } = route.params;
  const { data: product, loading } = useAsync(() => getProductById(productId), [productId]);
  const { data: recommendations } = useAsync(() => getRecommendations(productId), [productId]);
  const { addToCart } = useCart();
  const [selectedImage, setSelectedImage] = useState(0);

  if (loading || !product) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  const images = product.images?.length ? product.images : [null];

  const agregarAlCarrito = () => {
    addToCart(product, 1);
    Alert.alert('Agregado al carrito', `${product.name} se agregó a tu carrito.`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <IconoCerrar size={18} />
          </TouchableOpacity>
        </View>

        <Image
          source={{ uri: images[selectedImage] }}
          style={styles.mainImage}
          resizeMode="contain"
        />

        <FlatList
          data={images}
          horizontal
          keyExtractor={(_, idx) => String(idx)}
          contentContainerStyle={styles.thumbRow}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={[styles.thumb, index === selectedImage && styles.thumbActive]}
              onPress={() => setSelectedImage(index)}
            >
              <Image source={{ uri: item }} style={styles.thumbImage} resizeMode="contain" />
            </TouchableOpacity>
          )}
        />

        <View style={styles.content}>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.pricePerUnit}>{product.pricePerUnit}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.salePrice}>{formatCurrency(product.salePrice)}</Text>
            {!!product.oldPrice && (
              <Text style={styles.oldPrice}>{formatCurrency(product.oldPrice)}</Text>
            )}
          </View>
          {typeof product.stock === 'number' && (
            <Text style={styles.stock}>{product.stock} disponibles</Text>
          )}

          <PrimaryButton
            label="Añadir al carrito"
            leftContent={<IconoCarrito size={17} />}
            onPress={agregarAlCarrito}
          />

          <Text style={styles.sectionLabel}>Sobre el producto</Text>
          <View style={styles.row}>
            <IconoTrofeo size={16} />
            <Text style={styles.rowText}>Los más vendidos</Text>
            <Text style={styles.rowLink}>Ver más</Text>
            <IconoChevronDerecha size={11} />
          </View>
          <View style={styles.row}>
            <IconoNatural size={16} />
            <Text style={styles.rowText}>100% Natural</Text>
          </View>

          <Text style={styles.sectionLabel}>Reseñas de clientes</Text>
          <View style={styles.ratingHeader}>
            <Text style={styles.ratingScore}>{product.rating}</Text>
            <View>
              <View style={{ flexDirection: 'row', gap: 2 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <IconoEstrella key={n} size={13} relleno={n <= Math.round(product.rating)} />
                ))}
              </View>
              <Text style={styles.reviewsCount}>
                Calificación promedio: {product.rating} ({product.reviewsCount})
              </Text>
            </View>
          </View>

          {RATING_BREAKDOWN.map(r => (
            <View key={r.stars} style={styles.barRow}>
              <Text style={styles.barLabel}>{r.stars} ★</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${r.pct * 100}%` }]} />
              </View>
              <Text style={styles.barCount}>4.2K</Text>
            </View>
          ))}

          <TouchableOpacity style={styles.collapsible}>
            <Text style={styles.collapsibleLabel}>Detalles</Text>
            <IconoChevronAbajo size={13} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.collapsible}>
            <Text style={styles.collapsibleLabel}>Conservación y almacenamiento</Text>
            <IconoChevronAbajo size={13} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.collapsible}>
            <Text style={styles.collapsibleLabel}>Ingredientes o Valor Nutricional</Text>
            <IconoChevronAbajo size={13} />
          </TouchableOpacity>

          <Text style={styles.sectionLabel}>Recomendaciones</Text>
        </View>

        <FlatList
          data={recommendations || []}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.lg }}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={p => navigation.push('ProductDetail', { productId: p.id })}
              onAdd={p => {
                addToCart(p, 1);
                Alert.alert('Agregado al carrito', `${p.name} se agregó a tu carrito.`);
              }}
            />
          )}
        />

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  mainImage: { width: '100%', height: 220 },
  thumbRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbActive: { borderColor: colors.primary },
  thumbImage: { width: '80%', height: '80%' },
  content: { paddingHorizontal: spacing.lg },
  name: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.text },
  pricePerUnit: { fontSize: typography.size.sm, color: colors.textMuted, marginTop: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  salePrice: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text,
    marginRight: spacing.sm,
  },
  oldPrice: {
    fontSize: typography.size.base,
    color: colors.priceOld,
    textDecorationLine: 'line-through',
  },
  stock: { color: colors.primary, marginTop: 2, marginBottom: spacing.lg },
  sectionLabel: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm },
  rowText: { flex: 1, color: colors.text },
  rowLink: { color: colors.primary, fontSize: typography.size.sm },
  ratingHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, gap: spacing.md },
  ratingScore: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
  reviewsCount: { color: colors.textMuted, fontSize: typography.size.xs, marginTop: 4 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  barLabel: { width: 32, fontSize: typography.size.xs, color: colors.textSecondary },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.full,
    marginHorizontal: spacing.sm,
  },
  barFill: { height: 6, backgroundColor: colors.primary, borderRadius: radius.full },
  barCount: { fontSize: typography.size.xs, color: colors.textMuted, width: 36 },
  collapsible: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  collapsibleLabel: { color: colors.text, fontSize: typography.size.base },
});
