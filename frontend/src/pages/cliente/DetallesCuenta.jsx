import { useState, useEffect, useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { useTheme } from '../../hooks/useClientTheme';
import { useClientProfile } from '../../hooks/useClientProfile';
import { formatearDui, formatearTelefono, LARGO_TELEFONO, LARGO_DUI } from '../../utils/mascaras';
import { calcularEdad, EDAD_MINIMA, esMayorDeEdad } from '../../utils/edad';

// Fecha (Date/ISO) → valor de un <input type="date"> ("YYYY-MM-DD").
const aInputDate = (valor) => {
  if (!valor) return '';
  const f = new Date(valor);
  return isNaN(f.getTime()) ? '' : f.toISOString().split('T')[0];
};

/*
 * DetallesCuenta — el cliente ve y edita sus datos básicos (área "Mi Cuenta").
 * La carga y el guardado viven en useClientProfile; aquí solo está el formulario.
 */
const DetallesCuenta = () => {
  const { palette } = useTheme();
  const c = palette.colors;
  const { profile, loading, saving, subiendoFoto, guardar, subirFoto } = useClientProfile();

  // La foto: el input real vive escondido y lo dispara el avatar.
  const fotoInputRef = useRef(null);
  const alElegirFoto = (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = ''; // permite volver a elegir la misma foto
    if (archivo) subirFoto(archivo);
  };

  const [form, setForm] = useState({ fullName: '', userName: '', email: '', phoneNumber: '', fechaNacimiento: '', dui: '' });

  // Cuando llega el perfil de la base, precargamos el formulario.
  useEffect(() => {
    if (profile) {
      setForm({
        fullName: profile.fullName || '',
        userName: profile.userName || '',
        email: profile.email || '',
        phoneNumber: profile.phoneNumber || '',
        fechaNacimiento: aInputDate(profile.fechaNacimiento),
        dui: profile.dui || '',
      });
    }
  }, [profile]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // El DUI solo se habilita si la fecha dice que ya es mayor: en El Salvador el
  // DUI se emite a los 18, así que un menor cargándolo no tendría sentido.
  const mayorDeEdad = esMayorDeEdad(form.fechaNacimiento);

  const onSubmit = (e) => {
    e.preventDefault();
    // Si por lo que sea no es mayor, no se manda un DUI que no debería tener.
    guardar({ ...form, dui: mayorDeEdad ? form.dui : '' });
  };

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
          {/* Avatar: se toca para subir/cambiar la foto. */}
          <div className="flex-none flex flex-col items-center">
            <input
              ref={fotoInputRef}
              type="file"
              accept="image/*"
              onChange={alElegirFoto}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => !subiendoFoto && fotoInputRef.current?.click()}
              disabled={subiendoFoto}
              aria-label={profile?.image ? 'Cambiar la foto de perfil' : 'Subir una foto de perfil'}
              className="group relative w-24 h-24 rounded-full overflow-hidden flex items-center justify-center text-3xl font-bold transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: c.primary, color: c.buttonText }}
            >
              {profile?.image ? (
                <img src={profile.image} alt="Foto de perfil" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
              {/* Velo con la cámara al pasar el mouse, o spinner mientras sube. */}
              <span
                className={`absolute inset-0 flex items-center justify-center bg-black/45 text-white transition-opacity ${
                  subiendoFoto ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
              >
                {subiendoFoto ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
              </span>
            </button>
            <p className="text-xs mt-2" style={{ color: c.textMuted }}>
              {profile?.image ? 'Toca para cambiarla' : 'Toca para subir tu foto'}
            </p>
            {/* Sin DUI no se muestra el renglón: el DUI es opcional y una
                etiqueta vacía solo hace ruido. */}
            {profile?.dui && (
              <p className="text-xs mt-2" style={{ color: c.textMuted }}>DUI: {formatearDui(profile.dui)}</p>
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

            {/* Fecha de nacimiento: habilita los productos +18. */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold" style={labelStyle}>Fecha de nacimiento</label>
              <input
                type="date" name="fechaNacimiento"
                value={form.fechaNacimiento}
                max={new Date().toISOString().split('T')[0]}
                onChange={onChange}
                className="w-full px-4 py-2.5 rounded-xl border outline-none transition-colors"
                style={inputStyle}
              />
              <p className="text-xs" style={{ color: c.textMuted }}>
                Con ella se habilitan los productos para mayores de {EDAD_MINIMA}. El documento se
                revisa igual al entregar el pedido.
              </p>
            </div>

            {/* DUI: solo se habilita si la fecha indica 18 años o más. */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold" style={labelStyle}>
                DUI <span className="font-normal" style={{ color: c.textMuted }}>(opcional)</span>
              </label>
              <input
                type="text" name="dui" inputMode="numeric" maxLength={LARGO_DUI}
                value={formatearDui(form.dui)}
                disabled={!mayorDeEdad}
                onChange={(e) => onChange({ target: { name: 'dui', value: formatearDui(e.target.value) } })}
                className="w-full px-4 py-2.5 rounded-xl border outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                style={inputStyle}
                placeholder={mayorDeEdad ? '00000000-0' : 'Se habilita al indicar 18 años o más'}
              />
              {!mayorDeEdad && (
                <p className="text-xs" style={{ color: c.textMuted }}>
                  El DUI se habilita cuando tu fecha de nacimiento indica {EDAD_MINIMA} años o más.
                </p>
              )}
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
