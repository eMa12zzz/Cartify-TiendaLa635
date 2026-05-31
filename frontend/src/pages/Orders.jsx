import { Filter } from 'lucide-react';
import DataTable from '../components/UI/DataTable';

const mockOrders = [
  { id: 1, clienteId: 'Maggi', phone: '5555-5555', type: 'Recoger', dirId: '43 Street', device: '7535', date: '11/12/22', sub: '$4.00', total: '$4.00', status: 'En proceso' },
  { id: 2, clienteId: 'Bru', phone: '5555-5555', type: 'Entrega', dirId: '43 Street', device: '5724', date: '21/12/22', sub: '$4.00', total: '$4.00', status: 'Entregado' },
  { id: 3, clienteId: 'Red Bull', phone: '5555-5555', type: 'Recoger', dirId: '43 Street', device: '2775', date: '5/12/22', sub: '$4.00', total: '$4.00', status: 'Cancelado' },
  { id: 4, clienteId: 'Bourn Vita', phone: '5555-5555', type: 'Entrega', dirId: '43 Street', device: '2275', date: '8/12/22', sub: '$4.00', total: '$4.00', status: 'Entregado' },
  { id: 5, clienteId: 'Horlicks', phone: '5555-5555', type: 'Recoger', dirId: '43 Street', device: '2427', date: '9/1/23', sub: '$4.00', total: '$4.00', status: 'Cancelado' },
  { id: 6, clienteId: 'Harpic', phone: '5555-5555', type: 'Entrega', dirId: '43 Street', device: '2578', date: '9/1/23', sub: '$4.00', total: '$4.00', status: 'Entregado' },
  { id: 7, clienteId: 'Ariel', phone: '5555-5555', type: 'Recoger', dirId: '43 Street', device: '2757', date: '15/12/23', sub: '$4.00', total: '$4.00', status: 'En proceso' },
];

const getStatusColor = (status) => {
  switch(status) {
    case 'En proceso': return 'text-orange-500';
    case 'Entregado': return 'text-green-500';
    case 'Cancelado': return 'text-red-500';
    default: return 'text-gray-500';
  }
};

const Orders = () => {
  const columns = ['ClienteId', 'Número de Teléfono', 'Tipo', 'DirecciónID', 'Dispositivo', 'Fecha', 'SubTotal', 'Total', 'Estado'];

  return (
    <div className="flex flex-col gap-6 w-full pb-8">
      <h1 className="text-4xl font-extrabold text-[#C28C5D] mb-2">Pedidos</h1>

      {/* Summary Cards */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-2">
        <h3 className="text-lg font-bold text-gray-800 mb-6">Pedidos totales</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 divide-x divide-gray-100">
          
          <div className="px-4">
            <h4 className="text-sm font-bold text-blue-500 mb-2">Pedidos totales</h4>
            <p className="text-3xl font-extrabold text-gray-800 mb-1">37</p>
            <p className="text-xs text-gray-500">Últimos 7 días</p>
          </div>
          
          <div className="px-6 flex justify-between">
            <div>
              <h4 className="text-sm font-bold text-orange-500 mb-2">Total recibidos</h4>
              <p className="text-3xl font-extrabold text-gray-800 mb-1">32</p>
              <p className="text-xs text-gray-500">Últimos 7 días</p>
            </div>
            <div className="text-right flex flex-col justify-end">
              <p className="text-xl font-bold text-gray-800 mb-1">$2356</p>
              <p className="text-xs text-gray-500">Ganancia</p>
            </div>
          </div>
          
          <div className="px-6 flex justify-between">
            <div>
              <h4 className="text-sm font-bold text-purple-500 mb-2">Total devuelto</h4>
              <p className="text-3xl font-extrabold text-gray-800 mb-1">5</p>
              <p className="text-xs text-gray-500">Últimos 7 días</p>
            </div>
            <div className="text-right flex flex-col justify-end">
              <p className="text-xl font-bold text-gray-800 mb-1">$2356</p>
              <p className="text-xs text-gray-500">Costo</p>
            </div>
          </div>
          
          <div className="px-6 flex justify-between">
            <div>
              <h4 className="text-sm font-bold text-red-500 mb-2">En camino</h4>
              <p className="text-3xl font-extrabold text-gray-800 mb-1">12</p>
              <p className="text-xs text-gray-500">Ordenado</p>
            </div>
            <div className="text-right flex flex-col justify-end">
              <p className="text-xl font-bold text-gray-800 mb-1">$2356</p>
              <p className="text-xs text-gray-500">Costo</p>
            </div>
          </div>
          
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-800">Pedidos</h3>
          <button className="flex items-center gap-2 px-4 py-1.5 bg-white border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors">
            <Filter className="w-4 h-4" /> Filtros
          </button>
        </div>
        
        <DataTable 
          columns={columns}
          data={mockOrders}
          renderRow={(item) => (
            <>
              <td className="py-4 px-4 text-sm text-gray-800">{item.clienteId}</td>
              <td className="py-4 px-4 text-sm text-gray-600">{item.phone}</td>
              <td className="py-4 px-4 text-sm text-gray-600">{item.type}</td>
              <td className="py-4 px-4 text-sm text-gray-600">{item.dirId}</td>
              <td className="py-4 px-4 text-sm text-gray-600">{item.device}</td>
              <td className="py-4 px-4 text-sm text-gray-600">{item.date}</td>
              <td className="py-4 px-4 text-sm text-gray-800 font-medium">{item.sub}</td>
              <td className="py-4 px-4 text-sm text-gray-800 font-medium">{item.total}</td>
              <td className={`py-4 px-4 text-sm font-medium ${getStatusColor(item.status)}`}>{item.status}</td>
            </>
          )}
        />
      </div>

    </div>
  );
};

export default Orders;
