import { useState } from 'react';
import {
  ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet,
} from 'react-native';
import { clientColors as c, estadoColores, ui } from '../../theme/Usuario/clientColors';
import { useAddresses } from '../../hooks/Usuario/useAddresses';
import { Pin } from '../../components/UI/Iconos';
import { IconoBasura, IconoMas, IconoLetrero } from '../../components/Usuario/IconosCuenta';

/*
 * Direcciones — el cliente gestiona sus direcciones de entrega (área "Mi Cuenta").
 * Puerto de `frontend/src/pages/cliente/Direcciones.jsx`. La lógica (cargar/
 * agregar/eliminar) vive en useAddresses; aquí solo pintamos.
 *
 * ── Diferencia con la web ──
 * La web agrega la dirección marcándola sobre un mapa (react-leaflet), para
 * guardar las coordenadas. En móvil ese mapa todavía no existe (necesitaría
 * react-native-maps + permisos de ubicación), así que aquí se agrega con un
 * formulario de texto: funciona con la misma conexión y guarda nombre,
 * dirección y referencia. Las coordenadas quedan vacías hasta que se sume el mapa.
 */
export default function Direcciones() {
  const { addresses, loading, saving, agregar, eliminar } = useAddresses();

  // El formulario para agregar aparece/desaparece al tocar "Agregar".
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState({ nombre: '', direccion: '', referencia: '' });

  const onChange = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const onGuardar = () => {
    if (!form.direccion.trim()) return; // la dirección es lo único obligatorio
    agregar({ nombre: form.nombre.trim(), direccion: form.direccion.trim(), referencia: form.referencia.trim() });
    setForm({ nombre: '', direccion: '', referencia: '' });
    setAbierto(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.head}>
        <Text style={styles.h1}>Direcciones</Text>
        <TouchableOpacity style={styles.btnAdd} onPress={() => setAbierto((v) => !v)}>
          <IconoMas size={16} color={c.buttonText} />
          <Text style={styles.btnAddText}>{abierto ? 'Cerrar' : 'Agregar'}</Text>
        </TouchableOpacity>
      </View>

      {/* Formulario para agregar una dirección nueva. */}
      {abierto && (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            value={form.nombre}
            onChangeText={(v) => onChange('nombre', v)}
            placeholder="Nombre (ej. Casa, Trabajo) — opcional"
            placeholderTextColor={c.textMuted}
          />
          <TextInput
            style={styles.input}
            value={form.direccion}
            onChangeText={(v) => onChange('direccion', v)}
            placeholder="Dirección"
            placeholderTextColor={c.textMuted}
          />
          <TextInput
            style={styles.input}
            value={form.referencia}
            onChangeText={(v) => onChange('referencia', v)}
            placeholder="Referencia / punto de guía — opcional"
            placeholderTextColor={c.textMuted}
          />
          <TouchableOpacity
            style={[styles.btnGuardar, (saving || !form.direccion.trim()) && { opacity: 0.6 }]}
            onPress={onGuardar}
            disabled={saving || !form.direccion.trim()}
          >
            <Text style={styles.btnGuardarText}>{saving ? 'Guardando…' : 'Guardar dirección'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <Text style={styles.cargando}>Cargando tus direcciones…</Text>
      ) : addresses.length === 0 ? (
        <View style={styles.vacio}>
          <Pin size={40} color={c.textMuted} />
          <Text style={styles.vacioTitulo}>Sin direcciones guardadas</Text>
          <Text style={styles.vacioSub}>Agregue dónde le dejamos sus pedidos.</Text>
          <TouchableOpacity style={styles.btnPrimary} onPress={() => setAbierto(true)}>
            <Text style={styles.btnPrimaryText}>Agregar dirección</Text>
          </TouchableOpacity>
        </View>
      ) : (
        addresses.map((dir, i) => (
          <View key={i} style={styles.card}>
            <Pin size={20} color={c.primary} />
            <View style={styles.cardBody}>
              {!!dir.nombre && <Text style={styles.nombre}>{dir.nombre}</Text>}
              <Text style={[styles.dir, { color: dir.nombre ? c.textSecondary : c.textPrimary }]}>
                {dir.direccion}
              </Text>
              {!!dir.referencia && (
                <View style={styles.refRow}>
                  <IconoLetrero size={14} color={c.textMuted} />
                  <Text style={styles.ref}>{dir.referencia}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={() => eliminar(i)} disabled={saving} style={{ padding: 6 }}>
              <IconoBasura size={16} color={estadoColores.peligro} />
            </TouchableOpacity>
          </View>
        ))
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  h1: { fontSize: ui.size.xxl, fontWeight: ui.weight.bold, color: c.textPrimary },
  btnAdd: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: c.primary, borderRadius: ui.radius.full, paddingHorizontal: 16, paddingVertical: 10,
  },
  btnAddText: { color: c.buttonText, fontSize: ui.size.sm, fontWeight: ui.weight.bold },
  cargando: { fontSize: ui.size.sm, color: c.textSecondary },

  form: { gap: 8, marginBottom: 20 },
  input: {
    backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder, borderRadius: ui.radius.lg,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: ui.size.base, color: c.textPrimary,
  },
  btnGuardar: { backgroundColor: c.primary, borderRadius: ui.radius.lg, paddingVertical: 12, alignItems: 'center' },
  btnGuardarText: { color: c.buttonText, fontSize: ui.size.base, fontWeight: ui.weight.bold },

  vacio: { alignItems: 'center', paddingVertical: 48 },
  vacioTitulo: { fontSize: ui.size.sm, fontWeight: ui.weight.semibold, color: c.textPrimary, marginTop: 12, marginBottom: 4 },
  vacioSub: { fontSize: ui.size.sm, color: c.textSecondary, textAlign: 'center', marginBottom: 20 },
  btnPrimary: { backgroundColor: c.primary, borderRadius: ui.radius.full, paddingHorizontal: 20, paddingVertical: 8 },
  btnPrimaryText: { color: c.buttonText, fontSize: ui.size.sm, fontWeight: ui.weight.semibold },

  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16, marginBottom: 8,
    backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder, borderRadius: ui.radius.lg,
  },
  cardBody: { flex: 1 },
  nombre: { fontSize: ui.size.sm, fontWeight: ui.weight.bold, color: c.textPrimary, marginBottom: 2 },
  dir: { fontSize: ui.size.sm },
  refRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  ref: { fontSize: ui.size.xs, color: c.textMuted, flex: 1 },
});
