import { useState } from 'react';
import {
  ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet,
} from 'react-native';
import { clientColors as c, estadoColores, ui } from '../../theme/Usuario/clientColors';
import { usePaymentMethods } from '../../hooks/Usuario/usePaymentMethods';
import { useSaldo } from '../../hooks/Usuario/useSaldo';
import {
  IconoTarjeta, IconoBilletera, IconoBasura, IconoMas, IconoRegalo,
} from '../../components/Usuario/IconosCuenta';

/*
 * MetodoPago — el cliente gestiona sus métodos de pago (área "Mi Cuenta").
 * Puerto de `frontend/src/pages/cliente/MetodoPago.jsx`.
 *
 * Importante: solo guardamos tipo, alias y últimos 4 dígitos — NUNCA el número
 * completo ni el CVV. El cobro real pasa por la pasarela.
 */
export default function MetodoPago() {
  const { methods, loading, saving, agregar, eliminar } = usePaymentMethods();
  const [form, setForm] = useState({ type: 'tarjeta', alias: '', last4: '' });

  // Saldo digital cargado con tarjetas de regalo.
  const { saldo, cargando: cargandoSaldo, canjeando, canjear } = useSaldo();
  const [codigo, setCodigo] = useState('');

  const onCanjear = async () => {
    if (await canjear(codigo)) setCodigo('');
  };

  const onAgregar = () => {
    const esTarjeta = form.type === 'tarjeta';
    if (esTarjeta && form.last4.replace(/\D/g, '').length < 4) return;
    agregar({
      type: form.type,
      alias: form.alias.trim() || (esTarjeta ? 'Tarjeta' : 'Efectivo'),
      last4: esTarjeta ? form.last4.replace(/\D/g, '').slice(-4) : '',
    });
    setForm({ type: 'tarjeta', alias: '', last4: '' });
  };

  const esTarjeta = form.type === 'tarjeta';

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.h1}>Métodos de pago</Text>
      <Text style={styles.aviso}>
        Por seguridad solo guardamos los últimos 4 dígitos. Nunca el número completo ni el CVV.
      </Text>

      {/* ── Saldo digital ── */}
      <View style={styles.saldoCard}>
        <View style={styles.saldoHead}>
          <IconoRegalo size={16} color={c.textSecondary} />
          <Text style={styles.saldoLabel}>Saldo disponible</Text>
        </View>
        <Text style={styles.saldoMonto}>{cargandoSaldo ? '—' : `$${saldo.toFixed(2)}`}</Text>
        <Text style={styles.saldoNota}>
          Puede pagar sus compras con este saldo al finalizar el pedido.
        </Text>

        <View style={styles.canjeRow}>
          <TextInput
            style={styles.canjeInput}
            value={codigo}
            onChangeText={(v) => setCodigo(v.toUpperCase())}
            placeholder="635-XXXX-XXXX"
            placeholderTextColor={c.textMuted}
            autoCapitalize="characters"
          />
          <TouchableOpacity style={[styles.canjeBtn, canjeando && { opacity: 0.6 }]} onPress={onCanjear} disabled={canjeando}>
            <Text style={styles.canjeBtnText}>{canjeando ? 'Canjeando…' : 'Canjear'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.saldoNota}>Escriba el código de su tarjeta</Text>
      </View>

      {/* ── Formulario para agregar un método ── */}
      <View style={styles.form}>
        {/* Selector de tipo (la web usa <select>; en RN, dos botones). */}
        <View style={styles.tipoRow}>
          {['tarjeta', 'efectivo'].map((t) => {
            const on = form.type === t;
            return (
              <TouchableOpacity
                key={t}
                style={[styles.tipoBtn, on && styles.tipoBtnOn]}
                onPress={() => setForm({ ...form, type: t })}
              >
                <Text style={[styles.tipoText, { color: on ? c.buttonText : c.textPrimary }]}>
                  {t === 'tarjeta' ? 'Tarjeta' : 'Efectivo'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TextInput
          style={styles.input}
          value={form.alias}
          onChangeText={(v) => setForm({ ...form, alias: v })}
          placeholder="Alias (ej. Mi Visa)"
          placeholderTextColor={c.textMuted}
        />
        {esTarjeta && (
          <TextInput
            style={styles.input}
            value={form.last4}
            onChangeText={(v) => setForm({ ...form, last4: v })}
            placeholder="Últimos 4"
            placeholderTextColor={c.textMuted}
            keyboardType="number-pad"
            maxLength={4}
          />
        )}
        <TouchableOpacity style={[styles.addBtn, saving && { opacity: 0.6 }]} onPress={onAgregar} disabled={saving}>
          <IconoMas size={16} color={c.buttonText} />
          <Text style={styles.addBtnText}>Agregar</Text>
        </TouchableOpacity>
      </View>

      {/* ── Lista de métodos ── */}
      {loading ? (
        <Text style={styles.cargando}>Cargando tus métodos…</Text>
      ) : methods.length === 0 ? (
        <View style={styles.vacio}>
          <IconoTarjeta size={40} color={c.textMuted} />
          <Text style={styles.vacioTitulo}>Sin métodos guardados</Text>
          <Text style={styles.vacioSub}>Agrega una tarjeta o efectivo para tus compras.</Text>
        </View>
      ) : (
        methods.map((m, i) => {
          const Icono = m.type === 'efectivo' ? IconoBilletera : IconoTarjeta;
          return (
            <View key={i} style={styles.metodo}>
              <Icono size={20} color={c.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.metodoAlias}>{m.alias || m.type}</Text>
                <Text style={styles.metodoSub}>
                  {m.type === 'efectivo' ? 'Efectivo' : `Tarjeta •••• ${m.last4 || '••••'}`}
                </Text>
              </View>
              <TouchableOpacity onPress={() => eliminar(i)} disabled={saving} style={{ padding: 6 }}>
                <IconoBasura size={16} color={estadoColores.peligro} />
              </TouchableOpacity>
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
  h1: { fontSize: ui.size.xxl, fontWeight: ui.weight.bold, color: c.textPrimary, marginBottom: 8 },
  aviso: { fontSize: ui.size.xs, color: c.textMuted, marginBottom: 24 },
  cargando: { fontSize: ui.size.sm, color: c.textSecondary },

  saldoCard: {
    backgroundColor: c.primaryLight, borderWidth: 1, borderColor: c.cardBorder,
    borderRadius: ui.radius.xl, padding: 20, marginBottom: 24,
  },
  saldoHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  saldoLabel: { fontSize: ui.size.sm, fontWeight: ui.weight.medium, color: c.textSecondary },
  saldoMonto: { fontSize: ui.size.huge, fontWeight: ui.weight.extrabold, color: c.primary },
  saldoNota: { fontSize: ui.size.xs, color: c.textMuted, marginTop: 4 },
  canjeRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  canjeInput: {
    flex: 1, backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder,
    borderRadius: ui.radius.lg, paddingHorizontal: 12, paddingVertical: 10, color: c.textPrimary,
    letterSpacing: 1,
  },
  canjeBtn: { backgroundColor: c.primary, borderRadius: ui.radius.lg, paddingHorizontal: 20, justifyContent: 'center' },
  canjeBtnText: { color: c.buttonText, fontSize: ui.size.sm, fontWeight: ui.weight.semibold },

  form: { marginBottom: 24, gap: 8 },
  tipoRow: { flexDirection: 'row', gap: 8 },
  tipoBtn: { flex: 1, borderWidth: 1, borderColor: c.cardBorder, borderRadius: ui.radius.lg, paddingVertical: 10, alignItems: 'center' },
  tipoBtnOn: { backgroundColor: c.primary, borderColor: c.primary },
  tipoText: { fontSize: ui.size.sm, fontWeight: ui.weight.semibold },
  input: {
    backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder, borderRadius: ui.radius.lg,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: ui.size.base, color: c.textPrimary,
  },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: c.primary, borderRadius: ui.radius.lg, paddingVertical: 12,
  },
  addBtnText: { color: c.buttonText, fontSize: ui.size.base, fontWeight: ui.weight.bold },

  vacio: { alignItems: 'center', paddingVertical: 48 },
  vacioTitulo: { fontSize: ui.size.sm, fontWeight: ui.weight.semibold, color: c.textPrimary, marginTop: 12, marginBottom: 4 },
  vacioSub: { fontSize: ui.size.sm, color: c.textSecondary, textAlign: 'center' },

  metodo: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, marginBottom: 8,
    backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder, borderRadius: ui.radius.lg,
  },
  metodoAlias: { fontSize: ui.size.sm, fontWeight: ui.weight.semibold, color: c.textPrimary },
  metodoSub: { fontSize: ui.size.xs, color: c.textMuted },
});
