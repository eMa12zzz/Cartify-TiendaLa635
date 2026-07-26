import { useState } from 'react';
import { Search, Package, CheckCircle2, ChefHat, Printer, Eye, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EASE_OUT, DUR, stagger } from '../utils/motion';
import { useOrders } from '../hooks/useOrders';

/*
 * Orders (Admin/Empleado) — pantalla de PREPARACIÓN de pedidos.
 * El empleado ve los pedidos pagados, la lista de productos a juntar, y avanza
 * el estado: pagado → preparando → entregado. Datos reales (modelo Order).
 * La lógica vive en useOrders; aquí solo pintamos.
 */

// Etiqueta + color por estado (los colores están protegidos en index.css).
const estadoInfo = {
  pagado:     { label: 'Pagado',     clase: 'text-blue-500' },
  preparando: { label: 'Preparando', clase: 'text-orange-500' },
  entregado:  { label: 'Entregado',  clase: 'text-green-500' },
  cancelado:  { label: 'Cancelado',  clase: 'text-red-500' },
};

const filtros = [
  { id: 'pagado',     label: 'Por preparar' },
  { id: 'preparando', label: 'En preparación' },
  { id: 'entregado',  label: 'Entregados' },
  { id: 'todos',      label: 'Todos' },
];

const formatFecha = (iso) =>
  iso ? new Date(iso).toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

// Abre el archivo listo para imprimir. Si es imagen, abre una ventana con la
// imagen y lanza el diálogo de impresión; si es PDF, el visor del navegador
// ya trae su propio botón de imprimir.
const imprimirArchivo = (url) => {
  const esPdf = /\.pdf(\?|$)/i.test(url);
  if (esPdf) { window.open(url, '_blank', 'noopener'); return; }
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(
    `<html><head><title>Imprimir</title></head><body style="margin:0;display:flex;align-items:center;justify-content:center">` +
    `<img src="${url}" style="max-width:100%" onload="window.focus();window.print();" /></body></html>`
  );
  win.document.close();
};

// Fuerza la descarga en Cloudinary (fl_attachment) en vez de abrirlo.
const urlDescarga = (url) => (url.includes('/upload/') ? url.replace('/upload/', '/upload/fl_attachment/') : url);

const Orders = () => {
  const { orders, loading, cambiarEstado } = useOrders();
  const [filtro, setFiltro] = useState('pagado');
  const [busqueda, setBusqueda] = useState('');

  // Conteos reales para las tarjetas de resumen.
  const counts = {
    total: orders.length,
    pagado: orders.filter((o) => o.status === 'pagado').length,
    preparando: orders.filter((o) => o.status === 'preparando').length,
    entregado: orders.filter((o) => o.status === 'entregado').length,
  };

  const visibles = orders.filter((o) => {
    const nombre = (o.clientId?.fullName || '').toLowerCase();
    const coincide = nombre.includes(busqueda.toLowerCase());
    if (filtro === 'todos') return coincide;
    return coincide && o.status === filtro;
  });

  return (
    <div className="flex flex-col gap-6 w-full pb-8">
      <h1 className="text-4xl font-extrabold text-[#C28C5D] mb-2">Pedidos</h1>

      {/* Resumen real */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div><h4 className="text-sm font-bold text-blue-500 mb-1">Por preparar</h4><p className="text-3xl font-extrabold text-gray-800">{counts.pagado}</p></div>
          <div><h4 className="text-sm font-bold text-orange-500 mb-1">En preparación</h4><p className="text-3xl font-extrabold text-gray-800">{counts.preparando}</p></div>
          <div><h4 className="text-sm font-bold text-green-500 mb-1">Entregados</h4><p className="text-3xl font-extrabold text-gray-800">{counts.entregado}</p></div>
          <div><h4 className="text-sm font-bold text-gray-500 mb-1">Total</h4><p className="text-3xl font-extrabold text-gray-800">{counts.total}</p></div>
        </div>
      </div>

      {/* Filtros + búsqueda */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {filtros.map((f) => {
            const activo = filtro === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFiltro(f.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${activo ? 'bg-[#B47C4D] text-white border-[#B47C4D]' : 'bg-white text-gray-600 border-gray-300'}`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por cliente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-full text-sm outline-none focus:border-[#B47C4D] w-56 shadow-sm"
          />
        </div>
      </div>

      {/* Lista de pedidos */}
      {loading ? (
        <p className="text-sm text-gray-500">Cargando pedidos…</p>
      ) : visibles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="w-10 h-10 mb-3 text-gray-400" />
          <p className="text-sm font-semibold text-gray-800 mb-1">No hay pedidos en esta vista</p>
          <p className="text-sm text-gray-500">Cuando entren pedidos pagados, aparecerán aquí para prepararlos.</p>
        </div>
      ) : (
        // `layout` hace que las tarjetas se reacomoden con suavidad cuando una
        // cambia de estado y sale del filtro — antes la lista pegaba un brinco.
        <motion.div layout className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
          {visibles.map((order, i) => {
            const estado = estadoInfo[order.status] || estadoInfo.pagado;
            return (
              <motion.div
                key={order._id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: DUR.modal, ease: EASE_OUT, delay: stagger(i) }}
                className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                {/* Encabezado: cliente + estado */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-sm font-bold text-gray-800">
                      {order.clientId?.fullName || 'Cliente'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {order.clientId?.phoneNumber || 's/tel'} · #{String(order._id).slice(-6).toUpperCase()} · {formatFecha(order.createdAt)}
                    </div>
                  </div>
                  <span className={`text-xs font-bold ${estado.clase}`}>{estado.label}</span>
                </div>

                {/* Impresión (con archivo) o productos a preparar */}
                {order.channel === 'impresion' && order.printJob ? (
                  <div className="rounded-xl bg-gray-50 p-3 mb-3 text-sm">
                    <div className="flex items-center gap-2 mb-1 font-medium text-gray-800">
                      <Printer className="w-4 h-4 text-[#B47C4D]" /> Impresión — {order.printJob.serviceName}
                    </div>
                    <div className="text-gray-600 text-xs">
                      {order.printJob.copies} copia(s) · {order.printJob.pages > 1 ? `${order.printJob.pages} págs · ` : ''}
                      {order.printJob.color ? 'Color' : 'B/N'} · {order.printJob.doubleSided ? 'Doble cara' : 'Una cara'} · {order.printJob.paper || 'Normal'}
                    </div>

                    {/* Botones para trabajar el archivo */}
                    {order.printJob.fileUrl && (
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <button
                          onClick={() => imprimirArchivo(order.printJob.fileUrl)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#B47C4D] text-white transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" /> Imprimir
                        </button>
                        <a
                          href={order.printJob.fileUrl} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> Ver archivo
                        </a>
                        <a
                          href={urlDescarga(order.printJob.fileUrl)} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" /> Descargar
                        </a>
                        <span className="text-xs ml-1" style={{ color: order.printJob.emailedToPrinter ? '#16a34a' : '#d97706' }}>
                          {order.printJob.emailedToPrinter ? '✓ Ya enviado a impresora' : 'Pendiente de imprimir'}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl bg-gray-50 p-3 mb-3">
                    {order.items?.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm py-0.5">
                        <span className="text-gray-800 font-medium">{item.amount}× {item.name || item.productId?.name || 'Producto'}</span>
                        <span className="text-gray-500">${(item.price * item.amount).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pie: total + acción */}
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-gray-800">Total: ${Number(order.total).toFixed(2)}</span>

                  {order.status === 'pagado' && (
                    <button
                      onClick={() => cambiarEstado(order._id, 'preparando')}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold bg-[#B47C4D] text-white transition-colors"
                    >
                      <ChefHat className="w-4 h-4" /> Empezar a preparar
                    </button>
                  )}
                  {order.status === 'preparando' && (
                    <button
                      onClick={() => cambiarEstado(order._id, 'entregado')}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold bg-green-500 text-white transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Marcar entregado
                    </button>
                  )}
                  {order.status === 'entregado' && (
                    <span className="flex items-center gap-1 text-sm font-semibold text-green-500">
                      <CheckCircle2 className="w-4 h-4" /> Entregado
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default Orders;
