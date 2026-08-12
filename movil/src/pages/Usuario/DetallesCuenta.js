import { useState, useEffect } from 'react';
import {
  ScrollView, View, Text, TextInput, TouchableOpacity, Image, StyleSheet,
} from 'react-native';
import { clientColors as c, ui } from '../../theme/Usuario/clientColors';
import { useClientProfile } from '../../hooks/Usuario/useClientProfile';
import { formatearDui, formatearTelefono, LARGO_TELEFONO, LARGO_DUI } from '../../utils/mascaras';
import { EDAD_MINIMA, esMayorDeEdad } from '../../utils/edad';

/*
 * DetallesCuenta — el cliente ve y edita sus datos básicos (área "Mi Cuenta").
 * Puerto de `frontend/src/pages/cliente/DetallesCuenta.jsx`. La carga y el
 * guardado viven en useClientProfile; aquí solo está el formulario.
 */

// Fecha (Date/ISO) → "YYYY-MM-DD" para el campo de texto.
const aTextoFecha = (valor) => {
  if (!valor) return '';
  const f = new Date(valor);
  return isNaN(f.getTime()) ? '' : f.toISOString().split('T')[0];
};

// Da forma de fecha a lo que se va escribiendo: 8 dígitos → 2000-01-31.
const formatearFecha = (valor) => {
  const d = String(valor || '').replace(/\D/g, '').slice(0, 8);
  if (d.length <= 4) return d;
  if (d.length <= 6) return `${d.slice(0, 4)}-${d.slice(4)}`;
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}`;
};

export default function DetallesCuenta() {
  const { profile, loading, saving, guardar } = useClientProfile();

  const [form, setForm] = useState({
    fullName: '', userName: '', email: '', phoneNumber: '', fechaNacimiento: '', dui: '',
  });

  // Cuando llega el perfil de la base, precargamos el formulario.
  useEffect(() => {
    if (profile) {
      setForm({
        fullName: profile.fullName || '',
        userName: profile.userName || '',
        email: profile.email || '',
        phoneNumber: profile.phoneNumber || '',
        fechaNacimiento: aTextoFecha(profile.fechaNacimiento),
        dui: profile.dui || '',
      });
    }
  }, [profile]);

  const onChange = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  // El DUI solo se habilita si la fecha dice que ya es mayor: en El Salvador el
  // DUI se emite a los 18.
  const mayorDeEdad = esMayorDeEdad(form.fechaNacimiento);

  const onSubmit = () => {
    guardar({ ...form, dui: mayorDeEdad ? form.dui : '' });
  };

  const initials = (form.fullName || form.userName || 'C').substring(0, 1).toUpperCase();

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.h1}>Detalles de la Cuenta</Text>

      {loading ? (
        <Text style={styles.cargando}>Cargando tu perfil…</Text>
      ) : (
        <>
          {/* Avatar: la foto del cliente si la tiene; si no, su inicial. */}
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              {profile?.image ? (
                <Image source={{ uri: profile.image }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarInitial}>{initials}</Text>
              )}
            </View>
            {!!profile?.dui && (
              <Text style={styles.avatarHint}>DUI: {formatearDui(profile.dui)}</Text>
            )}
          </View>

          {/* Formulario */}
          <Campo label="Nombre completo">
            <TextInput
              style={styles.input}
              value={form.fullName}
              onChangeText={(v) => onChange('fullName', v)}
            />
          </Campo>

          <Campo label="Nombre de usuario">
            <TextInput
              style={styles.input}
              value={form.userName}
              onChangeText={(v) => onChange('userName', v)}
              autoCapitalize="none"
            />
          </Campo>

          <Campo label="Correo electrónico">
            <TextInput
              style={styles.input}
              value={form.email}
              onChangeText={(v) => onChange('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </Campo>

          <Campo label="Teléfono">
            {/* El guion lo pone la máscara y topa en 8 dígitos. */}
            <TextInput
              style={styles.input}
              value={formatearTelefono(form.phoneNumber)}
              onChangeText={(v) => onChange('phoneNumber', formatearTelefono(v))}
              keyboardType="number-pad"
              maxLength={LARGO_TELEFONO}
            />
          </Campo>

          <Campo label="Fecha de nacimiento">
            <TextInput
              style={styles.input}
              value={form.fechaNacimiento}
              onChangeText={(v) => onChange('fechaNacimiento', formatearFecha(v))}
              keyboardType="number-pad"
              placeholder="AAAA-MM-DD"
              placeholderTextColor={c.textMuted}
              maxLength={10}
            />
            <Text style={styles.ayuda}>
              Con ella se habilitan los productos para mayores de {EDAD_MINIMA}. El documento se
              revisa igual al entregar el pedido.
            </Text>
          </Campo>

          <Campo label={`DUI  (opcional)`}>
            <TextInput
              style={[styles.input, !mayorDeEdad && styles.inputOff]}
              value={formatearDui(form.dui)}
              onChangeText={(v) => onChange('dui', formatearDui(v))}
              editable={mayorDeEdad}
              keyboardType="number-pad"
              maxLength={LARGO_DUI}
              placeholder={mayorDeEdad ? '00000000-0' : 'Se habilita al indicar 18 años o más'}
              placeholderTextColor={c.textMuted}
            />
            {!mayorDeEdad && (
              <Text style={styles.ayuda}>
                El DUI se habilita cuando tu fecha de nacimiento indica {EDAD_MINIMA} años o más.
              </Text>
            )}
          </Campo>

          <TouchableOpacity
            style={[styles.btn, saving && styles.btnOff]}
            onPress={onSubmit}
            disabled={saving}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>{saving ? 'Guardando…' : 'Guardar cambios'}</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </>
      )}
    </ScrollView>
  );
}

// Un renglón de formulario: etiqueta en negrita + el control.
const Campo = ({ label, children }) => (
  <View style={styles.campo}>
    <Text style={styles.label}>{label}</Text>
    {children}
  </View>
);

const styles = StyleSheet.create({
  scroll: { padding: 20 },
  h1: { fontSize: ui.size.xxl, fontWeight: ui.weight.bold, color: c.textPrimary, marginBottom: 24 },
  cargando: { fontSize: ui.size.sm, color: c.textSecondary },

  avatarWrap: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 96, height: 96, borderRadius: 48, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center', backgroundColor: c.primary,
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarInitial: { color: c.buttonText, fontSize: 34, fontWeight: ui.weight.bold },
  avatarHint: { fontSize: ui.size.xs, color: c.textMuted, marginTop: 8 },

  campo: { marginBottom: 16 },
  label: { fontSize: ui.size.sm, fontWeight: ui.weight.bold, color: c.textPrimary, marginBottom: 6 },
  input: {
    backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder,
    borderRadius: ui.radius.lg, paddingHorizontal: 16, paddingVertical: 10,
    fontSize: ui.size.base, color: c.textPrimary,
  },
  inputOff: { opacity: 0.6 },
  ayuda: { fontSize: ui.size.xs, color: c.textMuted, marginTop: 6 },

  btn: {
    marginTop: 8, alignSelf: 'flex-start',
    backgroundColor: c.primary, borderRadius: ui.radius.full,
    paddingHorizontal: 32, paddingVertical: 12,
  },
  btnOff: { opacity: 0.6 },
  btnText: { color: c.buttonText, fontWeight: ui.weight.bold, fontSize: ui.size.base },
});
