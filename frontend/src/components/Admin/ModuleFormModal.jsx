import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

const ModuleFormModal = ({ isOpen, onClose, moduleData, onSave }) => {
  const { register, handleSubmit, reset } = useForm();
  
  const isEditing = !!moduleData;

  useEffect(() => {
    if (isOpen) {
      if (moduleData) {
        reset({ name: moduleData.name, description: moduleData.description });
      } else {
        reset({ name: '', description: '' });
      }
    }
  }, [isOpen, moduleData, reset]);

  if (!isOpen) return null;

  const onSubmit = (data) => {
    onSave({ data: { ...data, isActive: true }, id: moduleData?._id });
  };

  const onError = () => {
    toast.error('Por favor, completa todos los campos obligatorios', { duration: 4000 });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col overflow-hidden relative">
        <div className="bg-[#9C6026] text-white p-6">
          <h2 className="text-2xl font-bold text-center">
            {isEditing ? 'Editar Módulo' : 'Nuevo Módulo'}
          </h2>
        </div>

        <div className="p-6 bg-[#FAF9F6] flex-1 flex flex-col">
          <form id="module-form" onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6 flex-1">
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Nombre del Módulo</label>
              <input 
                type="text" 
                {...register('name', { required: true })}
                className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-full px-4 py-2 focus:outline-none focus:border-[#9C6026]"
                placeholder="Ej. Tienda, Almacén..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Descripción</label>
              <textarea 
                {...register('description', { required: true })}
                rows={4}
                className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#9C6026] resize-none"
                placeholder="Breve descripción del módulo..."
              ></textarea>
            </div>

          </form>
          
          <div className="mt-8 flex justify-end gap-3 w-full">
            <button 
              type="button"
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium px-6 py-2 rounded-full transition-colors"
            >
              Cancelar
            </button>
            <button 
              form="module-form"
              type="submit"
              className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 shadow-sm font-medium px-8 py-2 rounded-full transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleFormModal;
