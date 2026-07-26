import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { modalTransition } from '../../utils/motion';

const BrandFormModal = ({ isOpen, onClose, brand, onSave }) => {
  const { register, handleSubmit, reset, watch } = useForm();
  
  const isEditing = !!brand;
  const watchIsActive = watch('isActive');

  useEffect(() => {
    if (isOpen) {
      if (brand) {
        reset({ name: brand.name, isActive: brand.isActive !== false }); // Default to true if undefined
      } else {
        reset({ name: '', isActive: true });
      }
    }
  }, [isOpen, brand, reset]);

  const onError = () => {
    toast.error('Por favor, completa todos los campos obligatorios', { duration: 4000 });
  };

  const onSubmit = (data) => {
    onSave({ data, id: brand?._id });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40"
          onClick={onClose}
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={modalTransition}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col overflow-hidden relative z-10"
      >
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
            
            {isEditing && (
              <div className="pt-4 border-t border-gray-100">
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" className="sr-only" {...register('isActive')} />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${watchIsActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${watchIsActive ? 'transform translate-x-4' : ''}`}></div>
                  </div>
                  <div className="ml-3 text-sm font-medium text-gray-700">
                    Estado: {watchIsActive ? 'Activo' : 'Inactivo'}
                  </div>
                </label>
              </div>
            )}

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
              className="bg-[#9C6026] hover:bg-[#8B5A2B] text-white font-medium px-8 py-2 rounded-full transition-colors"
            >
              Guardar
            </button>
          </div>
        </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};

export default BrandFormModal;
