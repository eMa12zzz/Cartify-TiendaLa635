import { useForm } from 'react-hook-form';
import { reglaTelefono, bloquearNoDigitos } from '../../utils/validaciones';
import { formatearTelefono, LARGO_TELEFONO } from '../../utils/mascaras';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { modalTransition } from '../../utils/motion';

const SupplierFormModal = ({ isOpen, onClose, supplier, onSave, brands = [] }) => {
  const { register, handleSubmit, reset, watch } = useForm();
  
  const isEditing = !!supplier;
  const watchIsActive = watch('isActive');

  useEffect(() => {
    if (isOpen) {
      if (supplier) {
        reset({ 
          name: supplier.name || '', 
          phoneNumber: supplier.phoneNumber || '',
          email: supplier.email || '',
          // creditDays queda fuera a propósito: si el formulario lo enviara,
          // sobrescribiría el plazo configurado en el estado de cuenta.
          brandIds: supplier.brandIds || [],
          isActive: supplier.isActive !== false 
        });
      } else {
        reset({ 
          name: '', 
          phoneNumber: '',
          email: '',
          brandIds: [],
          isActive: true 
        });
      }
    }
  }, [isOpen, supplier, reset]);

  const onSubmit = (data) => {
    onSave({ data, id: supplier?._id });
  };

  const onError = (errs) => {
    // Si una regla dejó mensaje concreto (DUI, teléfono...), mostramos ese.
    const primero = Object.values(errs || {}).find((e) => e?.message)?.message;
    if (primero) { toast.error(primero, { duration: 4000 }); return; }
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
        <div className="bg-[#00283D] text-white p-6">
          <h2 className="text-2xl font-bold text-center">
            {isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
          </h2>
        </div>

        <div className="p-6 bg-[#F1F6F9] flex-1 flex flex-col">
          <form id="supplier-form" onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6 flex-1">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Nombre del Proveedor</label>
                <input 
                  type="text" 
                  {...register('name', { required: true })}
                  className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-full px-4 py-2 focus:outline-none focus:border-[#00283D]"
                  placeholder="Distribuidora XYZ..."
                />
              </div>

              {/*
                Los días de crédito se movieron al estado de cuenta del
                proveedor, donde van junto al límite: son las dos mitades de la
                misma condición ("$1000 a 30 días") y tenerlas en pantallas
                distintas obligaba a acordarse de cambiar las dos.
              */}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Teléfono</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={LARGO_TELEFONO}
                  {...register('phoneNumber', reglaTelefono)}
                  onKeyDown={bloquearNoDigitos}
                  onInput={(e) => { e.target.value = formatearTelefono(e.target.value); }}
                  className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-full px-4 py-2 focus:outline-none focus:border-[#00283D]"
                  placeholder="7777-7777"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Correo Electrónico</label>
                <input 
                  type="email" 
                  {...register('email', { required: true })}
                  className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-full px-4 py-2 focus:outline-none focus:border-[#00283D]"
                  placeholder="contacto@proveedor.com"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Marcas Asociadas</label>
              <div className="bg-white border border-gray-300 rounded-xl p-4 max-h-48 overflow-y-auto">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {brands.map(brand => (
                    <label key={brand._id} className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        value={brand._id}
                        {...register('brandIds')}
                        className="rounded border-gray-300 text-[#00283D] focus:ring-[#00283D]"
                      />
                      <span className="text-sm text-gray-700">{brand.name}</span>
                    </label>
                  ))}
                  {brands.length === 0 && (
                    <p className="text-sm text-gray-500 italic col-span-3">No hay marcas registradas.</p>
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
              form="supplier-form"
              type="submit"
              className="bg-[#00283D] hover:bg-[#003049] text-white font-medium px-8 py-2 rounded-full transition-colors"
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

export default SupplierFormModal;
