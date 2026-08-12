import { useState } from 'react';
import {
  ScrollView, View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

/*
 * Carga PROTEGIDA del mapa. En Expo Go (sobre todo Android) el módulo nativo de
 * react-native-maps puede no estar disponible; un import directo tumbaría TODA
 * la app al arrancar. Con require dentro de try/catch, si el módulo no está,
 * MapView queda en null y el checkout sigue funcionando con "usar mi ubicación"
 * (GPS) + dirección escrita, solo que sin el mapa visual. Con un development
 * build (npx expo run:android/ios) el mapa aparece.
 */
import { clientColors as c, ui } from '../../theme/Usuario/clientColors';
import { useTienda } from '../../context/Usuario/TiendaContext';
import { useDireccionCtx } from '../../context/Usuario/DireccionContext';
import { useAuth } from '../../hooks/useAuth';
import { orderService } from '../../api/Usuario/orderService';
import { aviso } from '../../utils/aviso';
import { direccionDesdeCoords, CENTRO_POR_DEFECTO } from '../../utils/geo';
import MapaLeaflet from '../../components/Usuario/MapaLeaflet';

/*
 * Checkout — terminar el pedido: entrega, dirección en el mapa, pago y crear.
 * Puerto de la parte de checkout de `frontend/src/components/Store/ShoppingCart.jsx`
 * y del selector de dirección (`SelectorDireccion.jsx`).
 *
 * Adaptaciones de móvil:
 *   - El mapa web (react-leaflet) → react-native-maps (MapView + Marker
 *     arrastrable). El pin se mueve tocando el mapa o arrastrándolo.
 *   - "Usar mi ubicación" (geolocalización del navegador) → expo-location.
 *   - La dirección escrita de unas coordenadas sale de Location.reverseGeocode
 *     (nativo), en vez de Nominatim.
 * El payload de createOrder es EXACTAMENTE el mismo que la web.
 */

// San Salvador: dónde abre el mapa si aún no sabemos dónde está la persona.
const CENTRO = CENTRO_POR_DEFECTO;

// Precio efectivo de una línea con NxM (cada N unidades se pagan M).
const precioEfectivo = (item) => {
  if (item.promo?.type === 'nxm') {
    const b = item.promo.buyQty || 2;
    const m = item.promo.payQty || 1;
    const grupos = Math.floor(item.cantidad / b);
    const pagados = grupos * m + (item.cantidad % b);
    return Number(((item.precio * pagados) / item.cantidad).toFixed(4));
  }
  return item.precio;
};

export default function Checkout({ navigation }) {
  const { carrito, totalCarrito, limpiarCarrito } = useTienda();
  const { user, esCliente } = useAuth();
  const { activa } = useDireccionCtx();

  const [entrega, setEntrega] = useState('delivery');     // 'delivery' | 'pickup'
  const [metodoPago, setMetodoPago] = useState('efectivo'); // 'efectivo' | 'tarjeta'
  // Se prellena con la dirección activa (la que se eligió al iniciar/arriba).
  const [coord, setCoord] = useState(
    activa?.lat != null ? { latitude: activa.lat, longitude: activa.lng } : null
  );
  const [direccion, setDireccion] = useState(activa?.direccion || '');
  const [referencia, setReferencia] = useState(activa?.referencia || '');
  const [localizando, setLocalizando] = useState(false);
  const [procesando, setProcesando] = useState(false);

  // Coordenadas → dirección con Nominatim (OSM), igual que la web.
  const leerDireccion = async ({ latitude, longitude }) => {
    try {
      const texto = await direccionDesdeCoords(latitude, longitude);
      if (texto) setDireccion(texto);
    } catch {
      // Sin conexión el pin igual queda puesto y se puede escribir a mano.
    }
  };

  // Mover el pin (tocar el mapa o arrastrarlo).
  const marcarEn = (c2) => { setCoord(c2); leerDireccion(c2); };

  // "Usar mi ubicación": pide permiso y centra el mapa en el GPS.
  const localizarme = async () => {
    setLocalizando(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        aviso('No nos dio permiso de ubicarlo. Puede mover el pin en el mapa.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      marcarEn({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    } catch {
      aviso('No pudimos ubicarlo. Pruebe moviendo el pin en el mapa.');
    } finally {
      setLocalizando(false);
    }
  };

  const confirmar = async () => {
    if (!esCliente) {
      // La tienda se recorre sin cuenta, pero para pagar sí hace falta: se
      // lleva al login y luego puede volver a su carrito, que sigue lleno.
      aviso('Inicie sesión para terminar su pedido');
      navigation.navigate('login');
      return;
    }
    if (entrega === 'delivery' && (!coord || !direccion.trim())) {
      aviso('Marque su dirección de entrega en el mapa');
      return;
    }
    setProcesando(true);
    try {
      await orderService.createOrder({
        clientId: user.id,
        items: carrito.map((i) => ({
          productId: i.id, name: i.nombre, price: precioEfectivo(i), amount: i.cantidad,
        })),
        paymentMethod: metodoPago,
        deliveryType: entrega,
        deliveryAddress: entrega === 'delivery' ? direccion.trim() : undefined,
        deliveryReference: entrega === 'delivery' ? referencia.trim() : undefined,
        deliveryLat: entrega === 'delivery' ? coord.latitude : undefined,
        deliveryLng: entrega === 'delivery' ? coord.longitude : undefined,
        channel: 'movil',
      });
      limpiarCarrito();
      Alert.alert('¡Pedido realizado!', 'Tu pedido se registró correctamente. Puedes verlo en "Mis pedidos".', [
        { text: 'Ir a la tienda', onPress: () => navigation.navigate('tienda') },
      ]);
    } catch (error) {
      aviso(error?.message || 'No se pudo crear el pedido');
    } finally {
      setProcesando(false);
    }
  };

  const Opcion = ({ activo, onPress, titulo, sub }) => (
    <TouchableOpacity style={[styles.opcion, activo && styles.opcionOn]} onPress={onPress}>
      <Text style={[styles.opcionTitulo, activo && { color: c.primary }]}>{titulo}</Text>
      {!!sub && <Text style={styles.opcionSub}>{sub}</Text>}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.head}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headBtn}>
          <Text style={styles.headBtnText}>‹ Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Finalizar compra</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        {/* Tipo de entrega */}
        <Text style={styles.label}>¿Cómo lo quieres recibir?</Text>
        <View style={styles.opciones}>
          <Opcion activo={entrega === 'delivery'} onPress={() => setEntrega('delivery')} titulo="A domicilio" sub="Te lo llevamos" />
          <Opcion activo={entrega === 'pickup'} onPress={() => setEntrega('pickup')} titulo="Retiro en tienda" sub="Pasas a traerlo" />
        </View>

        {/* Dirección en el mapa (solo domicilio) */}
        {entrega === 'delivery' && (
          <>
            <Text style={styles.label}>Tu dirección de entrega</Text>
            {/* El MISMO mapa Leaflet de la web (dentro de un WebView). */}
            <View style={styles.mapWrap}>
              <MapaLeaflet centro={CENTRO} coord={coord} onMove={marcarEn} />
            </View>

            <TouchableOpacity style={styles.ubicBtn} onPress={localizarme} disabled={localizando}>
              {localizando
                ? <ActivityIndicator color={c.primary} />
                : <Text style={styles.ubicBtnText}>📍 Usar mi ubicación</Text>}
            </TouchableOpacity>
            <Text style={styles.mapHint}>Toca el mapa o arrastra el pin para marcar el punto exacto.</Text>

            <TextInput
              style={styles.input}
              value={direccion}
              onChangeText={setDireccion}
              placeholder="Dirección (se llena sola con el pin, o escríbela)"
              placeholderTextColor={c.textMuted}
              multiline
            />
            <TextInput
              style={styles.input}
              value={referencia}
              onChangeText={setReferencia}
              placeholder="Referencia (portón, color de casa…) — opcional"
              placeholderTextColor={c.textMuted}
            />
          </>
        )}

        {/* Método de pago */}
        <Text style={styles.label}>Método de pago</Text>
        <View style={styles.opciones}>
          <Opcion activo={metodoPago === 'efectivo'} onPress={() => setMetodoPago('efectivo')} titulo="Efectivo" sub="Pagas al recibir" />
          <Opcion activo={metodoPago === 'tarjeta'} onPress={() => setMetodoPago('tarjeta')} titulo="Tarjeta" sub="En la entrega" />
        </View>

        {/* Resumen */}
        <View style={styles.resumen}>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Total del pedido</Text>
            <Text style={styles.resumenValor}>${totalCarrito.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Confirmar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.confirmar, (procesando || carrito.length === 0) && { opacity: 0.6 }]}
          onPress={confirmar}
          disabled={procesando || carrito.length === 0}
        >
          <Text style={styles.confirmarText}>
            {procesando ? 'Procesando…' : `Confirmar pedido · $${totalCarrito.toFixed(2)}`}
          </Text>
        </TouchableOpacity>
      </View>
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

  label: { fontSize: ui.size.sm, fontWeight: ui.weight.bold, color: c.textPrimary, marginTop: 20, marginBottom: 10 },
  opciones: { flexDirection: 'row', gap: 10 },
  opcion: { flex: 1, borderWidth: 1, borderColor: c.cardBorder, borderRadius: ui.radius.lg, padding: 14 },
  opcionOn: { borderColor: c.primary, backgroundColor: c.primaryLight },
  opcionTitulo: { fontSize: ui.size.sm, fontWeight: ui.weight.bold, color: c.textPrimary },
  opcionSub: { fontSize: ui.size.xs, color: c.textMuted, marginTop: 2 },

  mapWrap: { height: 220, borderRadius: ui.radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: c.cardBorder },
  map: { flex: 1 },
  mapFallback: {
    borderRadius: ui.radius.lg, borderWidth: 1, borderColor: c.cardBorder,
    backgroundColor: '#F7F7F8', padding: 16,
  },
  mapFallbackText: { fontSize: ui.size.sm, color: c.textSecondary, lineHeight: 20 },
  mapFallbackCoord: { fontSize: ui.size.xs, color: c.primary, fontWeight: ui.weight.semibold, marginTop: 8 },
  ubicBtn: {
    marginTop: 10, borderWidth: 1, borderColor: c.primary, borderRadius: ui.radius.full,
    paddingVertical: 12, alignItems: 'center',
  },
  ubicBtnText: { color: c.primary, fontWeight: ui.weight.semibold },
  mapHint: { fontSize: ui.size.xs, color: c.textMuted, marginTop: 8 },
  input: {
    marginTop: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: c.cardBorder, borderRadius: ui.radius.lg,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: ui.size.base, color: c.textPrimary,
  },

  resumen: { marginTop: 24, padding: 16, borderRadius: ui.radius.lg, backgroundColor: '#F7F7F8' },
  resumenRow: { flexDirection: 'row', justifyContent: 'space-between' },
  resumenLabel: { color: c.textSecondary, fontSize: ui.size.base, fontWeight: ui.weight.semibold },
  resumenValor: { color: c.textPrimary, fontSize: ui.size.lg, fontWeight: ui.weight.extrabold },

  bottomBar: { padding: 16, borderTopWidth: 1, borderTopColor: c.cardBorder, backgroundColor: '#fff' },
  confirmar: { backgroundColor: c.primary, borderRadius: ui.radius.full, paddingVertical: 16, alignItems: 'center' },
  confirmarText: { color: '#fff', fontSize: ui.size.base, fontWeight: ui.weight.bold },
});
