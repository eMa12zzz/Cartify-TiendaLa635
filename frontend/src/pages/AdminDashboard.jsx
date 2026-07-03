import { useState } from 'react';
import { Filter, Download, X } from 'lucide-react';
import StatCard from '../components/UI/StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const barData = [
  { name: 'Jan', Compras: 55000, Ventas: 49000 },
  { name: 'Feb', Compras: 58000, Ventas: 48000 },
  { name: 'Mar', Compras: 45000, Ventas: 52000 },
  { name: 'Apr', Compras: 37000, Ventas: 43000 },
  { name: 'May', Compras: 43000, Ventas: 46000 },
  { name: 'Jun', Compras: 29000, Ventas: 41000 },
  { name: 'Jul', Compras: 55000, Ventas: 49000 },
  { name: 'Aug', Compras: 45000, Ventas: 42000 },
  { name: 'Sep', Compras: 45000, Ventas: 43000 },
  { name: 'Oct', Compras: 37000, Ventas: 43000 },
];

const lineData = [
  { name: 'Jan', Pedidos: 4000, Entregado: 2500 },
  { name: 'Feb', Pedidos: 2000, Entregado: 3500 },
  { name: 'Mar', Pedidos: 2500, Entregado: 3800 },
  { name: 'Apr', Pedidos: 2500, Entregado: 2800 },
  { name: 'May', Pedidos: 1500, Entregado: 3500 },
  { name: 'Jun', Pedidos: 2300, Entregado: 2200 },
];

const topProducts = [
  { id: 1, name: 'Surf Excel', sold: 30, remaining: 12, price: '$100' },
  { id: 2, name: 'Rin', sold: 21, remaining: 15, price: '$207' },
  { id: 3, name: 'Parle G', sold: 19, remaining: 17, price: '$105' },
];

const lowStockProducts = [
  { id: 1, name: 'Naranjas', remaining: 10, image: 'https://res.cloudinary.com/demo/image/upload/v1615456789/orange.png' },
  { id: 2, name: 'Naranjas', remaining: 10, image: 'https://res.cloudinary.com/demo/image/upload/v1615456789/orange.png' },
  { id: 3, name: 'Naranjas', remaining: 10, image: 'https://res.cloudinary.com/demo/image/upload/v1615456789/orange.png' },
];

const AdminDashboard = () => {
  const [chartTimeFilter, setChartTimeFilter] = useState('Semanalmente');
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [pdfTimeFilter, setPdfTimeFilter] = useState('Mensual');
  
  const [isTopProductsModalOpen, setIsTopProductsModalOpen] = useState(false);
  const [isLowStockModalOpen, setIsLowStockModalOpen] = useState(false);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const brown = [180, 124, 77];       // #B47C4D
    const brownDark = [156, 96, 38];     // #9C6026
    const brownLight = [194, 140, 93];   // #C28C5D
    const pageWidth = doc.internal.pageSize.getWidth();

    // ── Header / Logo ──
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

    // ── Sección: Resumen General ──
    doc.setTextColor(...brownDark);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Resumen General', 14, 50);

    autoTable(doc, {
      startY: 55,
      head: [['Métrica', 'Valor']],
      body: [
        ['Total de Pedidos', '78'],
        ['Pedidos Entregados', '185'],
        ['Total de Ganancias', '$405.00'],
        ['Productos Bajos en Stock', '28'],
      ],
      theme: 'grid',
      headStyles: { fillColor: brown, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
      bodyStyles: { fontSize: 10 },
      alternateRowStyles: { fillColor: [250, 245, 240] },
      styles: { cellPadding: 4 },
    });

    // ── Sección: Productos Más Vendidos ──
    const y1 = doc.lastAutoTable.finalY + 12;
    doc.setTextColor(...brownDark);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Productos Más Vendidos', 14, y1);

    autoTable(doc, {
      startY: y1 + 5,
      head: [['#', 'Producto', 'Vendidos', 'Stock Restante', 'Precio']],
      body: topProducts.map((p, i) => [i + 1, p.name, p.sold, p.remaining, p.price]),
      theme: 'grid',
      headStyles: { fillColor: brownDark, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
      bodyStyles: { fontSize: 10 },
      alternateRowStyles: { fillColor: [250, 245, 240] },
      styles: { cellPadding: 4 },
    });

    // ── Sección: Ventas y Compras por Mes ──
    const y2 = doc.lastAutoTable.finalY + 12;
    doc.setTextColor(...brownDark);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Ventas y Compras por Mes', 14, y2);

    autoTable(doc, {
      startY: y2 + 5,
      head: [['Mes', 'Compras ($)', 'Ventas ($)', 'Diferencia ($)']],
      body: barData.map(d => [d.name, d.Compras.toLocaleString(), d.Ventas.toLocaleString(), (d.Ventas - d.Compras).toLocaleString()]),
      theme: 'grid',
      headStyles: { fillColor: brown, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
      bodyStyles: { fontSize: 10 },
      alternateRowStyles: { fillColor: [250, 245, 240] },
      styles: { cellPadding: 4 },
    });

    // ── Sección: Pedidos vs Entregas ──
    const y3 = doc.lastAutoTable.finalY + 12;

    // Revisar si hay espacio para una tabla más, si no, nueva página
    if (y3 > 240) {
      doc.addPage();
      doc.setTextColor(...brownDark);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Pedidos vs Entregas', 14, 20);

      autoTable(doc, {
        startY: 25,
        head: [['Mes', 'Pedidos', 'Entregados', 'Pendientes']],
        body: lineData.map(d => [d.name, d.Pedidos, d.Entregado, d.Pedidos - d.Entregado]),
        theme: 'grid',
        headStyles: { fillColor: brownDark, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
        bodyStyles: { fontSize: 10 },
        alternateRowStyles: { fillColor: [250, 245, 240] },
        styles: { cellPadding: 4 },
      });
    } else {
      doc.setTextColor(...brownDark);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Pedidos vs Entregas', 14, y3);

      autoTable(doc, {
        startY: y3 + 5,
        head: [['Mes', 'Pedidos', 'Entregados', 'Pendientes']],
        body: lineData.map(d => [d.name, d.Pedidos, d.Entregado, d.Pedidos - d.Entregado]),
        theme: 'grid',
        headStyles: { fillColor: brownDark, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
        bodyStyles: { fontSize: 10 },
        alternateRowStyles: { fillColor: [250, 245, 240] },
        styles: { cellPadding: 4 },
      });
    }

    // ── Sección: Productos con Bajo Stock ──
    const y4 = doc.lastAutoTable.finalY + 12;
    if (y4 > 250) doc.addPage();
    const startY4 = y4 > 250 ? 20 : y4;

    doc.setTextColor(...brownDark);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Productos con Bajo Stock', 14, startY4);

    autoTable(doc, {
      startY: startY4 + 5,
      head: [['#', 'Producto', 'Stock Restante']],
      body: lowStockProducts.map((p, i) => [i + 1, p.name, p.remaining]),
      theme: 'grid',
      headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
      bodyStyles: { fontSize: 10 },
      alternateRowStyles: { fillColor: [254, 242, 242] },
      styles: { cellPadding: 4 },
    });

    // ── Footer ──
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFillColor(...brownDark);
      doc.rect(0, pageHeight - 14, pageWidth, 14, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      doc.text('Tienda la 635 — Reporte Generado Automáticamente', 14, pageHeight - 5);
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - 14, pageHeight - 5, { align: 'right' });
    }

    doc.save(`reporte-dashboard-${pdfTimeFilter.toLowerCase()}.pdf`);
    setIsPDFModalOpen(false);
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-8">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-extrabold text-[#C28C5D]">Dashboard</h1>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsPDFModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#B47C4D] hover:bg-[#9C6026] text-white rounded-full text-sm font-medium shadow-md transition-colors"
          >
            <Download className="w-4 h-4" /> Descargar PDF
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total de pedidos" value="78" />
        <StatCard title="Pedidos entregados" value="185" />
        <StatCard 
          title="Total de ganancias" 
          value="$405" 
          extra={<div className="h-4 w-16 bg-green-100 rounded-full mt-1"></div>} 
        />
        <StatCard 
          title="Productos con pocas cantidades" 
          value="28" 
          extra={<div className="h-4 w-16 bg-red-100 rounded-full mt-1"></div>}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800">Ventas y compras</h3>
            <select 
              value={chartTimeFilter}
              onChange={(e) => setChartTimeFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-md text-xs font-medium outline-none cursor-pointer"
            >
              <option value="Semanalmente">Semanalmente</option>
              <option value="Mensualmente">Mensualmente</option>
              <option value="Anualmente">Anualmente</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <RechartsTooltip cursor={{fill: 'transparent'}} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="Compras" fill="#60A5FA" radius={[4, 4, 0, 0]} barSize={12} />
                <Bar dataKey="Ventas" fill="#D97706" radius={[4, 4, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Line Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Resumen de pedidos</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <RechartsTooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="Pedidos" stroke="#D97706" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Entregado" stroke="#93C5FD" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top Products */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">Productos más vendidos</h3>
            <button onClick={() => setIsTopProductsModalOpen(true)} className="text-xs text-[#0066FF] font-medium hover:underline">Ver todo</button>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-3 text-xs font-medium text-gray-500">Nombre</th>
                <th className="py-3 text-xs font-medium text-gray-500">Cantidad vendida</th>
                <th className="py-3 text-xs font-medium text-gray-500">Cantidad restante</th>
                <th className="py-3 text-xs font-medium text-gray-500">Precio</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map(product => (
                <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-4 text-sm text-gray-800">{product.name}</td>
                  <td className="py-4 text-sm text-gray-600">{product.sold}</td>
                  <td className="py-4 text-sm text-gray-600">{product.remaining}</td>
                  <td className="py-4 text-sm text-gray-800 font-medium">{product.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Low Stock */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">Baja cantidad de productos</h3>
            <button onClick={() => setIsLowStockModalOpen(true)} className="text-xs text-[#0066FF] font-medium hover:underline">Ver todo</button>
          </div>
          <div className="flex flex-col gap-4">
            {lowStockProducts.map((product, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center p-1">
                    <span className="text-xl">🍊</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">{product.name}</h4>
                    <p className="text-xs text-gray-500">Cantidad restante: {product.remaining}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-full">Low</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* PDF Export Modal */}
      {isPDFModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">Descargar PDF</h3>
              <button onClick={() => setIsPDFModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">¿De qué periodo deseas descargar el reporte?</p>
              <select 
                value={pdfTimeFilter}
                onChange={(e) => setPdfTimeFilter(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm font-medium shadow-sm outline-none cursor-pointer focus:border-[#C28C5D] transition-colors mb-6"
              >
                <option value="Semanal">Esta semana</option>
                <option value="Mensual">Este mes</option>
                <option value="Anual">Este año</option>
              </select>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setIsPDFModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleDownloadPDF}
                  className="px-5 py-2 text-sm font-medium text-white bg-[#B47C4D] hover:bg-[#9C6026] rounded-lg shadow-sm transition-colors flex items-center gap-2"
                >
                  <Download size={16} /> Descargar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Products Modal */}
      {isTopProductsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">Todos los productos más vendidos</h3>
              <button onClick={() => setIsTopProductsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="py-3 text-xs font-medium text-gray-500">Nombre</th>
                    <th className="py-3 text-xs font-medium text-gray-500">Cantidad vendida</th>
                    <th className="py-3 text-xs font-medium text-gray-500">Cantidad restante</th>
                    <th className="py-3 text-xs font-medium text-gray-500">Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map(product => (
                    <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-4 text-sm text-gray-800">{product.name}</td>
                      <td className="py-4 text-sm text-gray-600">{product.sold}</td>
                      <td className="py-4 text-sm text-gray-600">{product.remaining}</td>
                      <td className="py-4 text-sm text-gray-800 font-medium">{product.price}</td>
                    </tr>
                  ))}
                  {/* Duplicate just for demonstration in the modal */}
                  {topProducts.map(product => (
                    <tr key={`${product.id}-copy`} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-4 text-sm text-gray-800">{product.name} (Copy)</td>
                      <td className="py-4 text-sm text-gray-600">{product.sold}</td>
                      <td className="py-4 text-sm text-gray-600">{product.remaining}</td>
                      <td className="py-4 text-sm text-gray-800 font-medium">{product.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Low Stock Modal */}
      {isLowStockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">Todos los productos con bajo stock</h3>
              <button onClick={() => setIsLowStockModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="flex flex-col gap-4">
                {[...lowStockProducts, ...lowStockProducts].map((product, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center p-1">
                        <span className="text-xl">🍊</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-800">{product.name} {idx > 2 && '(Copy)'}</h4>
                        <p className="text-xs text-gray-500">Cantidad restante: {product.remaining}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-full">Low</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
