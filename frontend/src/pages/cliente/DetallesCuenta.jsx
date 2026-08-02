import { useState, useEffect } from 'react';
import { useTheme } from '../../hooks/useClientTheme';
import { useClientProfile } from '../../hooks/useClientProfile';
import { formatearDui, formatearTelefono, LARGO_TELEFONO } from '../../utils/mascaras';

/*
 * DetallesCuenta — el cliente ve y edita sus datos básicos (área "Mi Cuenta").
 * La carga y el guardado viven en useClientProfile; aquí solo está el formulario.
 */
const DetallesCuenta = () => {
  const { palette } = useTheme();
  const c = palette.colors;
  const { profile, loading, saving, guardar } = useClientProfile();

  const [form, setForm] = useState({ fullName: '', userName: '', email: '', phoneNumber: '' });

  // Cuando llega el perfil de la base, precargamos el formulario.
  useEffect(() => {
    if (profile) {
      setForm({
        fullName: profile.fullName || '',
        userName: profile.userName || '',
        email: profile.email || '',
        phoneNumber: profile.phoneNumber || '',
      });
    }
  }, [profile]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const onSubmit = (e) => { e.preventDefault(); guardar(form); };

  const initials = (form.fullName || form.userName || 'C').substring(0, 1).toUpperCase();

  // Estilo común de los inputs (usa el tema).
  const inputStyle = {
    backgroundColor: c.cardBg,
    borderColor: c.cardBorder,
    color: c.textPrimary,
  };
  const labelStyle = { color: c.textPrimary };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: c.textPrimary }}>Detalles de la Cuenta</h1>

      {loading ? (
        <p className="text-sm" style={{ color: c.textSecondary }}>Cargando tu perfil…</p>
      ) : (
        <div className="flex flex-col md:flex-row gap-8">
          {/* Avatar */}
          <div className="flex-none flex flex-col items-center">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold"
              style={{ backgroundColor: c.primary, color: c.buttonText }}
            >
              {initials}
            </div>
            {/* Sin DUI no se muestra el renglón: el DUI es opcional y una
                etiqueta vacía solo hace ruido. */}
            {profile?.dui && (
              <p className="text-xs mt-3" style={{ color: c.textMuted }}>DUI: {formatearDui(profile.dui)}</p>
            )}
          </div>

          {/* Formulario */}
          <form onSubmit={onSubmit} className="flex-1 max-w-lg space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-bold" style={labelStyle}>Nombre completo</label>
              <input
                name="fullName" value={form.fullName} onChange={onChange}
                className="w-full px-4 py-2.5 rounded-xl border outline-none transition-colors"
                style={inputStyle}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-bold" style={labelStyle}>Nombre de usuario</label>
              <input
                name="userName" value={form.userName} onChange={onChange}
                className="w-full px-4 py-2.5 rounded-xl border outline-none transition-colors"
                style={inputStyle}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-bold" style={labelStyle}>Correo electrónico</label>
              <input
                type="email" name="email" value={form.email} onChange={onChange}
                className="w-full px-4 py-2.5 rounded-xl border outline-none transition-colors"
                style={inputStyle}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-bold" style={labelStyle}>Teléfono</label>
              {/* El guion lo pone la máscara y el campo topa en 8 dígitos: así
                  el teléfono queda guardado igual para todos. */}
              <input
                name="phoneNumber" inputMode="numeric" maxLength={LARGO_TELEFONO}
                value={formatearTelefono(form.phoneNumber)}
                onChange={(e) => onChange({ target: { name: 'phoneNumber', value: formatearTelefono(e.target.value) } })}
                className="w-full px-4 py-2.5 rounded-xl border outline-none transition-colors"
                style={inputStyle}
              />
            </div>

            <div className="pt-2">
              <button
                type="submit" disabled={saving}
                className="px-8 py-2.5 rounded-full font-bold shadow-sm transition-colors disabled:opacity-60"
                style={{ backgroundColor: c.primary, color: c.buttonText }}
              >
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default DetallesCuenta;
