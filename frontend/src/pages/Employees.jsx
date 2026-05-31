import { Filter } from 'lucide-react';
import DataTable from '../components/UI/DataTable';

const mockEmployees = [
  { id: 1, name: 'Richard Martin', phone: '5555-5555', email: 'richard@gmail.com', dui: '012345678-9', username: 'Elpepe', status: 'Activo' },
  { id: 2, name: 'Tom Homan', phone: '5555-5555', email: 'tomhoman@gmail.com', dui: '012345678-9', username: 'Elpepe', status: 'Activo' },
  { id: 3, name: 'Veandir', phone: '5555-5555', email: 'veandier@gmail.com', dui: '012345678-9', username: 'Elpepe', status: 'No activo' },
  { id: 4, name: 'Charin', phone: '5555-5555', email: 'charin@gmail.com', dui: '012345678-9', username: 'Elpepe', status: 'Activo' },
  { id: 5, name: 'Hoffman', phone: '5555-5555', email: 'hoffman@gmail.com', dui: '012345678-9', username: 'Elpepe', status: 'Activo' },
  { id: 6, name: 'Fainden Juke', phone: '5555-5555', email: 'fainden@gmail.com', dui: '012345678-9', username: 'Elpepe', status: 'No activo' },
  { id: 7, name: 'Martin', phone: '5555-5555', email: 'martin@gmail.com', dui: '012345678-9', username: 'Elpepe', status: 'Activo' },
  { id: 8, name: 'Joe Nike', phone: '5555-5555', email: 'joenike@gmail.com', dui: '012345678-9', username: 'Elpepe', status: 'Activo' },
  { id: 9, name: 'Dender Luke', phone: '5555-5555', email: 'dender@gmail.com', dui: '', username: '', status: '' },
  { id: 10, name: 'Martin', phone: '5555-5555', email: 'martin@gmail.com', dui: '012345678-9', username: 'Elpepe', status: 'Activo' },
];

const Employees = () => {
  const columns = ['Nombre', 'Número de Teléfono', 'Correo', 'DUI', 'Nombre de Usuario', 'Estatus'];

  return (
    <div className="flex flex-col gap-6 w-full pb-8">
      <h1 className="text-4xl font-extrabold text-[#C28C5D] mb-6">Empleados</h1>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-end gap-3 mb-6">
          <button className="px-4 py-2 bg-[#B47C4D] hover:bg-[#9C6026] text-white rounded-md text-sm font-medium transition-colors">
            Añadir Empleados
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors">
            <Filter className="w-4 h-4" /> Filtros
          </button>
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors">
            Descargar todo
          </button>
        </div>

        <DataTable 
          columns={columns}
          data={mockEmployees}
          renderRow={(item) => (
            <>
              <td className="py-4 px-4 text-sm text-gray-800">{item.name}</td>
              <td className="py-4 px-4 text-sm text-gray-600">{item.phone}</td>
              <td className="py-4 px-4 text-sm text-gray-600">{item.email}</td>
              <td className="py-4 px-4 text-sm text-gray-600">{item.dui}</td>
              <td className="py-4 px-4 text-sm text-gray-600">{item.username}</td>
              <td className={`py-4 px-4 text-sm font-medium ${item.status === 'Activo' ? 'text-green-500' : (item.status === 'No activo' ? 'text-red-500' : '')}`}>
                {item.status}
              </td>
            </>
          )}
        />
      </div>
    </div>
  );
};

export default Employees;
