import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { modalTransition } from '../../utils/motion';

const CategoryFormModal = ({ isOpen, onClose, category, onSave, modules = [], suppliers = [] }) => {
  const { register, handleSubmit, reset, watch } = useForm();
  
  const isEditing = !!category;
  const watchIsActive = watch('isActive');
  
  const [subtypes, setSubtypes] = useState([]);
  const [newSubtype, setNewSubtype] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (category) {
        reset({ 
          type: category.type || '', 
          moduleId: category.moduleId?._id || category.moduleId || '',
          supplierIds: category.supplierIds || [],
          isActive: category.isActive !== false 
        });
        setSubtypes(category.subtype || []);
      } else {
        reset({ 
          type: '', 
          moduleId: '',
          supplierIds: [],
          isActive: true 
        });
        setSubtypes([]);
      }
      setNewSubtype('');
    }
  }, [isOpen, category, reset]);

  const handleAddSubtype = () => {
    if (newSubtype.trim()) {
      if (!subtypes.includes(newSubtype.trim())) {
        setSubtypes([...subtypes, newSubtype.trim()]);
      }
      setNewSubtype('');
    }
  };

  const handleRemoveSubtype = (st) => {
    setSubtypes(subtypes.filter(item => item !== st));
  };

  const onSubmit = (data) => {
    // Inject subtypes state into data payload
    onSave({ data: { ...data, subtype: subtypes }, id: category?._id });
  };

  const onError = () => {
    toast.error('Por favor, completa todos los campos obligatorios', { duration: 4000 });
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
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col overflow-hidden relative z-10"
      >
        <div className="bg-[#9C6026] text-white p-6">
          <h2 className="text-2xl font-bold text-center">
            {isEditing ? 'Editar Categoría' : 'Nueva Categoría'}
          </h2>
        </div>

        <div className="p-6 bg-[#FAF9F6] flex-1 flex flex-col max-h-[80vh] overflow-y-auto">
          <form id="category-form" onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6 flex-1">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Nombre de la Categoría (Tipo)</label>
                <input 
                  type="text" 
                  {...register('type', { required: true })}
                  className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-full px-4 py-2 focus:outline-none focus:border-[#9C6026]"
                  placeholder="Ej. Lácteos, Bebidas..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Módulo Asignado</label>
                <select 
                  {...register('moduleId', { required: true })}
                  className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-full px-4 py-2 focus:outline-none focus:border-[#9C6026]"
                >
                  <option value="">Seleccione un Módulo</option>
                  {modules.map(m => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Subtipos (Opcional)</label>
              <div className="flex gap-2 mb-2">
                <input 
                  type="text" 
                  value={newSubtype}
                  onChange={(e) => setNewSubtype(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubtype();
                    }
                  }}
                  className="flex-1 bg-white border border-gray-300 text-gray-900 text-sm rounded-full px-4 py-2 focus:outline-none focus:border-[#9C6026]"
                  placeholder="Añadir subtipo y presionar Enter..."
                />
                <button
                  type="button"
                  onClick={handleAddSubtype}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 rounded-full text-sm font-medium transition-colors"
                >
                  Añadir
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {subtypes.map(st => (
                  <span key={st} className="bg-[#B47C4D] text-white px-3 py-1 rounded-full text-xs flex items-center gap-2">
                    {st}
                    <button type="button" onClick={() => handleRemoveSubtype(st)} className="hover:text-red-300">
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <label className="block text-sm font-bold text-gray-700 mb-2">Proveedores Autorizados</label>
              <div className="bg-white border border-gray-300 rounded-xl p-4 max-h-48 overflow-y-auto">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {suppliers.map(supp => (
                    <label key={supp._id} className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        value={supp._id}
                        {...register('supplierIds')}
                        className="rounded border-gray-300 text-[#9C6026] focus:ring-[#9C6026]"
                      />
                      <span className="text-sm text-gray-700">{supp.name}</span>
                    </label>
                  ))}
                  {suppliers.length === 0 && (
                    <p className="text-sm text-gray-500 italic col-span-3">No hay proveedores registrados.</p>
                  )}
                </div>
              </div>
            </div>
            
            {isEditing && (
              <div className="pt-4 border-t border-gray-100">
                <label className="flex items-center cursor-pointer w-max">
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
              form="category-form"
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

export default CategoryFormModal;
