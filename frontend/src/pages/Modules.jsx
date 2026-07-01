import { useState, useEffect } from 'react';
import { Filter } from 'lucide-react';
import DataTable from '../components/UI/DataTable';
import { moduleService } from '../api/moduleService';
import toast from 'react-hot-toast';
import ModuleFormModal from '../components/Admin/ModuleFormModal';
import GenericConfirmModal from '../components/Admin/GenericConfirmModal';

const Modules = () => {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const columns = ['Nombre', 'Descripción', 'Estado', 'Acciones'];

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [currentModule, setCurrentModule] = useState(null);
  const [pendingAction, setPendingAction] = useState({ type: null, data: null });

  const fetchModules = async () => {
    try {
      setLoading(true);
      const data = await moduleService.getModules();
      setModules(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const handleAddModule = () => {
    setCurrentModule(null);
    setIsFormOpen(true);
  };

  const handleEditModule = (mod) => {
    setCurrentModule(mod);
    setIsFormOpen(true);
  };

  const handleDeleteModule = (mod) => {
    setPendingAction({ type: 'delete', data: mod });
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
          await moduleService.updateModule(payload.id, payload.data);
          toast.success("Módulo actualizado");
        } else {
          await moduleService.createModule(payload.data);
          toast.success("Módulo creado");
        }
      } else if (pendingAction.type === 'delete') {
        await moduleService.deleteModule(payload._id);
        toast.success("Módulo eliminado");
      }
      
      fetchModules();
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
      <h1 className="text-4xl font-extrabold text-[#C28C5D] mb-6">Módulos</h1>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">Listado de Módulos</h3>
          <div className="flex gap-3">
            <button 
              onClick={handleAddModule}
              className="px-4 py-2 bg-[#B47C4D] hover:bg-[#9C6026] text-white rounded-md text-sm font-medium transition-colors"
            >
              Agregar Módulos
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors">
              <Filter className="w-4 h-4" /> Filtros
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500">Cargando módulos...</p>
        ) : (
          <DataTable 
            columns={columns}
            data={modules}
            renderRow={(item) => (
              <>
                <td className="py-4 px-4 text-sm text-gray-800">{item.name}</td>
                <td className="py-4 px-4 text-sm text-gray-600">{item.description}</td>
                <td className={`py-4 px-4 text-sm font-medium ${item.isActive ? 'text-green-500' : 'text-red-500'}`}>
                  {item.isActive ? 'Activo' : 'Inactivo'}
                </td>
                <td className="py-4 px-4 text-sm text-gray-800 flex gap-4">
                  <button onClick={() => handleEditModule(item)} className="text-blue-500 hover:underline">Editar</button>
                  <button onClick={() => handleDeleteModule(item)} className="text-red-500 hover:underline">Eliminar</button>
                </td>
              </>
            )}
          />
        )}
      </div>

      <ModuleFormModal 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        moduleData={currentModule}
        onSave={handleSaveForm}
      />

      <GenericConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmAction}
        data={pendingAction.data}
        actionType={pendingAction.type}
        entityName="Módulo"
      />
    </div>
  );
};

export default Modules;
