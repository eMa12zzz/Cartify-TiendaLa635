import { useState, useEffect } from 'react';
import DataTable from '../components/UI/DataTable';
import { brandService } from '../api/brandService';
import toast from 'react-hot-toast';
import BrandFormModal from '../components/Admin/BrandFormModal';
import GenericConfirmModal from '../components/Admin/GenericConfirmModal';
import TableActions from '../components/UI/TableActions';

const Brands = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const columns = ['Nombre', 'Estado', 'Acciones'];

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [currentBrand, setCurrentBrand] = useState(null);
  const [pendingAction, setPendingAction] = useState({ type: null, data: null });

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const data = await brandService.getBrands();
      setBrands(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleAddBrand = () => {
    setCurrentBrand(null);
    setIsFormOpen(true);
  };

  const handleEditBrand = (brand) => {
    setCurrentBrand(brand);
    setIsFormOpen(true);
  };

  const handleDeleteBrand = (brand) => {
    setPendingAction({ type: 'delete', data: brand });
    setIsConfirmOpen(true);
  };

  const handleSaveForm = (savePayload) => {
    setPendingAction({ type: 'save', data: savePayload });
    setIsConfirmOpen(true);
  };

  const handleConfirmAction = async (payload) => {
    try {
      if (pendingAction.type === 'save') {
        if (payload.id) {
          await brandService.updateBrand(payload.id, payload.data);
          toast.success("Marca actualizada");
        } else {
          await brandService.createBrand(payload.data);
          toast.success("Marca creada");
        }
      } else if (pendingAction.type === 'delete') {
        await brandService.deleteBrand(payload._id);
        toast.success("Marca eliminada");
      }
      
      fetchBrands();
    } catch (error) {
      console.error(error);
    } finally {
      setIsConfirmOpen(false);
      setIsFormOpen(false);
      setPendingAction({ type: null, data: null });
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-8">
      <h1 className="text-4xl font-extrabold text-[#C28C5D] mb-6">Marcas</h1>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 w-full">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">Listado de Marcas</h3>
          <button 
            onClick={handleAddBrand}
            className="px-4 py-2 bg-[#B47C4D] hover:bg-[#9C6026] text-white rounded-md text-sm font-medium transition-colors"
          >
            Agregar Marca
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500">Cargando marcas...</p>
        ) : (
          <DataTable 
            columns={columns}
            data={brands}
            renderRow={(item) => (
              <>
                <td className="py-4 px-4 text-sm text-gray-800">{item.name}</td>
                <td className={`py-4 px-4 text-sm font-medium ${item.isActive ? 'text-green-500' : 'text-red-500'}`}>
                  {item.isActive ? 'Activo' : 'Inactivo'}
                </td>
                <td className="py-4 px-4 text-sm text-gray-800">
                  <TableActions 
                    onEdit={() => handleEditBrand(item)} 
                    onDelete={() => handleDeleteBrand(item)} 
                  />
                </td>
              </>
            )}
          />
        )}
      </div>

      <BrandFormModal 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        brand={currentBrand}
        onSave={handleSaveForm}
      />

      <GenericConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmAction}
        data={pendingAction.data}
        actionType={pendingAction.type}
        entityName="Marca"
      />
    </div>
  );
};

export default Brands;
