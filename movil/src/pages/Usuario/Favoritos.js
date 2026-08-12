import {
  ScrollView, View, Text, Image, TouchableOpacity, StyleSheet,
} from 'react-native';
import { clientColors as c, estadoColores, ui } from '../../theme/Usuario/clientColors';
import { useFavoritosCtx } from '../../context/Usuario/FavoritosContext';
import { Corazon } from '../../components/UI/Iconos';
import { IconoPaquete, IconoBasura } from '../../components/Usuario/IconosCuenta';

/*
 * Favoritos — los productos que el cliente marcó con el corazón.
 * Puerto de `frontend/src/pages/cliente/Favoritos.jsx`. La lista vive en el
 * FavoritosContext (una sola carga para toda la app); aquí solo pintamos.
 */

const dinero = (n) => `$${(Number(n) || 0).toFixed(2)}`;

export default function Favoritos() {
  const { productos, cargando, alternar } = useFavoritosCtx();

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.h1}>Mis favoritos</Text>

      {cargando ? (
        <Text style={styles.cargando}>Cargando sus favoritos…</Text>
      ) : productos.length === 0 ? (
        <View style={styles.vacio}>
          <Corazon size={40} color={c.textMuted} />
          <Text style={styles.vacioTitulo}>Todavía no tiene favoritos</Text>
          <Text style={styles.vacioSub}>Toque el corazón de un producto en la tienda y aparecerá aquí.</Text>
        </View>
      ) : (
        productos.map((p) => {
          const imagen = Array.isArray(p.image) ? p.image[0] : p.image;
          return (
            <View key={p._id} style={styles.card}>
              {/* Mismo encuadre que la tienda: la foto entera, sin recortes. */}
              <View style={styles.imgWrap}>
                {imagen ? (
                  <Image source={{ uri: imagen }} style={styles.img} resizeMode="contain" />
                ) : (
                  <IconoPaquete size={36} color={c.textMuted} />
                )}
              </View>

              <View style={styles.body}>
                {!!p.brandId?.name && <Text style={styles.marca}>{p.brandId.name.toUpperCase()}</Text>}
                <Text style={styles.nombre}>{p.name}</Text>
                <Text style={styles.precio}>{dinero(p.salePrice)}</Text>

                <TouchableOpacity
                  style={styles.btnQuitar}
                  onPress={() => alternar(p._id, p.name)}
                >
                  <IconoBasura size={16} color={estadoColores.peligro} />
                  <Text style={styles.btnQuitarText}>Quitar de favoritos</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20 },
  h1: { fontSize: ui.size.xxl, fontWeight: ui.weight.bold, color: c.textPrimary, marginBottom: 24 },
  cargando: { fontSize: ui.size.sm, color: c.textSecondary },

  vacio: { alignItems: 'center', paddingVertical: 64 },
  vacioTitulo: { fontSize: ui.size.sm, fontWeight: ui.weight.semibold, color: c.textPrimary, marginTop: 12, marginBottom: 4 },
  vacioSub: { fontSize: ui.size.sm, color: c.textSecondary, textAlign: 'center', marginBottom: 20 },

  card: {
    backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder,
    borderRadius: ui.radius.xl, overflow: 'hidden', marginBottom: 16,
  },
  imgWrap: {
    height: 160, margin: 12, marginBottom: 0, borderRadius: ui.radius.lg,
    backgroundColor: c.primaryLight, alignItems: 'center', justifyContent: 'center', padding: 12,
  },
  img: { width: '100%', height: '100%' },
  body: { padding: 16 },
  marca: { fontSize: 10, fontWeight: ui.weight.bold, letterSpacing: 0.5, color: c.textMuted },
  nombre: { fontSize: ui.size.sm, fontWeight: ui.weight.bold, color: c.textPrimary, marginBottom: 4 },
  precio: { fontSize: ui.size.lg, fontWeight: ui.weight.extrabold, color: c.textPrimary, marginBottom: 12 },
  btnQuitar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 10, borderRadius: ui.radius.full, borderWidth: 1, borderColor: c.cardBorder,
  },
  btnQuitarText: { color: estadoColores.peligro, fontSize: ui.size.xs, fontWeight: ui.weight.semibold },
});
