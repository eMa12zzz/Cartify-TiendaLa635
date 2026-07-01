import { useState, useEffect } from 'react';
import { Filter } from 'lucide-react';
import DataTable from '../components/UI/DataTable';
import { customerService } from '../api/customerService';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const columns = ['Nombre', 'Número de Teléfono', 'Dirección', 'Correo', 'DUI', 'Nombre de Usuario', 'Verificado', 'Puntos', 'Estatus'];

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerService.getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return (
    <div className="flex flex-col gap-6 w-full pb-8">
      <h1 className="text-4xl font-extrabold text-[#C28C5D] mb-6">Clientes</h1>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-end gap-3 mb-6">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors">
            <Filter className="w-4 h-4" /> Filtros
          </button>
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors">
            Descargar todo
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500">Cargando clientes...</p>
        ) : (
          <DataTable 
            columns={columns}
            data={customers}
            renderRow={(item) => (
              <>
                <td className="py-4 px-4 text-sm text-gray-800">{item.fullName}</td>
                <td className="py-4 px-4 text-sm text-gray-600">{item.phoneNumber}</td>
                <td className="py-4 px-4 text-sm text-gray-600">{Array.isArray(item.clientAddress) ? item.clientAddress.join(', ') : item.clientAddress}</td>
                <td className="py-4 px-4 text-sm text-gray-600">{item.email}</td>
                <td className="py-4 px-4 text-sm text-gray-600">{item.dui}</td>
                <td className="py-4 px-4 text-sm text-gray-600">{item.userName}</td>
                <td className="py-4 px-4 text-sm text-gray-600">{item.isVerified ? 'Verificado' : 'No verificado'}</td>
                <td className="py-4 px-4 text-sm text-gray-600">{item.lolayitypoints || 0}</td>
                <td className={`py-4 px-4 text-sm font-medium ${item.isActive ? 'text-green-500' : 'text-red-500'}`}>
                  {item.isActive ? 'Activo' : 'Inactivo'}
                </td>
              </>
            )}
          />
        )}
      </div>
    </div>
  );
};

export default Customers;
