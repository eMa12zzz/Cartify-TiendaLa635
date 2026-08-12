import { useState } from 'react';
import {
  ScrollView, View, Text, Image, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { clientColors as c, ui } from '../../theme/Usuario/clientColors';
import { useTienda } from '../../context/Usuario/TiendaContext';
import { useFavoritosCtx } from '../../context/Usuario/FavoritosContext';
import { esPorLibra, esSoloAdultos, piezasEnTexto, pasoDe, cantidadConUnidad } from '../../utils/unidades';
import { Corazon } from '../../components/UI/Iconos';
import { IconoPaquete } from '../../components/Usuario/IconosCuenta';

/*
 * ProductoDetalle — la ficha de un producto.
 * Puerto de `frontend/src/components/Store/ProductDetailModal.jsx` (lo esencial,
 * como pantalla en vez de modal): foto grande, marca, nombre, precio con
 * tachado/"/lb", existencias, descripción, selector de cantidad (que respeta el
 * paso de su unidad: de 1 en 1 por unidad, de 0.5 en 0.5 por libra) y agregar.
 */
export default function ProductoDetalle({ route, navigation }) {
  const { productoId } = route.params;
  const { productos, agregarAlCarrito } = useTienda();
  const { esFavorito, alternar } = useFavoritosCtx();

  const producto = productos.find((p) => p.id === productoId);
  const paso = producto ? pasoDe(producto) : 1;
  const [cantidad, setCantidad] = useState(paso);

  if (!producto) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text style={{ color: c.textSecondary }}>Producto no disponible.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.volver}>
          <Text style={styles.volverText}>Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const liked = esFavorito(producto.id);
  const porLibra = esPorLibra(producto);
  const tope = producto.stock;

  const menos = () => setCantidad((q) => Math.max(paso, Number((q - paso).toFixed(2))));
  const mas = () => setCantidad((q) => Math.min(tope, Number((q + paso).toFixed(2))));

  const agregar = () => {
    agregarAlCarrito(producto, cantidad);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Barra: volver + corazón */}
      <View style={styles.bar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.barBtn}>
          <Text style={styles.barBtnText}>‹ Volver</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => alternar(producto.id, producto.nombre)} style={styles.heart}>
          <Corazon size={18} color={liked ? '#ff4d6d' : '#ccc'} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Foto */}
        <View style={styles.imgWrap}>
          {producto.imagen ? (
            <Image source={{ uri: producto.imagen }} style={styles.img} resizeMode="contain" />
          ) : (
            <IconoPaquete size={56} color="#C4BDB6" />
          )}
        </View>

        <View style={styles.content}>
          {!!producto.marca && <Text style={styles.marca}>{producto.marca.toUpperCase()}</Text>}
          <View style={styles.nombreRow}>
            <Text style={styles.nombre}>{producto.nombre}</Text>
            {esSoloAdultos(producto) && <Text style={styles.mas18}>+18</Text>}
          </View>

          {/* Precio */}
          <View style={styles.priceRow}>
            {!!producto.precioAnterior && (
              <Text style={styles.oldPrice}>${Number(producto.precioAnterior).toFixed(2)}</Text>
            )}
            <Text style={styles.newPrice}>
              ${Number(producto.precio).toFixed(2)}
              {porLibra && <Text style={styles.porUnidad}>/lb</Text>}
            </Text>
          </View>
          {!porLibra && piezasEnTexto(producto) && (
            <Text style={styles.contenido}>{piezasEnTexto(producto)}</Text>
          )}

          {/* Existencias */}
          <Text style={styles.stock}>
            {producto.stock > 0 ? `${cantidadConUnidad(producto, producto.stock)} disponibles` : 'Agotado'}
          </Text>

          {/* Descripción */}
          {!!producto.descripcion && (
            <>
              <Text style={styles.sectionLabel}>Sobre el producto</Text>
              <Text style={styles.desc}>{producto.descripcion}</Text>
            </>
          )}
        </View>
      </ScrollView>

      {/* Barra inferior: cantidad + agregar */}
      <View style={styles.bottomBar}>
        <View style={styles.stepper}>
          <TouchableOpacity onPress={menos} style={styles.stepBtn}><Text style={styles.stepText}>−</Text></TouchableOpacity>
          <Text style={styles.stepQty}>{cantidadConUnidad(producto, cantidad)}</Text>
          <TouchableOpacity onPress={mas} style={styles.stepBtn} disabled={cantidad >= tope}>
            <Text style={[styles.stepText, cantidad >= tope && { opacity: 0.4 }]}>+</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, producto.stock <= 0 && { opacity: 0.5 }]}
          onPress={agregar}
          disabled={producto.stock <= 0}
        >
          <Text style={styles.addBtnText}>Añadir al carrito</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { alignItems: 'center', justifyContent: 'center', gap: 12 },
  volver: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: ui.radius.full, backgroundColor: c.primary },
  volverText: { color: '#fff', fontWeight: ui.weight.bold },

  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8 },
  barBtn: { padding: 6 },
  barBtnText: { fontSize: ui.size.base, color: c.textPrimary, fontWeight: ui.weight.semibold },
  heart: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },

  imgWrap: {
    backgroundColor: '#F4F4F5', height: 260, marginHorizontal: 16, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', padding: 20,
  },
  img: { width: '100%', height: '100%' },
  content: { padding: 20 },
  marca: { fontSize: 11, color: '#aaa', fontWeight: ui.weight.semibold, letterSpacing: 0.5, marginBottom: 4 },
  nombreRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nombre: { flex: 1, fontSize: ui.size.xl, fontWeight: ui.weight.bold, color: '#111' },
  mas18: {
    backgroundColor: '#D8542C', color: '#fff', fontSize: 11, fontWeight: '800',
    borderRadius: ui.radius.full, paddingHorizontal: 7, paddingVertical: 2, overflow: 'hidden',
  },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 10 },
  oldPrice: { fontSize: 14, color: '#bbb', textDecorationLine: 'line-through' },
  newPrice: { fontSize: 24, fontWeight: ui.weight.bold, color: '#111' },
  porUnidad: { fontSize: 14, fontWeight: ui.weight.semibold, color: c.textMuted },
  contenido: { fontSize: 12, color: c.textMuted, marginTop: 2 },
  stock: { fontSize: ui.size.sm, color: c.primary, marginTop: 8 },
  sectionLabel: { fontSize: ui.size.base, fontWeight: ui.weight.bold, color: '#111', marginTop: 20, marginBottom: 8 },
  desc: { fontSize: ui.size.sm, color: c.textSecondary, lineHeight: 21 },

  bottomBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderTopWidth: 1, borderTopColor: c.cardBorder, backgroundColor: '#fff',
  },
  stepper: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: c.cardBorder,
    borderRadius: ui.radius.full,
  },
  stepBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 22, color: c.textPrimary },
  stepQty: { minWidth: 52, textAlign: 'center', fontSize: ui.size.sm, fontWeight: ui.weight.bold, color: c.textPrimary },
  addBtn: { flex: 1, backgroundColor: '#111', borderRadius: ui.radius.full, paddingVertical: 14, alignItems: 'center' },
  addBtnText: { color: '#fff', fontSize: ui.size.base, fontWeight: ui.weight.bold },
});
