import {
  ScrollView, View, Text, Image, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { clientColors as c, ui } from '../../theme/Usuario/clientColors';
import { useTienda } from '../../context/Usuario/TiendaContext';
import { esPorLibra, pasoDe, cantidadConUnidad } from '../../utils/unidades';
import { IconoBolsa, IconoBasura } from '../../components/Usuario/IconosCuenta';

/*
 * Carrito — el contenido del carrito con cantidades y subtotal.
 * Puerto de la parte de lista de `frontend/src/components/Store/ShoppingCart.jsx`.
 * Toda la lógica (carrito, total con NxM, subir/bajar, quitar) vive en el
 * TiendaContext; aquí solo se pinta. El envío y el pago se deciden en el checkout.
 */
export default function Carrito({ navigation }) {
  const {
    carrito, totalCarrito, cantidadItems,
    actualizarCantidad, eliminarDelCarrito, limpiarCarrito,
  } = useTienda();

  const irCheckout = () => navigation.navigate('checkout');

  return (
    <SafeAreaView style={styles.container}>
      {/* Encabezado */}
      <View style={styles.head}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headBtn}>
          <Text style={styles.headBtnText}>‹ Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mi Carrito</Text>
        {carrito.length > 0 ? (
          <TouchableOpacity onPress={limpiarCarrito}><Text style={styles.vaciar}>Vaciar</Text></TouchableOpacity>
        ) : <View style={{ width: 48 }} />}
      </View>

      {carrito.length === 0 ? (
        <View style={styles.vacio}>
          <IconoBolsa size={48} color={c.textMuted} />
          <Text style={styles.vacioTitulo}>Tu carrito está vacío</Text>
          <Text style={styles.vacioSub}>¡Explora nuestros productos y comienza a comprar!</Text>
          <TouchableOpacity style={styles.explorar} onPress={() => navigation.navigate('tienda')}>
            <Text style={styles.explorarText}>Explorar productos</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
            {carrito.map((item) => {
              const paso = pasoDe(item);
              return (
                <View key={item.id} style={styles.item}>
                  <View style={styles.itemImg}>
                    {item.imagen ? (
                      <Image source={{ uri: item.imagen }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                    ) : (
                      <IconoBolsa size={22} color={c.textMuted} />
                    )}
                  </View>

                  <View style={{ flex: 1 }}>
                    {!!item.marca && <Text style={styles.itemMarca}>{item.marca.toUpperCase()}</Text>}
                    <Text style={styles.itemNombre} numberOfLines={2}>{item.nombre}</Text>
                    <Text style={styles.itemPrecio}>
                      ${Number(item.precio).toFixed(2)}{esPorLibra(item) ? '/lb' : ''}
                    </Text>

                    {/* Selector de cantidad + quitar */}
                    <View style={styles.itemFoot}>
                      <View style={styles.stepper}>
                        <TouchableOpacity onPress={() => actualizarCantidad(item.id, Number((item.cantidad - paso).toFixed(2)))} style={styles.stepBtn}>
                          <Text style={styles.stepText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.stepQty}>{cantidadConUnidad(item, item.cantidad)}</Text>
                        <TouchableOpacity
                          onPress={() => actualizarCantidad(item.id, Number((item.cantidad + paso).toFixed(2)))}
                          style={styles.stepBtn}
                          disabled={item.cantidad >= item.stock}
                        >
                          <Text style={[styles.stepText, item.cantidad >= item.stock && { opacity: 0.4 }]}>+</Text>
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity onPress={() => eliminarDelCarrito(item.id)} style={{ padding: 6 }}>
                        <IconoBasura size={16} color="#dc2626" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Importe de la línea */}
                  <Text style={styles.itemTotal}>${(item.precio * item.cantidad).toFixed(2)}</Text>
                </View>
              );
            })}

            {/* Resumen */}
            <View style={styles.resumen}>
              <Text style={styles.resumenTitulo}>Resumen del pedido</Text>
              <View style={styles.resumenRow}>
                <Text style={styles.resumenLabel}>Subtotal ({cantidadItems} art.)</Text>
                <Text style={styles.resumenValor}>${totalCarrito.toFixed(2)}</Text>
              </View>
              <Text style={styles.resumenNota}>El costo de envío se calcula en el siguiente paso.</Text>
            </View>
          </ScrollView>

          {/* Barra inferior de pago */}
          <View style={styles.bottomBar}>
            <View>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValor}>${totalCarrito.toFixed(2)}</Text>
            </View>
            <TouchableOpacity style={styles.pagar} onPress={irCheckout}>
              <Text style={styles.pagarText}>Proceder al pago</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  head: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.cardBorder,
  },
  headBtn: { padding: 6, width: 70 },
  headBtnText: { fontSize: ui.size.base, color: c.textPrimary, fontWeight: ui.weight.semibold },
  title: { fontSize: ui.size.lg, fontWeight: ui.weight.bold, color: c.textPrimary },
  vaciar: { fontSize: ui.size.sm, color: '#dc2626', fontWeight: ui.weight.semibold, width: 48, textAlign: 'right' },

  vacio: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  vacioTitulo: { fontSize: ui.size.lg, fontWeight: ui.weight.bold, color: c.textPrimary, marginTop: 16, marginBottom: 6 },
  vacioSub: { fontSize: ui.size.sm, color: c.textMuted, textAlign: 'center', marginBottom: 24 },
  explorar: { backgroundColor: c.primary, borderRadius: ui.radius.full, paddingHorizontal: 24, paddingVertical: 12 },
  explorarText: { color: '#fff', fontWeight: ui.weight.semibold },

  item: {
    flexDirection: 'row', gap: 12, padding: 12, marginBottom: 10,
    borderWidth: 1, borderColor: c.cardBorder, borderRadius: ui.radius.lg, backgroundColor: '#fff',
  },
  itemImg: {
    width: 64, height: 64, borderRadius: ui.radius.md, backgroundColor: '#F4F4F5',
    alignItems: 'center', justifyContent: 'center', padding: 6,
  },
  itemMarca: { fontSize: 10, color: '#aaa', fontWeight: ui.weight.semibold, letterSpacing: 0.5 },
  itemNombre: { fontSize: ui.size.sm, fontWeight: ui.weight.semibold, color: '#111', marginBottom: 2 },
  itemPrecio: { fontSize: ui.size.sm, color: c.textSecondary, marginBottom: 8 },
  itemFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: c.cardBorder, borderRadius: ui.radius.full },
  stepBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 18, color: c.textPrimary },
  stepQty: { minWidth: 46, textAlign: 'center', fontSize: ui.size.xs, fontWeight: ui.weight.bold, color: c.textPrimary },
  itemTotal: { fontSize: ui.size.sm, fontWeight: ui.weight.bold, color: '#111' },

  resumen: { marginTop: 8, padding: 16, borderRadius: ui.radius.lg, backgroundColor: '#F7F7F8' },
  resumenTitulo: { fontSize: ui.size.base, fontWeight: ui.weight.bold, color: c.textPrimary, marginBottom: 10 },
  resumenRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  resumenLabel: { color: c.textSecondary, fontSize: ui.size.sm },
  resumenValor: { color: c.textPrimary, fontSize: ui.size.sm, fontWeight: ui.weight.semibold },
  resumenNota: { color: c.textMuted, fontSize: ui.size.xs, marginTop: 4 },

  bottomBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderTopWidth: 1, borderTopColor: c.cardBorder, backgroundColor: '#fff',
  },
  totalLabel: { fontSize: ui.size.xs, color: c.textMuted },
  totalValor: { fontSize: ui.size.xl, fontWeight: ui.weight.extrabold, color: c.textPrimary },
  pagar: { backgroundColor: c.primary, borderRadius: ui.radius.full, paddingHorizontal: 28, paddingVertical: 14 },
  pagarText: { color: '#fff', fontSize: ui.size.base, fontWeight: ui.weight.bold },
});
