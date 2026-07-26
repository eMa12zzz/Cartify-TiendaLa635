import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, X, AlertTriangle, Clock, ClipboardList, Printer, Star, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import StatCard from '../components/UI/StatCard';
import { useDashboard } from '../hooks/useDashboard';
import { useTheme } from '../context/ThemeContext';
import { modalTransition, overlayTransition, modalInitial, modalAnimate } from '../utils/motion';

/*
 * AdminDashboard — el resumen operativo de la tienda, con datos REALES.
 * La idea no es lucir números bonitos, sino decir qué hay que hacer hoy:
 * qué reponer, qué caduca, qué preparar y qué ya no se vende.
 * Toda la carga vive en useDashboard; aquí solo pintamos.
 */

const PERIODOS = [
  { id: 'semana', label: 'Semana' },
  { id: 'mes', label: 'Mes' },
  { id: 'anio', label: 'Año' },
];

const fechaLarga = () =>
  new Date().toLocaleDateString('es-SV', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();

const money = (n) => `$${Number(n || 0).toFixed(2)}`;

/*
 * Formato corto para el eje de la gráfica: con montos reales de una tienda de
 * barrio ($152) se ve el número tal cual; si algún día crece a miles, se abrevia
 * ($1.2k) para que el eje no se amontone.
 */
const ejeMoneda = (v) => {
  const n = Number(v) || 0;
  if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n % 1 === 0 ? n : n.toFixed(0)}`;
};

// Muestra la variación con su flechita y color (verde sube, rojo baja).
const Variacion = ({ valor, sufijo = 'vs ayer', esDinero = false }) => {
  const sube = valor >= 0;
  const texto = esDinero ? `${sube ? '+' : '-'}$${Math.abs(valor).toFixed(2)}` : `${sube ? '▲' : '▼'} ${Math.abs(valor)}%`;
  return (
    <span className={`text-xs font-bold ${sube ? 'text-green-500' : 'text-red-500'}`}>
      {texto} <span className="text-gray-500 font-medium">{sufijo}</span>
    </span>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { data, grafica, loading, loadingGrafica, periodo, setPeriodo } = useDashboard();
  const { palette } = useTheme();
  const c = palette.colors; // las barras y acentos siguen la paleta activa
  const [modal, setModal] = useState(null); // 'reponer' | 'caducar' | 'pdf'
  const [pdfTimeFilter, setPdfTimeFilter] = useState('Mensual');

  // ── Reporte PDF con los datos reales que están en pantalla ──
  const handleDownloadPDF = () => {
    if (!data) return;
    const doc = new jsPDF();
    const brown = [180, 124, 77];
    const brownDark = [156, 96, 38];
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(...brownDark);
    doc.rect(0, 0, pageWidth, 38, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('Tienda', 14, 14);
    doc.setFontSize(26);
    doc.setFont(undefined, 'bold');
    doc.text('la 635', 14, 28);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Reporte: ${pdfTimeFilter}`, pageWidth - 14, 16, { align: 'right' });
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-SV')}`, pageWidth - 14, 24, { align: 'right' });

    const tabla = (titulo, y, head, body, color = brown) => {
      doc.setTextColor(...brownDark);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(titulo, 14, y);
      autoTable(doc, {
        startY: y + 5,
        head: [head],
        body,
        theme: 'grid',
        headStyles: { fillColor: color, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
        bodyStyles: { fontSize: 10 },
        alternateRowStyles: { fillColor: [250, 245, 240] },
        styles: { cellPadding: 4 },
      });
      return doc.lastAutoTable.finalY + 12;
    };

    let y = tabla('Resumen General', 50, ['Métrica', 'Valor'], [
      ['Pedidos de hoy', String(data.pedidosHoy.valor)],
      ['Entregados (7 días)', String(data.entregados.valor)],
      ['Ganancia del día', money(data.ganancia.valor)],
      ['Ticket promedio', money(data.ticketPromedio)],
      ['Productos por reponer', String(data.porReponer.total)],
      ['Lotes por caducar', String(data.porCaducar.total)],
      ['Pedidos por preparar', String(data.pedidosPorPreparar)],
      ['Clientes nuevos (7 días)', String(data.clientesNuevos)],
      ['Puntos canjeados (30 días)', String(data.puntosCanjeados)],
    ]);

    y = tabla('Productos Más Vendidos', y, ['#', 'Producto', 'Vendidos', 'En bodega', 'Precio'],
      data.masVendidos.map((p, i) => [i + 1, p.nombre || '—', p.vendidos, p.stock ?? '—', money(p.precio)]), brownDark);

    if (y > 220) { doc.addPage(); y = 20; }
    y = tabla('Ventas y Compras', y, ['Periodo', 'Ventas ($)', 'Compras ($)', 'Diferencia ($)'],
      grafica.map((d) => [d.etiqueta, d.ventas.toFixed(2), d.compras.toFixed(2), (d.ventas - d.compras).toFixed(2)]));

    if (data.porReponer.lista.length) {
      if (y > 220) { doc.addPage(); y = 20; }
      y = tabla('Productos por Reponer', y, ['Producto', 'Stock'],
        data.porReponer.lista.map((p) => [p.name, p.stock]), brownDark);
    }

    doc.save(`reporte-la635-${new Date().toISOString().slice(0, 10)}.pdf`);
    setModal(null);
  };

  if (loading || !data) {
    return <p className="text-gray-500">Cargando el resumen de la tienda…</p>;
  }

  const alertas = [
    {
      icon: AlertTriangle, color: '#d97706', bg: 'rgba(217,119,6,.12)',
      titulo: `${data.porReponer.total} productos por reponer`,
      sub: data.porReponer.lista.slice(0, 2).map((p) => p.name).join(', ') || 'Todo con stock suficiente',
      accion: data.porReponer.total > 0 ? () => setModal('reponer') : null,
    },
    {
      icon: Clock, color: '#6b7280', bg: 'rgba(107,114,128,.12)',
      titulo: `${data.porCaducar.total} lotes caducan esta semana`,
      sub: 'Revisar antes de que se pierdan',
      accion: data.porCaducar.total > 0 ? () => setModal('caducar') : null,
    },
    {
      icon: ClipboardList, color: '#16a34a', bg: 'rgba(22,163,74,.12)',
      titulo: `${data.pedidosPorPreparar} pedidos por preparar`,
      sub: 'Ir a la pantalla de pedidos',
      accion: () => navigate('/pedidos'),
    },
    {
      icon: Printer, color: '#2563eb', bg: 'rgba(37,99,235,.12)',
      titulo: `${data.impresionesPendientes} impresiones pendientes`,
      sub: 'Trabajos de impresión sin entregar',
      accion: () => navigate('/pedidos'),
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full pb-8">
      {/* ── Encabezado ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-wider text-[#C28C5D]">{fechaLarga()}</p>
          <h1 className="text-4xl font-extrabold text-[#C28C5D]">Resumen de hoy</h1>
        </div>
        <button
          onClick={() => setModal('pdf')}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          <Download className="w-4 h-4" /> Descargar PDF
        </button>
      </div>

      {/* ── Tarjetas principales ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Pedidos de hoy" value={data.pedidosHoy.valor}
          extra={<Variacion valor={data.pedidosHoy.variacion} />} />
        <StatCard title="Entregados (7 días)" value={data.entregados.valor}
          extra={<Variacion valor={data.entregados.variacion} sufijo="vs semana pasada" />} />
        <StatCard title="Ganancia del día" value={money(data.ganancia.valor)}
          extra={<Variacion valor={data.ganancia.delta} esDinero />} />
        <StatCard title="Por reponer" value={data.porReponer.total}
          extra={
            data.porReponer.total > 0
              ? <button onClick={() => setModal('reponer')} className="text-xs font-bold text-[#B47C4D] hover:underline">Ver la lista →</button>
              : <span className="text-xs text-gray-500">Todo surtido</span>
          } />
      </div>

      {/* ── Segunda fila: métricas de apoyo ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Ticket promedio', valor: money(data.ticketPromedio), icon: null },
          { label: 'Clientes nuevos', valor: data.clientesNuevos, icon: Users },
          { label: 'Puntos canjeados', valor: data.puntosCanjeados, icon: Star },
          { label: 'Descuento por puntos', valor: money(data.descuentoPorPuntos), icon: null },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-1">
                {Icon && <Icon className="w-3.5 h-3.5" />} {m.label}
              </div>
              <div className="text-2xl font-extrabold text-gray-900">{m.valor}</div>
            </div>
          );
        })}
      </div>

      {/* ── Gráfica + alertas ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <h3 className="text-xl font-bold text-gray-800">Ventas y compras</h3>
            <div className="flex gap-1">
              {PERIODOS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPeriodo(p.id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border ${periodo === p.id ? 'bg-[#B47C4D] text-white border-[#B47C4D]' : 'bg-white text-gray-600 border-gray-300'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Solo esta caja se actualiza al cambiar el periodo */}
          {loadingGrafica ? (
            <p className="text-sm text-gray-500 py-24 text-center">Actualizando…</p>
          ) : grafica.length === 0 ? (
            <p className="text-sm text-gray-500 py-24 text-center">Todavía no hay ventas ni compras en este periodo.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={grafica} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="etiqueta" tick={{ fontSize: 12, fill: c.textSecondary }} />
                <YAxis tick={{ fontSize: 12, fill: c.textSecondary }} tickFormatter={ejeMoneda} width={60} />
                <RechartsTooltip
                  cursor={{ fill: 'transparent' }}
                  formatter={(v) => money(v)}
                  contentStyle={{ backgroundColor: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: 12, color: c.textPrimary }}
                />
                <Legend />
                {/* Colores tomados de la paleta activa, no fijos */}
                <Bar dataKey="ventas" name="Ventas" fill={c.primary} radius={[4, 4, 0, 0]} barSize={14} />
                <Bar dataKey="compras" name="Compras" fill={c.textMuted} radius={[4, 4, 0, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Requiere tu atención */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Requiere tu atención</h3>
          <div className="flex flex-col gap-3">
            {alertas.map((a) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.titulo}
                  onClick={a.accion || undefined}
                  disabled={!a.accion}
                  className="flex items-start gap-3 p-3 rounded-xl text-left disabled:cursor-default"
                  style={{ backgroundColor: a.bg }}
                >
                  <Icon className="w-5 h-5 flex-none mt-0.5" style={{ color: a.color }} />
                  <div>
                    <div className="text-sm font-bold text-gray-800">{a.titulo}</div>
                    <div className="text-xs text-gray-600">{a.sub}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Productos más vendidos ── */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">Productos más vendidos</h3>
          <button onClick={() => navigate('/inventario')} className="text-sm font-medium text-[#B47C4D] hover:underline">Ver todo</button>
        </div>
        {data.masVendidos.length === 0 ? (
          <p className="text-sm text-gray-500">Aún no hay ventas registradas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Producto', 'Categoría', 'Vendidos', 'En bodega', 'Precio', 'Estado'].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.masVendidos.map((p) => {
                  // "Bajo" según SU propio máximo, no un número fijo para todos.
                  const stockNum = Number(p.stock) || 0;
                  const maxNum = Number(p.maxQuantity) || 0;
                  const bajo = maxNum > 0
                    ? stockNum <= maxNum * data.umbrales.ratioBajo
                    : stockNum <= data.umbrales.stockBajoAbs;
                  return (
                    <tr key={p._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4 text-sm font-medium text-gray-800">{p.nombre || '—'}</td>
                      <td className="py-4 px-4 text-sm text-gray-600">{p.categoria || '—'}</td>
                      <td className="py-4 px-4 text-sm text-gray-600">{p.vendidos}</td>
                      <td className="py-4 px-4 text-sm text-gray-600">{p.stock ?? '—'}</td>
                      <td className="py-4 px-4 text-sm text-gray-600">{money(p.precio)}</td>
                      <td className="py-4 px-4 text-sm">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${bajo ? 'text-red-500' : 'text-green-500'}`}
                              style={{ backgroundColor: bajo ? 'rgba(239,68,68,.1)' : 'rgba(34,197,94,.1)' }}>
                          {bajo ? `Quedan ${p.stock ?? 0}` : 'En stock'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Ventas por módulo + sin movimiento ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-1">Ventas por módulo</h3>
          <p className="text-xs text-gray-500 mb-4">Cuál área de la tienda está rindiendo</p>
          {data.ventasPorModulo.length === 0 ? (
            <p className="text-sm text-gray-500">Sin ventas todavía.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {data.ventasPorModulo.map((m) => {
                const mayor = data.ventasPorModulo[0].total || 1;
                return (
                  <div key={m.modulo}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-800">{m.modulo}</span>
                      <span className="text-gray-600">{money(m.total)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full bg-[#B47C4D]" style={{ width: `${(m.total / mayor) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-1">Sin movimiento</h3>
          <p className="text-xs text-gray-500 mb-4">Nadie los ha comprado — evalúa dejar de surtirlos</p>
          {data.sinMovimiento.length === 0 ? (
            <p className="text-sm text-gray-500">Todos los productos han tenido ventas. 🎉</p>
          ) : (
            <div className="flex flex-col gap-2">
              {data.sinMovimiento.map((p) => (
                <div key={p._id} className="flex justify-between text-sm">
                  <span className="text-gray-800">{p.name}</span>
                  <span className="text-gray-500">{p.stock} en bodega · {money(p.salePrice)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Modales (misma entrada suave que el resto de la app) ── */}
      <AnimatePresence>
      {(modal === 'reponer' || modal === 'caducar') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={overlayTransition} className="absolute inset-0 bg-black/40" onClick={() => setModal(null)} />
          <motion.div
            initial={modalInitial} animate={modalAnimate} exit={modalInitial} transition={modalTransition}
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg relative z-10 max-h-[80vh] flex flex-col"
          >
            <div className="bg-[#9C6026] text-white p-5 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {modal === 'reponer' ? 'Productos por reponer' : 'Lotes que caducan pronto'}
              </h2>
              <button onClick={() => setModal(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 overflow-y-auto">
              {(modal === 'reponer' ? data.porReponer.lista : data.porCaducar.lista).map((p) => (
                <div key={p._id} className="flex justify-between py-2 border-b border-gray-100 text-sm">
                  <span className="text-gray-800">{p.name}</span>
                  <span className="text-gray-500">
                    {modal === 'reponer'
                      ? `${p.stock}${p.maxQuantity ? ` de ${p.maxQuantity}` : ''} en bodega`
                      : new Date(p.expirationDate).toLocaleDateString('es-SV')}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {modal === 'pdf' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={overlayTransition} className="absolute inset-0 bg-black/40" onClick={() => setModal(null)} />
          <motion.div
            initial={modalInitial} animate={modalAnimate} exit={modalInitial} transition={modalTransition}
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm relative z-10 overflow-hidden"
          >
            <div className="bg-[#9C6026] text-white p-5">
              <h2 className="text-xl font-bold text-center">Descargar reporte</h2>
            </div>
            <div className="p-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">Título del periodo</label>
              <select
                value={pdfTimeFilter}
                onChange={(e) => setPdfTimeFilter(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-full px-4 py-2 text-sm mb-5 focus:outline-none focus:border-[#9C6026]"
              >
                <option>Diario</option>
                <option>Semanal</option>
                <option>Mensual</option>
                <option>Anual</option>
              </select>
              <div className="flex justify-end gap-3">
                <button onClick={() => setModal(null)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium px-6 py-2 rounded-full">Cancelar</button>
                <button onClick={handleDownloadPDF} className="bg-[#B47C4D] hover:bg-[#9C6026] text-white font-medium px-6 py-2 rounded-full">Descargar</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
