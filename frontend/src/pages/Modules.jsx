import { Filter } from 'lucide-react';
import DataTable from '../components/UI/DataTable';

const mockModules = [
  { id: 1, name: 'Maggi', description: 'Richard Martin, Richard Martin, Richard Martin, Richard Martin,', status: 'Activo' },
  { id: 2, name: 'Bru', description: 'Richard Martin, Richard Martin, Richard Martin, Richard Martin,', status: 'Inactivo' },
  { id: 3, name: 'Red Bull', description: 'Richard Martin, Richard Martin, Richard Martin, Richard Martin,', status: 'Activo' },
  { id: 4, name: 'Bourn Vita', description: 'Richard Martin, Richard Martin, Richard Martin, Richard Martin,', status: 'Inactivo' },
  { id: 5, name: 'Horlicks', description: 'Richard Martin, Richard Martin, Richard Martin, Richard Martin,', status: 'Activo' },
  { id: 6, name: 'Harpic', description: 'Richard Martin, Richard Martin, Richard Martin, Richard Martin,', status: 'Inactivo' },
  { id: 7, name: 'Ariel', description: 'Richard Martin, Richard Martin, Richard Martin, Richard Martin,', status: 'Activo' },
  { id: 8, name: 'Scotch Brite', description: 'Richard Martin, Richard Martin, Richard Martin, Richard Martin,', status: 'Inactivo' },
  { id: 9, name: 'Coca cola', description: 'Richard Martin, Richard Martin, Richard Martin, Richard Martin,', status: 'Activo' },
];

const Modules = () => {
  const columns = ['Nombre', 'descripción', 'Estado'];

  return (
    <div className="flex flex-col gap-6 w-full pb-8">
      <h1 className="text-4xl font-extrabold text-[#C28C5D] mb-6">Módulos</h1>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">Módulos</h3>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-[#B47C4D] hover:bg-[#9C6026] text-white rounded-md text-sm font-medium transition-colors">
              Agregar Módulos
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors">
              <Filter className="w-4 h-4" /> Filtros
            </button>
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors">
              Historial de pedidos
            </button>
          </div>
        </div>

        <DataTable 
          columns={columns}
          data={mockModules}
          renderRow={(item) => (
            <>
              <td className="py-4 px-4 text-sm text-gray-800">{item.name}</td>
              <td className="py-4 px-4 text-sm text-gray-600">{item.description}</td>
              <td className={`py-4 px-4 text-sm font-medium ${item.status === 'Activo' ? 'text-green-500' : 'text-red-500'}`}>
                {item.status}
              </td>
            </>
          )}
        />
      </div>
    </div>
  );
};

export default Modules;
