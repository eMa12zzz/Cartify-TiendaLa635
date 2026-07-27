import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Trash2, Settings2 } from 'lucide-react';
import { useCreditoProveedor } from '../../hooks/useCreditoProveedor';
import { bloquearTeclasNumero } from '../../utils/validaciones';
import { modalTransition, modalInitial, modalAnimate } from '../../utils/motion';

/*
 * CuentaProveedorModal — el estado de cuenta con un proveedor.
 *
 * Lo primero que ve el gerente es lo VENCIDO, porque es lo que le cuesta plata
 * si lo deja pasar. La deuda total y el cupo van después.
 */
const hoyISO = () => new Date().toISOString().slice(0, 10);
const dinero = (n) => `$${(Number(n) || 0).toFixed(2)}`;
const fecha = (d) => (d ? new Date(d).toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

const CuentaProveedorModal = ({ isOpen, onClose, proveedor }) => {
  const { cuenta, cargando, guardando, registrar, borrarMovimiento, guardarLimite } =
    useCreditoProveedor(isOpen ? proveedor?._id : null);

  const [form, setForm] = useState({ type: 'compra', amount: '', date: hoyISO(), reference: '', note: '' });
  const [editandoLimite, setEditandoLimite] = useState(false);
  const [limite, setLimite] = useState({ creditLimit: '', creditDays: '' });

  const onRegistrar = async (e) => {
    e.preventDefault();
    if (await registrar(form)) {
      setForm({ type: form.type, amount: '', date: hoyISO(), reference: '', note: '' });
    }
  };

  const abrirLimite = () => {
    setLimite({
      creditLimit: cuenta?.supplier?.creditLimit || '',
      creditDays: cuenta?.supplier?.creditDays || '',
    });
    setEditandoLimite(true);
  };

  const inputCls = 'bg-white border border-gray-300 text-gray-900 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-[#9C6026]';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40" onClick={onClose} />
          <motion.div
            initial={modalInitial} animate={modalAnimate} exit={modalInitial} transition={modalTransition}
            className="bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col overflow-hidden relative z-10 max-h-[92vh]"
          >
            <div className="bg-[#9C6026] text-white p-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{proveedor?.name}</h2>
                <p className="text-sm opacity-80">Estado de cuenta</p>
              </div>
              <button onClick={onClose} aria-label="Cerrar" className="press p-1 hover:opacity-70">
                <X size={22} />
              </button>
            </div>

            <div className="p-6 bg-[#FAF9F6] flex-1 overflow-y-auto">
              {cargando || !cuenta ? (
                <p className="text-gray-500">Cargando estado de cuenta…</p>
              ) : (
                <>
                  {/* Lo vencido primero: es lo que cuesta plata si se deja pasar */}
                  {cuenta.montoVencido > 0 && (
                    <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                      <AlertTriangle className="w-5 h-5 text-red-500 flex-none mt-0.5" />
                      <div>
                        <p className="font-bold text-red-700">
                          {dinero(cuenta.montoVencido)} vencidos
                        </p>
                        <p className="text-sm text-red-600">
                          {cuenta.vencidas.length} factura{cuenta.vencidas.length > 1 ? 's' : ''} pasada
                          {cuenta.vencidas.length > 1 ? 's' : ''} de fecha.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                    {[
                      { l: 'Deuda actual', v: dinero(cuenta.deuda), destacar: cuenta.deuda > 0 },
                      { l: 'Vence esta semana', v: dinero(cuenta.montoPorVencer) },
                      {
                        l: 'Cupo disponible',
                        // null = nadie configuró límite, distinto de "no tiene cupo"
                        v: cuenta.disponible === null ? 'Sin límite' : dinero(cuenta.disponible),
                      },
                      { l: 'Pagado en total', v: dinero(cuenta.totalPagado) },
                    ].map((c) => (
                      <div key={c.l} className="bg-white p-3 rounded-xl border border-gray-100">
                        <div className="text-xs text-gray-500 mb-0.5">{c.l}</div>
                        <div className={`text-lg font-bold ${c.destacar ? 'text-[#B47C4D]' : 'text-gray-800'}`}>{c.v}</div>
                      </div>
                    ))}
                  </div>

                  {cuenta.saldoAFavor > 0 && (
                    <p className="text-sm text-green-600 mb-4">
                      Tiene {dinero(cuenta.saldoAFavor)} a favor: pagó más de lo que debía.
                    </p>
                  )}

                  {/* Límite */}
                  <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-3 mb-5">
                    {editandoLimite ? (
                      <div className="flex items-center gap-2 flex-wrap w-full">
                        <span className="text-sm text-gray-600">Límite $</span>
                        <input type="number" min="0" step="0.01" onKeyDown={bloquearTeclasNumero}
                          value={limite.creditLimit} onChange={(e) => setLimite({ ...limite, creditLimit: e.target.value })}
                          className={`${inputCls} w-28`} />
                        <span className="text-sm text-gray-600">a</span>
                        <input type="number" min="0" step="1" onKeyDown={bloquearTeclasNumero}
                          value={limite.creditDays} onChange={(e) => setLimite({ ...limite, creditDays: e.target.value })}
                          className={`${inputCls} w-20`} />
                        <span className="text-sm text-gray-600">días</span>
                        <button
                          onClick={async () => { if (await guardarLimite(limite)) setEditandoLimite(false); }}
                          className="press ml-auto bg-[#B47C4D] hover:bg-[#9C6026] text-white text-sm px-4 py-1.5 rounded-full">
                          Guardar
                        </button>
                        <button onClick={() => setEditandoLimite(false)} className="text-sm text-gray-500 px-2">Cancelar</button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm text-gray-600">
                          Límite: <b>{cuenta.supplier.creditLimit > 0 ? dinero(cuenta.supplier.creditLimit) : 'sin configurar'}</b>
                          {cuenta.supplier.creditDays > 0 && ` · plazo ${cuenta.supplier.creditDays} días`}
                        </span>
                        <button onClick={abrirLimite}
                          className="press flex items-center gap-1.5 text-sm text-[#B47C4D] hover:underline">
                          <Settings2 size={14} /> Cambiar
                        </button>
                      </>
                    )}
                  </div>

                  {/* Registrar compra o pago */}
                  <form onSubmit={onRegistrar} className="bg-white rounded-xl border border-gray-100 p-4 mb-5">
                    <div className="flex gap-2 mb-3">
                      {[
                        { v: 'compra', l: 'Compra al crédito' },
                        { v: 'pago', l: 'Pago al proveedor' },
                      ].map((t) => (
                        <button type="button" key={t.v} onClick={() => setForm({ ...form, type: t.v })}
                          className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                            form.type === t.v ? 'bg-[#B47C4D] text-white border-[#B47C4D]' : 'bg-white text-gray-600 border-gray-300'
                          }`}>
                          {t.l}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2 items-end">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Monto</label>
                        <input type="number" min="0.01" step="0.01" onKeyDown={bloquearTeclasNumero}
                          value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                          className={`${inputCls} w-28`} placeholder="0.00" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Fecha</label>
                        <input type="date" value={form.date}
                          onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputCls} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          {form.type === 'compra' ? 'N.º factura' : 'N.º recibo'}
                        </label>
                        <input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })}
                          className={`${inputCls} w-32`} placeholder="F-001" />
                      </div>
                      <button type="submit" disabled={guardando}
                        className="press ml-auto bg-[#B47C4D] hover:bg-[#9C6026] text-white text-sm font-medium px-6 py-2 rounded-full disabled:opacity-60">
                        {guardando ? 'Guardando…' : 'Registrar'}
                      </button>
                    </div>
                    {form.type === 'compra' && cuenta.supplier.creditDays > 0 && (
                      <p className="text-xs text-gray-400 mt-2">
                        Vencerá a los {cuenta.supplier.creditDays} días de la fecha, según el plazo del proveedor.
                      </p>
                    )}
                  </form>

                  {/* Facturas pendientes */}
                  <h3 className="text-sm font-bold text-gray-700 mb-2">Facturas pendientes</h3>
                  {cuenta.pendientes.length === 0 ? (
                    <p className="text-sm text-gray-400 mb-5">No debe nada a este proveedor.</p>
                  ) : (
                    <div className="space-y-2 mb-5">
                      {cuenta.pendientes.map((p) => (
                        <div key={p._id}
                          className={`flex items-center justify-between p-3 rounded-xl border ${
                            p.vencida ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'
                          }`}>
                          <div>
                            <div className="text-sm font-medium text-gray-800">{p.reference || 'Sin número'}</div>
                            <div className="text-xs text-gray-500">
                              {p.dueDate
                                ? (p.vencida
                                    ? `Venció hace ${-p.diasParaVencer} día${-p.diasParaVencer > 1 ? 's' : ''}`
                                    : `Vence en ${p.diasParaVencer} día${p.diasParaVencer > 1 ? 's' : ''} (${fecha(p.dueDate)})`)
                                : 'Sin fecha de vencimiento'}
                              {p.pagado > 0 && ` · abonado ${dinero(p.pagado)}`}
                            </div>
                          </div>
                          <div className={`font-bold ${p.vencida ? 'text-red-600' : 'text-gray-800'}`}>
                            {dinero(p.pendiente)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Historial */}
                  <h3 className="text-sm font-bold text-gray-700 mb-2">Movimientos</h3>
                  <div className="space-y-1">
                    {cuenta.movimientos.length === 0 ? (
                      <p className="text-sm text-gray-400">Todavía no hay movimientos registrados.</p>
                    ) : (
                      cuenta.movimientos.map((m) => (
                        <div key={m._id} className="flex items-center gap-3 text-sm py-2 border-b border-gray-100 last:border-0">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            m.type === 'compra' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'
                          }`}>
                            {m.type === 'compra' ? 'Compra' : 'Pago'}
                          </span>
                          <span className="text-gray-500 text-xs">{fecha(m.date)}</span>
                          <span className="text-gray-600 text-xs flex-1 truncate">{m.reference || m.note || ''}</span>
                          <span className={`font-bold ${m.type === 'compra' ? 'text-gray-800' : 'text-green-600'}`}>
                            {m.type === 'compra' ? '' : '−'}{dinero(m.amount)}
                          </span>
                          <button onClick={() => borrarMovimiento(m._id)} title="Eliminar movimiento"
                            className="text-gray-300 hover:text-red-500 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CuentaProveedorModal;
