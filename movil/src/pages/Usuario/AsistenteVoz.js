import {
  SafeAreaView, View, Text, TouchableOpacity, ScrollView, StyleSheet,
} from 'react-native';
import { clientColors as c, ui } from '../../theme/Usuario/clientColors';
import { useTienda } from '../../context/Usuario/TiendaContext';
import { useAsistenteVoz } from '../../hooks/Usuario/useAsistenteVoz';

/*
 * AsistenteVoz — la pantalla del asistente por voz.
 * Puerto de `frontend/src/components/Store/AsistenteVoz.jsx`. Solo pinta; la
 * lógica (escuchar, entender y ejecutar comandos) vive en useAsistenteVoz.
 *
 * Se conecta al MISMO carrito de la tienda (TiendaContext): agregar por voz
 * mueve el mismo carrito que se ve en la pantalla de la tienda.
 */
export default function AsistenteVoz({ navigation }) {
  const {
    productos, carrito, totalCarrito, categorias,
    agregarAlCarrito, eliminarDelCarrito, actualizarCantidad, limpiarCarrito,
    setCategoriaSeleccionada,
  } = useTienda();

  const asistente = useAsistenteVoz({
    productos, carrito, totalCarrito, categorias,
    agregarAlCarrito, eliminarDelCarrito, actualizarCantidad, limpiarCarrito,
    irAProducto: (p) => navigation.navigate('detalle', { productoId: p.id }),
    irACategoria: (cat) => { setCategoriaSeleccionada(cat); navigation.navigate('tienda'); },
    alConfirmarCompra: () => navigation.navigate('checkout'),
  });

  const {
    activo, escuchando, muteado, transcripcion, historial, hablando, velLabel, soportado,
    iniciar, detener, toggleMute, cambiarVelocidad, interrumpir,
  } = asistente;

  const estado = hablando ? 'Hablando…' : escuchando ? 'Escuchando…' : activo ? 'Un momento…' : 'Toca el micrófono para hablar';

  return (
    <SafeAreaView style={styles.container}>
      {/* Encabezado */}
      <View style={styles.head}>
        <TouchableOpacity onPress={() => { detener(); navigation.goBack(); }} style={styles.headBtn}>
          <Text style={styles.headBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Asistente de voz</Text>
        <TouchableOpacity onPress={cambiarVelocidad} style={styles.headBtn}>
          <Text style={styles.velText}>{velLabel}</Text>
        </TouchableOpacity>
      </View>

      {!soportado && (
        <View style={styles.aviso}>
          <Text style={styles.avisoText}>
            El reconocimiento de voz necesita un development build (npx expo run:android/ios).
            En Expo Go el asistente puede hablar, pero no escuchar.
          </Text>
        </View>
      )}

      {/* Conversación */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.chat} showsVerticalScrollIndicator={false}>
        {historial.length === 0 ? (
          <Text style={styles.hint}>
            Prueba diciendo: “quiero una manzana y dos galletas”, “cuánto llevo”, “vaciar carrito” o “comprar”.
          </Text>
        ) : (
          historial.map((m) => (
            <View key={m.id} style={[styles.burbuja, m.tipo === 'user' ? styles.burbujaUser : styles.burbujaBot]}>
              <Text style={[styles.burbujaText, m.tipo === 'user' && { color: '#fff' }]}>{m.texto}</Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* Transcripción en vivo */}
      {!!transcripcion && escuchando && (
        <Text style={styles.transcripcion}>“{transcripcion}”</Text>
      )}
      <Text style={styles.estado}>{estado}</Text>

      {/* Controles */}
      <View style={styles.controles}>
        <TouchableOpacity onPress={toggleMute} style={styles.ctrlBtn}>
          <Text style={styles.ctrlText}>{muteado ? '🔇' : '🔊'}</Text>
        </TouchableOpacity>

        {/* Micrófono central: inicia/detiene el asistente (o interrumpe si habla). */}
        <TouchableOpacity
          onPress={activo ? (hablando ? interrumpir : detener) : iniciar}
          style={[styles.mic, escuchando && styles.micOn, hablando && styles.micHablando]}
          activeOpacity={0.85}
        >
          <Text style={styles.micIcon}>🎤</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('carrito')} style={styles.ctrlBtn}>
          <Text style={styles.ctrlText}>🛒</Text>
          {carrito.length > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{carrito.length}</Text></View>}
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
  headBtn: { padding: 8, minWidth: 56, alignItems: 'center' },
  headBtnText: { fontSize: 18, color: c.textPrimary },
  title: { fontSize: ui.size.lg, fontWeight: ui.weight.bold, color: c.textPrimary },
  velText: { fontSize: ui.size.sm, color: c.primary, fontWeight: ui.weight.semibold },

  aviso: { backgroundColor: '#FFF6E9', padding: 12, margin: 12, borderRadius: ui.radius.lg, borderWidth: 1, borderColor: '#F3DFC0' },
  avisoText: { fontSize: ui.size.xs, color: '#7A3E08', lineHeight: 18 },

  chat: { padding: 16, gap: 10 },
  hint: { fontSize: ui.size.sm, color: c.textMuted, textAlign: 'center', marginTop: 24, lineHeight: 22 },
  burbuja: { maxWidth: '85%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  burbujaUser: { alignSelf: 'flex-end', backgroundColor: c.primary, borderBottomRightRadius: 4 },
  burbujaBot: { alignSelf: 'flex-start', backgroundColor: '#F1F1F3', borderBottomLeftRadius: 4 },
  burbujaText: { fontSize: ui.size.sm, color: c.textPrimary, lineHeight: 20 },

  transcripcion: { textAlign: 'center', color: c.textSecondary, fontStyle: 'italic', paddingHorizontal: 20 },
  estado: { textAlign: 'center', color: c.textMuted, fontSize: ui.size.sm, marginTop: 6, marginBottom: 10 },

  controles: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: 16, paddingHorizontal: 24 },
  ctrlBtn: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, borderColor: c.cardBorder, alignItems: 'center', justifyContent: 'center' },
  ctrlText: { fontSize: 22 },
  mic: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: c.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: c.primary, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  micOn: { backgroundColor: '#16a34a' },
  micHablando: { backgroundColor: c.primaryHover },
  micIcon: { fontSize: 34 },
  badge: {
    position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: '#D8542C', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: ui.weight.bold },
});
