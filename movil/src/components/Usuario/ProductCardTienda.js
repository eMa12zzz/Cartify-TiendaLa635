import { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { clientColors as c, ui } from '../../theme/Usuario/clientColors';
import { useFavoritosCtx } from '../../context/Usuario/FavoritosContext';
import { useEdad } from '../../context/Usuario/EdadContext';
import { esPorLibra, esSoloAdultos, piezasEnTexto } from '../../utils/unidades';
import { Corazon, Candado } from '../UI/Iconos';
import { IconoPaquete } from './IconosCuenta';

/*
 * ProductCardTienda — la tarjeta de producto de la tienda.
 * Puerto de `frontend/src/components/Store/ProductCard.jsx`. Mantiene el diseño:
 * tarjeta blanca 16px con borde, recuadro gris para la foto, sello de promo
 * arriba-izquierda, corazón arriba-derecha, +18 pegado al nombre, precio con
 * tachado/"/lb" y el botón NEGRO de agregar.
 */

// Negro del botón de agregar (en la web es var(--tinta), el negro del diseño).
const NEGRO = '#111111';
const ALERTA = '#D8542C';

export default function ProductCardTienda({ producto, onVerDetalle, onAgregarAlCarrito, ancho }) {
  const { esFavorito, alternar } = useFavoritosCtx();
  const liked = esFavorito(producto.id);
  const [imgError, setImgError] = useState(false);

  // Candado +18: si es restringido y no confirmó edad, se tapa la foto.
  const { mayorConfirmado, pedirConfirmacion } = useEdad();
  const tapado = esSoloAdultos(producto) && !mayorConfirmado;
  const bajoStock = producto.stock < 10;

  const abrir = () => {
    if (tapado) { pedirConfirmacion(() => onVerDetalle(producto)); return; }
    onVerDetalle(producto);
  };
  const agregar = () => {
    if (tapado) { pedirConfirmacion(() => onAgregarAlCarrito(producto)); return; }
    onAgregarAlCarrito(producto);
  };

  const selloPromo = producto.promo && (
    producto.promo.type === 'nxm'
      ? `${producto.promo.buyQty}x${producto.promo.payQty}`
      : producto.promo.type === 'descuento'
        ? `-${producto.promo.discount}%`
        : producto.promo.type === 'anuncio'
          ? (producto.promo.etiqueta || 'Nuevo')
          : 'Oferta'
  );

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={abrir} style={[styles.card, ancho ? { width: ancho } : null]}>
      {/* Sello de promo */}
      {!!selloPromo && (
        <View style={styles.badge}><Text style={styles.badgeText}>{selloPromo}</Text></View>
      )}
      {/* Corazón */}
      <TouchableOpacity style={styles.heart} onPress={() => alternar(producto.id, producto.nombre)}>
        <Corazon size={16} color={liked ? '#ff4d6d' : '#ccc'} />
      </TouchableOpacity>

      {/* Recuadro de la foto */}
      <View style={styles.imgWrap}>
        {producto.imagen && !imgError ? (
          <Image
            source={{ uri: producto.imagen }}
            style={styles.img}
            resizeMode="contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <IconoPaquete size={38} color="#C4BDB6" />
        )}
        {tapado && (
          <View style={styles.cover}>
            <Candado size={22} color="#fff" />
            <Text style={styles.coverTitle}>Mayores de 18</Text>
            <Text style={styles.coverSub}>Tocá para confirmar tu edad</Text>
          </View>
        )}
      </View>

      {/* Cuerpo */}
      <View style={styles.body}>
        {!!producto.marca && <Text style={styles.marca}>{producto.marca.toUpperCase()}</Text>}
        <View style={styles.nombreRow}>
          <Text style={styles.nombre} numberOfLines={2}>{producto.nombre}</Text>
          {esSoloAdultos(producto) && <Text style={styles.mas18}>+18</Text>}
        </View>

        {producto.stock === 0 ? (
          <Text style={[styles.stock, { color: ALERTA }]}>Agotado</Text>
        ) : bajoStock ? (
          <Text style={[styles.stock, { color: ALERTA }]}>¡Quedan pocas!</Text>
        ) : null}

        <View style={styles.priceRow}>
          <View style={{ flex: 1 }}>
            {!!producto.precioAnterior && (
              <Text style={styles.oldPrice}>${Number(producto.precioAnterior).toFixed(2)}</Text>
            )}
            <Text style={styles.newPrice}>
              ${Number(producto.precio).toFixed(2)}
              {esPorLibra(producto) && <Text style={styles.porUnidad}>/lb</Text>}
            </Text>
            {!esPorLibra(producto) && piezasEnTexto(producto) && (
              <Text style={styles.contenido}>{piezasEnTexto(producto)}</Text>
            )}
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={agregar}>
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#f0f0f0',
    overflow: 'hidden',
  },
  badge: {
    position: 'absolute', top: 12, left: 12, zIndex: 2,
    backgroundColor: c.primary, borderRadius: ui.radius.full, paddingHorizontal: 10, paddingVertical: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: ui.weight.semibold },
  heart: {
    position: 'absolute', top: 12, right: 12, zIndex: 2,
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  imgWrap: {
    backgroundColor: '#F4F4F5', height: 150, margin: 10, marginBottom: 0, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', padding: 14, overflow: 'hidden',
  },
  img: { width: '100%', height: '100%' },
  cover: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(28,22,20,0.72)', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 8,
  },
  coverTitle: { color: '#fff', fontSize: 12, fontWeight: '800' },
  coverSub: { color: 'rgba(255,255,255,0.85)', fontSize: 10.5, textAlign: 'center' },
  body: { padding: 12, paddingTop: 10 },
  marca: { fontSize: 10, color: '#aaa', fontWeight: ui.weight.semibold, letterSpacing: 0.5, marginBottom: 3 },
  nombreRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  nombre: { flex: 1, fontSize: 14, fontWeight: ui.weight.semibold, color: '#111', lineHeight: 18 },
  mas18: {
    backgroundColor: ALERTA, color: '#fff', fontSize: 10, fontWeight: '800',
    borderRadius: ui.radius.full, paddingHorizontal: 6, paddingVertical: 1, overflow: 'hidden',
  },
  stock: { fontSize: 11, fontWeight: ui.weight.medium, marginTop: 3 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 10 },
  oldPrice: { fontSize: 11, color: '#bbb', textDecorationLine: 'line-through' },
  newPrice: { fontSize: 18, fontWeight: ui.weight.bold, color: '#111' },
  porUnidad: { fontSize: 12, fontWeight: ui.weight.semibold, color: c.textMuted },
  contenido: { fontSize: 11, fontWeight: ui.weight.medium, color: c.textMuted, marginTop: 1 },
  addBtn: {
    backgroundColor: NEGRO, width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 22, fontWeight: ui.weight.medium, lineHeight: 24 },
});
