import { ScrollView, View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { clientColors as c, ui } from '../../theme/Usuario/clientColors';
import { useReparto, enlaceDeRuta } from '../../hooks/Usuario/useReparto';
import { fechaCorta, hora } from '../../utils/fecha';
import { Bici, Pin, Telefono } from '../../components/UI/Iconos';
import { IconoPaquete, IconoNavegar, IconoLetrero } from '../../components/Usuario/IconosCuenta';

/*
 * Reparto — los pedidos a domicilio pendientes, para quien los lleva.
 * Puerto de `frontend/src/pages/cliente/Reparto.jsx`.
 *
 * Vive en el área de cliente porque el repartidor trabaja desde el teléfono en
 * la calle. Cada pedido muestra la dirección, la referencia y un botón que abre
 * la navegación del teléfono (Linking → Google Maps/Waze).
 *
 * ── Diferencias con la web (por dependencias no instaladas) ──
 * La web dibuja un mini-mapa (react-leaflet) y comparte la ubicación en vivo
 * (GPS + wake-lock). Eso necesita `react-native-maps` y `expo-location`, que
 * este proyecto todavía no trae. Aquí se omiten el mapa y el "Voy en camino":
 * queda el flujo esencial de reparto (ver, navegar, preparar, entregar), listo
 * para sumar el mapa el día que se agreguen esos módulos.
 */
const dinero = (n) => `$${(Number(n) || 0).toFixed(2)}`;

export default function Reparto() {
  const { pedidos, cargando, moviendo, habilitado, avanzar } = useReparto();

  // Un cliente no reparte: si llega aquí de casualidad, se le dice y ya.
  if (!habilitado) {
    return (
      <View style={styles.noPersonal}>
        <Bici size={40} color={c.textMuted} />
        <Text style={styles.noPersonalText}>Esta pantalla es para el personal de la tienda</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.h1}>Reparto</Text>
      <Text style={styles.sub}>Pedidos a domicilio que faltan por entregar.</Text>

      {cargando ? (
        <Text style={styles.cargando}>Cargando los pedidos…</Text>
      ) : pedidos.length === 0 ? (
        <View style={styles.vacio}>
          <IconoPaquete size={40} color={c.textMuted} />
          <Text style={styles.vacioTitulo}>No hay entregas pendientes</Text>
          <Text style={styles.vacioSub}>Cuando entre un pedido a domicilio, aparecerá aquí.</Text>
        </View>
      ) : (
        pedidos.map((p) => (
          <View key={p._id} style={styles.card}>
            <View style={styles.cardHead}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cliente}>{p.clientId?.fullName || 'Cliente'}</Text>
                <Text style={styles.meta}>
                  #{String(p._id).slice(-6).toUpperCase()} · {p.items?.length || 0} productos · {dinero(p.total)}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: p.status === 'preparando' ? '#FFF4E5' : '#E8F1FF' }]}>
                <Text style={[styles.badgeText, { color: p.status === 'preparando' ? '#B4590C' : '#0F47AF' }]}>
                  {p.status === 'preparando' ? 'Preparando' : 'Por preparar'}
                </Text>
              </View>
            </View>

            <View style={styles.linea}>
              <Pin size={16} color={c.primary} />
              <Text style={styles.direccion}>{p.deliveryAddress}</Text>
            </View>

            {!!p.deliveryReference && (
              <View style={styles.linea}>
                <IconoLetrero size={16} color={c.textMuted} />
                <Text style={styles.referencia}>{p.deliveryReference}</Text>
              </View>
            )}

            {!!p.clientId?.phoneNumber && (
              <TouchableOpacity style={styles.telRow} onPress={() => Linking.openURL(`tel:${p.clientId.phoneNumber}`)}>
                <Telefono size={14} color={c.primary} />
                <Text style={styles.tel}>{p.clientId.phoneNumber}</Text>
              </TouchableOpacity>
            )}

            {!!p.preparedAt && (
              <Text style={styles.preparado}>
                Preparado a las {hora(p.preparedAt)}{p.preparedBy ? ` por ${p.preparedBy}` : ''}
              </Text>
            )}

            <View style={styles.acciones}>
              {/* Abre el mapa del teléfono con la ruta. */}
              <TouchableOpacity style={styles.btnLlegar} onPress={() => Linking.openURL(enlaceDeRuta(p))}>
                <IconoNavegar size={16} color={c.buttonText} />
                <Text style={styles.btnLlegarText}>Cómo llegar</Text>
              </TouchableOpacity>

              {p.status === 'pagado' ? (
                <TouchableOpacity
                  style={[styles.btnOutline, moviendo === p._id && { opacity: 0.6 }]}
                  onPress={() => avanzar(p, 'preparando')}
                  disabled={moviendo === p._id}
                >
                  <Text style={styles.btnOutlineText}>{moviendo === p._id ? 'Marcando…' : 'Empezar a preparar'}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.btnEntregar, moviendo === p._id && { opacity: 0.6 }]}
                  onPress={() => avanzar(p, 'entregado')}
                  disabled={moviendo === p._id}
                >
                  <Text style={styles.btnEntregarText}>{moviendo === p._id ? 'Marcando…' : 'Marcar entregado'}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20 },
  h1: { fontSize: ui.size.xxl, fontWeight: ui.weight.bold, color: c.textPrimary, marginBottom: 4 },
  sub: { fontSize: ui.size.sm, color: c.textSecondary, marginBottom: 16 },
  cargando: { fontSize: ui.size.sm, color: c.textSecondary },

  noPersonal: { alignItems: 'center', paddingVertical: 64, paddingHorizontal: 20 },
  noPersonalText: { fontSize: ui.size.sm, fontWeight: ui.weight.semibold, color: c.textPrimary, marginTop: 12, textAlign: 'center' },

  vacio: { alignItems: 'center', paddingVertical: 64 },
  vacioTitulo: { fontSize: ui.size.sm, fontWeight: ui.weight.semibold, color: c.textPrimary, marginTop: 12, marginBottom: 4 },
  vacioSub: { fontSize: ui.size.sm, color: c.textSecondary, textAlign: 'center' },

  card: {
    backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder,
    borderRadius: ui.radius.xl, padding: 16, marginBottom: 16,
  },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  cliente: { fontSize: ui.size.sm, fontWeight: ui.weight.bold, color: c.textPrimary },
  meta: { fontSize: ui.size.xs, color: c.textMuted, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: ui.radius.full },
  badgeText: { fontSize: ui.size.xs, fontWeight: ui.weight.bold },

  linea: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 4 },
  direccion: { flex: 1, fontSize: ui.size.sm, color: c.textPrimary },
  referencia: { flex: 1, fontSize: ui.size.xs, color: c.textSecondary },
  telRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  tel: { fontSize: ui.size.xs, fontWeight: ui.weight.semibold, color: c.primary },
  preparado: { fontSize: ui.size.xs, color: c.textMuted, marginTop: 8 },

  acciones: { flexDirection: 'row', gap: 8, marginTop: 16 },
  btnLlegar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: c.primary, borderRadius: ui.radius.full, paddingVertical: 12,
  },
  btnLlegarText: { color: c.buttonText, fontSize: ui.size.sm, fontWeight: ui.weight.bold },
  btnOutline: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: c.cardBorder, borderRadius: ui.radius.full, paddingVertical: 12,
  },
  btnOutlineText: { color: c.textPrimary, fontSize: ui.size.sm, fontWeight: ui.weight.bold },
  btnEntregar: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#16a34a', borderRadius: ui.radius.full, paddingVertical: 12,
  },
  btnEntregarText: { color: '#16a34a', fontSize: ui.size.sm, fontWeight: ui.weight.bold },
});
