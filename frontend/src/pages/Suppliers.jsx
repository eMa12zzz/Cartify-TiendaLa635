import { useState, useEffect } from 'react';
import DataTable from '../components/UI/DataTable';
import { supplierService } from '../api/supplierService';
import { brandService } from '../api/brandService';
import toast from 'react-hot-toast';
import SupplierFormModal from '../components/Admin/SupplierFormModal';
import GenericConfirmModal from '../components/Admin/GenericConfirmModal';
import TableActions from '../components/UI/TableActions';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const columns = ['Nombre', 'Teléfono', 'Estado', 'Acciones'];

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState(null);
  const [pendingAction, setPendingAction] = useState({ type: null, data: null });

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [supplierData, brandData] = await Promise.all([
        supplierService.getSuppliers(),
        brandService.getBrands()
      ]);
      setSuppliers(supplierData);
      setBrands(brandData.filter(b => b.isActive !== false)); // Optional filter
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleAddSupplier = () => {
    setCurrentSupplier(null);
    setIsFormOpen(true);
  };

  const handleEditSupplier = (supplier) => {
    setCurrentSupplier(supplier);
    setIsFormOpen(true);
  };

  const handleDeleteSupplier = (supplier) => {
    setPendingAction({ type: 'delete', data: supplier });
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
          await supplierService.updateSupplier(payload.id, payload.data);
          toast.success("Proveedor actualizado");
        } else {
          await supplierService.createSupplier(payload.data);
          toast.success("Proveedor creado");
        }
      } else if (pendingAction.type === 'delete') {
        await supplierService.deleteSupplier(payload._id);
        toast.success("Proveedor eliminado");
      }
      
      fetchInitialData();
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
      <h1 className="text-4xl font-extrabold text-[#C28C5D] mb-6">Proveedores</h1>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 w-full">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">Listado de Proveedores</h3>
          <button 
            onClick={handleAddSupplier}
            className="px-4 py-2 bg-[#B47C4D] hover:bg-[#9C6026] text-white rounded-md text-sm font-medium transition-colors"
          >
            Agregar Proveedor
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500">Cargando proveedores...</p>
        ) : (
          <DataTable 
            columns={columns}
            data={suppliers}
            renderRow={(item) => (
              <>
                <td className="py-4 px-4 text-sm text-gray-800 font-medium">{item.name}</td>
                <td className="py-4 px-4 text-sm text-gray-600">{item.phoneNumber}</td>
                <td className={`py-4 px-4 text-sm font-medium ${item.isActive === false ? 'text-red-500' : 'text-green-500'}`}>
                  {item.isActive === false ? 'Inactivo' : 'Activo'}
                </td>
                <td className="py-4 px-4 text-sm text-gray-800">
                  <TableActions 
                    onEdit={() => handleEditSupplier(item)} 
                    onDelete={() => handleDeleteSupplier(item)} 
                  />
                </td>
              </>
            )}
          />
        )}
      </div>

      <SupplierFormModal 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        supplier={currentSupplier}
        onSave={handleSaveForm}
        brands={brands}
      />

      <GenericConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmAction}
        data={pendingAction.data}
        actionType={pendingAction.type}
        entityName="Proveedor"
      />
    </div>
  );
};

export default Suppliers;
