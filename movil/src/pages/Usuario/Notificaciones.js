import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { clientColors as c, ui } from '../../theme/Usuario/clientColors';
import { useNotifications } from '../../hooks/Usuario/useNotifications';

/*
 * Notificaciones — el cliente activa/desactiva sus avisos (área "Mi Cuenta").
 * Puerto de `frontend/src/pages/cliente/Notificaciones.jsx`. La lógica vive en
 * useNotifications; aquí solo pintamos los interruptores.
 */

// Interruptor tipo "switch" (la web lo dibuja a mano; aquí igual, con Views).
const Toggle = ({ on, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={[styles.switch, { backgroundColor: on ? c.primary : c.cardBorder }]}
  >
    <View style={[styles.knob, { transform: [{ translateX: on ? 20 : 0 }] }]} />
  </TouchableOpacity>
);

const opciones = [
  { clave: 'promociones',     titulo: 'Promociones nuevas',     sub: 'Avísame de ofertas y descuentos.' },
  { clave: 'nuevosProductos', titulo: 'Productos nuevos',       sub: 'Avísame cuando lleguen productos.' },
  { clave: 'pedidoCerca',     titulo: 'Mi pedido va en camino', sub: 'Avísame cuando mi pedido esté cerca.' },
];

export default function Notificaciones() {
  const { prefs, loading, toggle } = useNotifications();

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.h1}>Notificaciones</Text>

      {loading ? (
        <Text style={styles.cargando}>Cargando tus preferencias…</Text>
      ) : (
        opciones.map((op) => (
          <View key={op.clave} style={styles.fila}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.titulo}>{op.titulo}</Text>
              <Text style={styles.sub}>{op.sub}</Text>
            </View>
            <Toggle on={!!prefs[op.clave]} onPress={() => toggle(op.clave)} />
          </View>
        ))
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20 },
  h1: { fontSize: ui.size.xxl, fontWeight: ui.weight.bold, color: c.textPrimary, marginBottom: 24 },
  cargando: { fontSize: ui.size.sm, color: c.textSecondary },

  fila: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, marginBottom: 8,
    backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder, borderRadius: ui.radius.lg,
  },
  titulo: { fontSize: ui.size.sm, fontWeight: ui.weight.semibold, color: c.textPrimary },
  sub: { fontSize: ui.size.xs, color: c.textSecondary, marginTop: 2 },

  switch: { width: 44, height: 24, borderRadius: 12, padding: 2, justifyContent: 'center' },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
});
