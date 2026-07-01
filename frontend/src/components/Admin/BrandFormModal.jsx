import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

const BrandFormModal = ({ isOpen, onClose, brand, onSave }) => {
  const { register, handleSubmit, reset } = useForm();
  
  const isEditing = !!brand;

  useEffect(() => {
    if (isOpen) {
      if (brand) {
        reset({ name: brand.name });
      } else {
        reset({ name: '' });
      }
    }
  }, [isOpen, brand, reset]);

  if (!isOpen) return null;

  const onSubmit = (data) => {
    onSave({ data, id: brand?._id });
  };

  const onError = () => {
    toast.error('Por favor, completa todos los campos obligatorios', { duration: 4000 });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col overflow-hidden relative">
        <div className="bg-[#9C6026] text-white p-6">
          <h2 className="text-2xl font-bold text-center">
            {isEditing ? 'Editar Marca' : 'Nueva Marca'}
          </h2>
        </div>

        <div className="p-6 bg-[#FAF9F6] flex-1 flex flex-col">
          <form id="brand-form" onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6 flex-1">
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Nombre de la Marca</label>
              <input 
                type="text" 
                {...register('name', { required: true })}
                className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-full px-4 py-2 focus:outline-none focus:border-[#9C6026]"
                placeholder="Ej. Nike, Adidas..."
              />
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
              form="brand-form"
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

export default BrandFormModal;
