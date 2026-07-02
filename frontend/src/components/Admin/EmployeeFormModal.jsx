import { useForm } from 'react-hook-form';
import { UploadCloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const EmployeeFormModal = ({ isOpen, onClose, employee, onSave }) => {
  const { register, handleSubmit, reset, watch } = useForm();
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const isEditing = !!employee;
  const watchIsActive = watch('isActive');

  useEffect(() => {
    if (isOpen) {
      if (employee) {
        reset({
          fullName: employee.fullName || employee.name || '',
          email: employee.email || '',
          phoneNumber: employee.phoneNumber || '',
          dui: employee.dui || '',
          userName: employee.userName || '',
          password: '', // Don't pre-fill password for security
          isActive: employee.isActive !== false
        });
        setImagePreview(employee.image || null);
        setSelectedImage(null);
      } else {
        reset({
          fullName: '',
          email: '',
          phoneNumber: '',
          dui: '',
          userName: '',
          password: '',
          isActive: true
        });
        setImagePreview(null);
        setSelectedImage(null);
      }
    }
  }, [isOpen, employee, reset]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = (data) => {
    if (!isEditing && !selectedImage) {
      toast.error('La foto es obligatoria para registrar a un nuevo empleado');
      return;
    }
    
    if (!isEditing && !data.password) {
      toast.error('La contraseña es obligatoria para un nuevo empleado');
      return;
    }

    const formData = new FormData();
    formData.append('fullName', data.fullName);
    formData.append('email', data.email);
    formData.append('phoneNumber', data.phoneNumber);
    formData.append('dui', data.dui);
    formData.append('userName', data.userName);
    
    if (data.password) {
      formData.append('password', data.password);
    }
    
    formData.append('isActive', data.isActive);

    if (selectedImage) {
      formData.append('image', selectedImage);
    }

    onSave({ formData, id: employee?._id, previewData: data });
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
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-4xl flex overflow-hidden relative z-10"
      >
        <div className="w-1/3 bg-[#9C6026] text-white p-6 flex flex-col">
          <h2 className="text-2xl font-bold mb-6">
            {isEditing ? 'Editar Empleado' : 'Nuevo Empleado'}
          </h2>
          
          <div className="space-y-4 flex-1">
            <div>
              <label className="block text-xs mb-1 opacity-90">Nombre Completo</label>
              <input 
                type="text" 
                {...register('fullName', { required: true })}
                className="w-full bg-white text-gray-900 text-sm rounded-md px-3 py-1.5 focus:outline-none"
                placeholder="Juan Pérez..."
              />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/40 rounded-xl bg-white/5 my-4 p-4 text-center cursor-pointer hover:bg-white/10 transition-colors relative overflow-hidden min-h-[200px]">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-80" />
              ) : (
                <>
                  <UploadCloud className="w-8 h-8 mb-2 opacity-80" />
                  <p className="text-xs opacity-90">
                    Foto del Empleado (Requerida)
                  </p>
                </>
              )}
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleImageChange} />
            </div>
            
            <p className="text-xs text-white/70 text-center">
              Haz clic o arrastra para {isEditing ? 'cambiar' : 'subir'} la foto
            </p>
          </div>
        </div>

        <div className="w-2/3 p-6 flex flex-col relative bg-[#FAF9F6]">
          <form id="employee-form" onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6 flex-1">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">DUI</label>
                <input 
                  type="text" 
                  {...register('dui', { required: true })}
                  className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-full px-4 py-2 focus:outline-none focus:border-[#9C6026]"
                  placeholder="00000000-0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Teléfono</label>
                <input 
                  type="text" 
                  {...register('phoneNumber', { required: true })}
                  className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-full px-4 py-2 focus:outline-none focus:border-[#9C6026]"
                  placeholder="Ej. 7777-7777"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Correo Electrónico</label>
              <input 
                type="email" 
                {...register('email', { required: true })}
                className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-full px-4 py-2 focus:outline-none focus:border-[#9C6026]"
                placeholder="empleado@correo.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Nombre de Usuario</label>
                <input 
                  type="text" 
                  {...register('userName', { required: true })}
                  className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-full px-4 py-2 focus:outline-none focus:border-[#9C6026]"
                  placeholder="juanp"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Contraseña {isEditing && <span className="text-xs font-normal text-gray-500">(Opcional)</span>}
                </label>
                <input 
                  type="password" 
                  {...register('password', { required: !isEditing })}
                  className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-full px-4 py-2 focus:outline-none focus:border-[#9C6026]"
                  placeholder={isEditing ? "Dejar en blanco para no cambiar" : "Contraseña segura"}
                />
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
              form="employee-form"
              type="submit"
              className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 shadow-sm font-medium px-8 py-2 rounded-full transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};

export default EmployeeFormModal;
