import DataTable from '../components/UI/DataTable';

const mockBrands = [
  { id: 1, name: 'Bru', status: 'Activo' },
  { id: 2, name: 'Maggi', status: 'Inactivo' },
  { id: 3, name: 'Red Bull', status: 'Activo' },
  { id: 4, name: 'Bourn Vita', status: 'Inactivo' },
  { id: 5, name: 'Horlicks', status: 'Activo' },
  { id: 6, name: 'Harpic', status: 'Inactivo' },
  { id: 7, name: 'Ariel', status: 'Activo' },
  { id: 8, name: 'Scotch Brite', status: 'Inactivo' },
  { id: 9, name: 'Coca cola', status: 'Activo' },
];

const Brands = () => {
  const columns = ['Nombre', 'Estado'];

  return (
    <div className="flex flex-col gap-6 w-full pb-8">
      <h1 className="text-4xl font-extrabold text-[#C28C5D] mb-6">Marcas</h1>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">Marcas</h3>
          <button className="px-4 py-2 bg-[#B47C4D] hover:bg-[#9C6026] text-white rounded-md text-sm font-medium transition-colors">
            Agregar Marca
          </button>
        </div>

        <DataTable 
          columns={columns}
          data={mockBrands}
          renderRow={(item) => (
            <>
              <td className="py-4 px-4 text-sm text-gray-800">{item.name}</td>
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

export default Brands;
