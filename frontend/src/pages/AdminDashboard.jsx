import { Filter, Download } from 'lucide-react';
import StatCard from '../components/UI/StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

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
  return (
    <div className="flex flex-col gap-6 w-full pb-8">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-extrabold text-[#C28C5D]">Dashboard</h1>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 text-sm font-medium shadow-sm transition-colors">
            <Filter className="w-4 h-4" /> Filtros
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 text-sm font-medium shadow-sm transition-colors">
            <Download className="w-4 h-4" /> Descargar
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
            <button className="text-xs text-gray-500 border border-gray-200 px-3 py-1 rounded-md">Semanalmente</button>
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
            <button className="text-xs text-[#0066FF] font-medium">Ver todo</button>
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
            <button className="text-xs text-[#0066FF] font-medium">Ver todo</button>
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

    </div>
  );
};

export default AdminDashboard;
