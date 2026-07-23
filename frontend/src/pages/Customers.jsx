import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import FilterSelect from '../components/UI/FilterSelect';
import DataTable from '../components/UI/DataTable';
import { customerService } from '../api/customerService';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const columns = ['Nombre', 'Número de Teléfono', 'Dirección', 'Correo', 'DUI', 'Nombre de Usuario', 'Verificado', 'Puntos', 'Estatus'];

  const filteredCustomers = customers.filter(c => {
    const s = searchTerm.toLowerCase();
    const matchesSearch = c.fullName?.toLowerCase().includes(s) ||
                          c.email?.toLowerCase().includes(s) ||
                          c.userName?.toLowerCase().includes(s);
    if (statusFilter === 'Todos') return matchesSearch;
    if (statusFilter === 'Activo') return matchesSearch && c.isActive !== false;
    if (statusFilter === 'Inactivo') return matchesSearch && c.isActive === false;
    return matchesSearch;
  });

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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h3 className="text-xl font-bold text-gray-800">Listado de Clientes</h3>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar cliente..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-full text-sm outline-none focus:border-[#B47C4D] transition-colors w-64 shadow-sm"
              />
            </div>
            <FilterSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'Activo', label: 'Activos' },
                { value: 'Inactivo', label: 'Inactivos' },
              ]}
            />
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500">Cargando clientes...</p>
        ) : (
          <DataTable 
            columns={columns}
            data={filteredCustomers}
            renderRow={(item) => (
              <>
                <td className="py-4 px-4 text-sm text-gray-800">{item.fullName}</td>
                <td className="py-4 px-4 text-sm text-gray-600">{item.phoneNumber}</td>
                <td className="py-4 px-4 text-sm text-gray-600">{Array.isArray(item.clientAddress) ? item.clientAddress.join(', ') : item.clientAddress}</td>
                <td className="py-4 px-4 text-sm text-gray-600">{item.email}</td>
                <td className="py-4 px-4 text-sm text-gray-600">{item.dui}</td>
                <td className="py-4 px-4 text-sm text-gray-600">{item.userName}</td>
                <td className="py-4 px-4 text-sm text-gray-600">{item.isVerified ? 'Verificado' : 'No verificado'}</td>
                <td className="py-4 px-4 text-sm text-gray-600">{item.loyaltyPoints ?? item.lolayitypoints ?? 0}</td>
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

