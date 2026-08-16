import { useState } from 'react';
import { CreditCard, Wallet, Trash2, Plus, Gift } from 'lucide-react';
import { useTheme } from '../../hooks/useClientTheme';
import { usePaymentMethods } from '../../hooks/usePaymentMethods';
import { useSaldo } from '../../hooks/useSaldo';

/*
 * MetodoPago — el cliente gestiona sus métodos de pago (área "Mi Cuenta").
 * Importante: solo guardamos tipo, alias y últimos 4 dígitos — NUNCA el número
 * completo ni el CVV. El cobro real pasa por la pasarela (Wompi).
 */
const MetodoPago = () => {
  const { palette } = useTheme();
  const c = palette.colors;
  const { methods, loading, saving, agregar, eliminar } = usePaymentMethods();
  const [form, setForm] = useState({ type: 'tarjeta', alias: '', last4: '' });

  // Saldo digital cargado con tarjetas de regalo.
  const { saldo, cargando: cargandoSaldo, canjeando, canjear } = useSaldo();
  const [codigo, setCodigo] = useState('');

  const onCanjear = async (e) => {
    e.preventDefault();
    // Solo limpiamos el campo si el canje funcionó: si el código estaba mal,
    // que no tenga que escribirlo de nuevo entero.
    if (await canjear(codigo)) setCodigo('');
  };

  const onAgregar = (e) => {
    e.preventDefault();
    const esTarjeta = form.type === 'tarjeta';
    if (esTarjeta && form.last4.replace(/\D/g, '').length < 4) return;
    agregar({
      type: form.type,
      alias: form.alias.trim() || (esTarjeta ? 'Tarjeta' : 'Efectivo'),
      last4: esTarjeta ? form.last4.replace(/\D/g, '').slice(-4) : '',
    });
    setForm({ type: 'tarjeta', alias: '', last4: '' });
  };

  const inputStyle = { backgroundColor: c.cardBg, borderColor: c.cardBorder, color: c.textPrimary };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2" style={{ color: c.textPrimary }}>Métodos de pago</h1>
      <p className="text-xs mb-6" style={{ color: c.textMuted }}>
        Por seguridad solo guardamos los últimos 4 dígitos. Nunca el número completo ni el CVV.
      </p>

      {/* ── Saldo digital ── */}
      <div
        className="rounded-2xl p-5 mb-6"
        style={{ backgroundColor: c.primaryLight, border: `1px solid ${c.cardBorder}` }}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1" style={{ color: c.textSecondary }}>
              <Gift className="w-4 h-4" />
              <span className="text-sm font-medium">Saldo disponible</span>
            </div>
            <div className="text-3xl font-extrabold" style={{ color: c.primary }}>
              {cargandoSaldo ? '—' : `$${saldo.toFixed(2)}`}
            </div>
            <p className="text-xs mt-1" style={{ color: c.textMuted }}>
              Puede pagar sus compras con este saldo al finalizar el pedido.
            </p>
          </div>

          <form onSubmit={onCanjear} className="flex gap-2 items-start">
            <div>
              <input
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                placeholder="635-XXXX-XXXX"
                aria-label="Código de la tarjeta"
                className="px-3 py-2.5 rounded-xl border outline-none font-mono tracking-wider w-48"
                style={inputStyle}
              />
              <p className="text-xs mt-1" style={{ color: c.textMuted }}>
                Escriba el código de su tarjeta
              </p>
            </div>
            <button
              type="submit"
              disabled={canjeando}
              className="press px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: c.primary }}
            >
              {canjeando ? 'Canjeando…' : 'Canjear'}
            </button>
          </form>
        </div>
      </div>

      {/* Formulario para agregar un método */}
      <form onSubmit={onAgregar} className="flex flex-col sm:flex-row gap-2 mb-6">
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="px-3 py-2.5 rounded-xl border outline-none"
          style={inputStyle}
        >
          <option value="tarjeta">Tarjeta</option>
          <option value="efectivo">Efectivo</option>
        </select>
        <input
          value={form.alias}
          onChange={(e) => setForm({ ...form, alias: e.target.value })}
          placeholder="Alias (ej. Mi Visa)"
          className="flex-1 px-4 py-2.5 rounded-xl border outline-none"
          style={inputStyle}
        />
        {form.type === 'tarjeta' && (
          <input
            value={form.last4}
            onChange={(e) => setForm({ ...form, last4: e.target.value })}
            placeholder="Últimos 4"
            maxLength={4}
            inputMode="numeric"
            className="w-28 px-4 py-2.5 rounded-xl border outline-none"
            style={inputStyle}
          />
        )}
        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl font-bold shadow-sm transition-colors disabled:opacity-60"
          style={{ backgroundColor: c.primary, color: c.buttonText }}
        >
          <Plus className="w-4 h-4" /> Agregar
        </button>
      </form>

      {/* Lista de métodos */}
      {loading ? (
        <p className="text-sm" style={{ color: c.textSecondary }}>Cargando tus métodos…</p>
      ) : methods.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <CreditCard className="w-10 h-10 mb-3" style={{ color: c.textMuted }} />
          <p className="text-sm font-semibold mb-1" style={{ color: c.textPrimary }}>Sin métodos guardados</p>
          <p className="text-sm" style={{ color: c.textSecondary }}>Agrega una tarjeta o efectivo para tus compras.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {methods.map((m, i) => {
            const Icon = m.type === 'efectivo' ? Wallet : CreditCard;
            return (
              <div
                key={i}
                className="flex items-center gap-3 p-4 rounded-xl"
                style={{ backgroundColor: c.cardBg, border: `1px solid ${c.cardBorder}` }}
              >
                <Icon className="w-5 h-5 flex-none" style={{ color: c.primary }} />
                <div className="flex-1">
                  <div className="text-sm font-semibold" style={{ color: c.textPrimary }}>{m.alias || m.type}</div>
                  <div className="text-xs" style={{ color: c.textMuted }}>
                    {m.type === 'efectivo' ? 'Efectivo' : `Tarjeta •••• ${m.last4 || '••••'}`}
                  </div>
                </div>
                <button
                  onClick={() => eliminar(i)}
                  disabled={saving}
                  aria-label="Eliminar método de pago"
                  className="p-1.5 rounded-lg transition-colors disabled:opacity-60"
                  style={{ color: '#dc2626' }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MetodoPago;
