import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  ActivityIndicator, StyleSheet, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { clientColors as c, ui } from '../../theme/Usuario/clientColors';
import { useTienda } from '../../context/Usuario/TiendaContext';
import { useDireccionCtx } from '../../context/Usuario/DireccionContext';
import { useAuth } from '../../hooks/useAuth';
import ProductCardTienda from '../../components/Usuario/ProductCardTienda';
import PromoCard from '../../components/Usuario/PromoCard';
import { Persona } from '../../components/UI/Iconos';
import { IconoBolsa } from '../../components/Usuario/IconosCuenta';
import { NOMBRE_TIENDA } from '../../utils/tienda';
import { etiquetaPromo, textoVencimiento } from '../../utils/promos';

/*
 * Tienda — la portada del cliente (venta de productos).
 * Puerto de `frontend/src/pages/Store.jsx` (lo esencial): encabezado con el
 * nombre de la tienda + acceso a la cuenta y al carrito, buscador, pastillas de
 * categoría y la grilla de productos. Todo el estado (catálogo + carrito) vive
 * en el TiendaContext, así el carrito es el mismo aquí, en el detalle y al pagar.
 */

const GAP = 12;
const PAD = 16;
const { width: ANCHO_PANTALLA } = Dimensions.get('window');
const ANCHO_TARJETA = Math.floor((ANCHO_PANTALLA - PAD * 2 - GAP) / 2);
const ANCHO_BANNER = ANCHO_PANTALLA - PAD * 2; // el banner ocupa el ancho útil

export default function Tienda({ navigation }) {
  const {
    categorias, categoriaSeleccionada, setCategoriaSeleccionada,
    terminoBusqueda, setTerminoBusqueda,
    productosFiltrados, cantidadItems, agregarAlCarrito,
    cargando, promoSeleccionada, setPromoSeleccionada, promociones,
  } = useTienda();
  const { etiqueta } = useDireccionCtx();
  const { isAuthenticated } = useAuth();
  const [bannerActivo, setBannerActivo] = useState(0);
  const bannerRef = useRef(null);

  /*
   * Autoplay del carrusel de promociones: cada 4 s avanza a la siguiente y da
   * la vuelta al llegar al final. Solo si hay más de una. Se limpia al salir.
   */
  useEffect(() => {
    if (promociones.length <= 1) return undefined;
    const t = setInterval(() => {
      setBannerActivo((prev) => {
        const next = (prev + 1) % promociones.length;
        bannerRef.current?.scrollToOffset({ offset: next * (ANCHO_BANNER + GAP), animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(t);
  }, [promociones.length]);

  const verDetalle = (producto) => navigation.navigate('detalle', { productoId: producto.id });
  const irCarrito = () => navigation.navigate('carrito');
  // Con sesión va a "Mi Cuenta"; sin sesión, al login.
  const irCuenta = () => navigation.navigate(isAuthenticated ? 'miCuenta' : 'login');

  // "Todos" + las categorías de la tienda; la activa va en café sólido.
  const pills = ['Todos', ...categorias];
  const activa = categoriaSeleccionada || 'Todos';
  const elegirPill = (p) => {
    setPromoSeleccionada(null);
    setCategoriaSeleccionada(p === 'Todos' ? null : p);
  };

  const Cabecera = (
    <View>
      {/* Barra superior */}
      <View style={styles.topbar}>
        <View>
          <Text style={styles.brand}>{NOMBRE_TIENDA.arriba}</Text>
          <Text style={styles.brand}>{NOMBRE_TIENDA.abajo}</Text>
        </View>
        <View style={styles.topRight}>
          <TouchableOpacity style={styles.iconBtn} onPress={irCuenta}>
            <Persona size={20} color={c.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.cartBtn} onPress={irCarrito}>
            <IconoBolsa size={20} color="#fff" />
            {cantidadItems > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cantidadItems}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Dirección de entrega (toca para cambiarla en el mapa) */}
      <TouchableOpacity style={styles.dirBar} onPress={() => navigation.navigate('direccion')} activeOpacity={0.8}>
        <Text style={styles.dirLabel}>Entregar en:</Text>
        <Text style={styles.dirValor} numberOfLines={1}>{etiqueta || 'Elige tu dirección'}</Text>
        <Text style={styles.dirChevron}>›</Text>
      </TouchableOpacity>

      {/* Buscador */}
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          value={terminoBusqueda}
          onChangeText={setTerminoBusqueda}
          placeholder="Buscar productos, marcas…"
          placeholderTextColor={c.textMuted}
          returnKeyType="search"
        />
      </View>

      {/* Promociones: carrusel de tarjetas temáticas (como el frontend). Tocar
          una filtra la tienda a esa promo; los puntos marcan en cuál vas. */}
      {promociones.length > 0 && (
        <View style={{ paddingTop: 14 }}>
          <FlatList
            ref={bannerRef}
            data={promociones}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item._id}
            snapToInterval={ANCHO_BANNER + GAP}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: PAD, gap: GAP }}
            onMomentumScrollEnd={(e) =>
              setBannerActivo(Math.round(e.nativeEvent.contentOffset.x / (ANCHO_BANNER + GAP)))
            }
            renderItem={({ item }) => (
              <PromoCard
                promo={item}
                title={item.title}
                descripcion={item.promoDescription}
                etiqueta={etiquetaPromo(item)}
                vencimiento={textoVencimiento(item)}
                imagen={item.image}
                width={ANCHO_BANNER}
                onPress={() => setPromoSeleccionada(item)}
              />
            )}
          />
          {promociones.length > 1 && (
            <View style={styles.dots}>
              {promociones.map((p, i) => (
                <View key={p._id} style={[styles.dot, i === bannerActivo && styles.dotOn]} />
              ))}
            </View>
          )}
        </View>
      )}

      {/* Aviso de filtro por promo activo */}
      {promoSeleccionada && (
        <TouchableOpacity style={styles.promoTag} onPress={() => setPromoSeleccionada(null)}>
          <Text style={styles.promoTagText}>
            Mostrando promoción · toca para ver todo ✕
          </Text>
        </TouchableOpacity>
      )}

      {/* Servicio de impresiones (otro "módulo" de la tienda). */}
      <TouchableOpacity style={styles.servicio} onPress={() => navigation.navigate('impresiones')} activeOpacity={0.85}>
        <Text style={styles.servicioIcon}>🖨️</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.servicioTitulo}>Servicio de impresiones</Text>
          <Text style={styles.servicioSub}>Imprime documentos y fotos desde tu teléfono</Text>
        </View>
        <Text style={styles.dirChevron}>›</Text>
      </TouchableOpacity>

      {/* Pastillas de categoría */}
      <FlatList
        data={pills}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.pills}
        renderItem={({ item }) => {
          const on = activa === item;
          return (
            <TouchableOpacity
              style={[styles.pill, on && styles.pillOn]}
              onPress={() => elegirPill(item)}
            >
              <Text style={[styles.pillText, { color: on ? '#fff' : c.textSecondary }]}>{item}</Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );

  if (cargando) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator color={c.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={productosFiltrados}
        keyExtractor={(item) => item.id}
        numColumns={2}
        ListHeaderComponent={Cabecera}
        columnWrapperStyle={styles.row}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ProductCardTienda
            producto={item}
            ancho={ANCHO_TARJETA}
            onVerDetalle={verDetalle}
            onAgregarAlCarrito={agregarAlCarrito}
          />
        )}
        ListEmptyComponent={
          <View style={styles.vacio}>
            <Text style={styles.vacioText}>No hay productos que coincidan.</Text>
          </View>
        }
      />

      {/* Botón flotante del asistente por voz. */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('asistente')} activeOpacity={0.85}>
        <Text style={styles.fabIcon}>🎤</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { alignItems: 'center', justifyContent: 'center' },

  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: PAD, paddingTop: 8, paddingBottom: 4,
  },
  brand: { fontSize: 15, fontWeight: ui.weight.bold, color: c.textPrimary, lineHeight: 17 },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: c.cardBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  cartBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: c.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: '#D8542C', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: ui.weight.bold },

  dirBar: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: PAD, paddingTop: 6, paddingBottom: 2 },
  dirLabel: { fontSize: ui.size.xs, color: c.textMuted },
  dirValor: { flex: 1, fontSize: ui.size.sm, color: c.textPrimary, fontWeight: ui.weight.semibold },
  dirChevron: { fontSize: 18, color: c.textMuted },

  searchWrap: { paddingHorizontal: PAD, paddingTop: 8, paddingBottom: 4 },
  search: {
    backgroundColor: '#F4F4F5', borderRadius: ui.radius.full,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: ui.size.base, color: c.textPrimary,
  },

  promoTag: { marginHorizontal: PAD, marginTop: 8, backgroundColor: c.primaryLight, borderRadius: ui.radius.md, padding: 10 },
  promoTagText: { color: c.primary, fontSize: ui.size.sm, fontWeight: ui.weight.semibold },

  servicio: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: PAD, marginTop: 14,
    padding: 14, borderRadius: ui.radius.lg, borderWidth: 1, borderColor: c.cardBorder, backgroundColor: c.primaryLight,
  },
  servicioIcon: { fontSize: 26 },
  servicioTitulo: { fontSize: ui.size.sm, fontWeight: ui.weight.bold, color: c.textPrimary },
  servicioSub: { fontSize: ui.size.xs, color: c.textSecondary, marginTop: 2 },

  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, marginTop: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D9C7B4' },
  dotOn: { width: 22, backgroundColor: c.primaryHover },

  pills: { paddingHorizontal: PAD, paddingVertical: 12, gap: 8 },
  pill: {
    paddingHorizontal: 18, height: 38, borderRadius: ui.radius.full, justifyContent: 'center',
    borderWidth: 1, borderColor: c.cardBorder, backgroundColor: '#fff',
  },
  pillOn: { backgroundColor: c.primary, borderColor: c.primary },
  pillText: { fontSize: 14, fontWeight: ui.weight.medium },

  row: { paddingHorizontal: PAD, gap: GAP, marginBottom: GAP },
  vacio: { padding: 40, alignItems: 'center' },
  vacioText: { color: c.textSecondary, fontSize: ui.size.sm },

  fab: {
    position: 'absolute', right: 18, bottom: 24,
    width: 58, height: 58, borderRadius: 29, backgroundColor: c.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: c.primary, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 6,
  },
  fabIcon: { fontSize: 26 },
});
