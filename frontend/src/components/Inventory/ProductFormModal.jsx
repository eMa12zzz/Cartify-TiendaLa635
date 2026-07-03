import { UploadCloud, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const ProductFormModal = ({ isOpen, onClose, product, onSave, onDelete, brands = [], suppliers = [], categories = [], modules = [] }) => {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Cascading state
  const watchModuleId = watch('moduleId');
  const watchTypeId = watch('typeId');
  const watchSupplierId = watch('supplierId');
  const watchIsActive = watch('isActive');

  const selectedModuleObj = modules.find(m => m._id === watchModuleId);
  const isStoreModule = selectedModuleObj?.name?.toLowerCase() === 'tienda';
  const isPrintModule = selectedModuleObj?.name?.toLowerCase() === 'impresiones';

  const filteredCategories = categories.filter(c => {
    const catModuleId = typeof c.moduleId === 'object' ? c.moduleId?._id : c.moduleId;
    return catModuleId === watchModuleId;
  });
  
  // Marca (Brand) filtrada por Proveedor (Supplier)
  const selectedSupplierObj = suppliers.find(s => s._id === watchSupplierId);
  const filteredBrands = (selectedSupplierObj?.brandIds && selectedSupplierObj.brandIds.length > 0)
    ? brands.filter(b => selectedSupplierObj.brandIds.includes(b._id))
    : brands;
  
  
  const isEditing = !!product;

  useEffect(() => {
    if (isOpen) {
      if (product) {
        reset({
          brandId: product.brandId?._id || product.brandId || '',
          name: product.name,
          priceCost: product.priceCost,
          salePrice: product.salePrice,
          supplierId: product.supplierId?._id || product.supplierId || '',
          typeId: product.typeId?._id || product.typeId || '',
          moduleId: product.moduleId?._id || product.moduleId || '',
          description: product.description,
          expirationDate: product.expirationDate ? new Date(product.expirationDate).toISOString().split('T')[0] : '',
          stock: product.stock,
          barCode: product.barCode || '',
          isActive: product.isActive !== false
        });
        setImagePreview(product.image?.[0] || product.image || null);
        setSelectedImage(null);
      } else {
        reset({
          brandId: '',
          name: '',
          priceCost: '',
          salePrice: '',
          supplierId: '',
          typeId: '',
          moduleId: '',
          description: '',
          expirationDate: '',
          stock: 0,
          barCode: '',
          isActive: true
        });
        setImagePreview(null);
        setSelectedImage(null);
      }
    }
  }, [isOpen, product, reset]);

  // Reset dependent fields when parent changes
  useEffect(() => {
    if (isOpen && !isEditing) {
      setValue('typeId', '');
      setValue('supplierId', '');
      setValue('brandId', '');
    }
  }, [watchModuleId, isOpen, isEditing, setValue]);

  useEffect(() => {
    if (isOpen && !isEditing) {
      setValue('brandId', '');
    }
  }, [watchSupplierId, isOpen, isEditing, setValue]);

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = (data) => {
    if (!isEditing && !selectedImage) {
      toast.error('La imagen es obligatoria para un producto nuevo');
      return;
    }

    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('brandId', data.brandId);
    formData.append('priceCost', data.priceCost);
    formData.append('salePrice', data.salePrice);
    formData.append('supplierId', data.supplierId);
    formData.append('typeId', data.typeId);
    // moduleId is no longer saved directly on Product
    formData.append('description', data.description);
    formData.append('expirationDate', data.expirationDate);
    formData.append('stock', data.stock);
    formData.append('barCode', data.barCode);
    formData.append('isActive', data.isActive);
    
    if (selectedImage) {
      formData.append('image', selectedImage);
    }

    onSave({ formData, id: product?._id, previewData: data, selectedImage });
  };

  const onError = (errors) => {
    toast.error('Por favor, completa todos los campos obligatorios (Revisa si olvidaste la Marca, Categoría, etc.)', {
      duration: 4000,
    });
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
          <div className="space-y-4 flex-1">
            <div>
              <label className="block text-xs mb-1 opacity-90">Seleccione la marca</label>
              <select 
                {...register('brandId', { required: true })}
                disabled={!watchSupplierId && isStoreModule}
                className="w-full bg-white text-gray-900 text-sm rounded-md px-3 py-1.5 focus:outline-none disabled:opacity-50"
              >
                <option value="">Seleccionar...</option>
                {filteredBrands.map(b => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs mb-1 opacity-90">Nombre del producto</label>
              <input 
                type="text" 
                {...register('name', { required: true })}
                className="w-full bg-white text-gray-900 text-sm rounded-md px-3 py-1.5 focus:outline-none"
              />
            </div>

            <div className="w-full h-48 min-h-[192px] flex flex-col items-center justify-center border-2 border-dashed border-white/40 rounded-xl bg-white/5 my-4 p-4 text-center cursor-pointer hover:bg-white/10 transition-colors relative overflow-hidden flex-shrink-0">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-contain p-2" />
              ) : (
                <>
                  <UploadCloud className="w-8 h-8 mb-2 opacity-80" />
                  <p className="text-xs opacity-90">
                    Arrastra la imagen o selecciona de tus archivos
                  </p>
                </>
              )}
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleImageChange} />
            </div>

            <div className="flex gap-4">
              <div className="flex-1 flex items-center gap-2">
                <label className="text-xs">Costo ($):</label>
                <input 
                  type="number" step="0.01" 
                  {...register('priceCost', { required: true })}
                  className="w-full bg-white text-gray-900 text-sm rounded-md px-2 py-1 focus:outline-none" 
                />
              </div>
              <div className="flex-1 flex items-center gap-2">
                <label className="text-xs">Precio ($):</label>
                <input 
                  type="number" step="0.01" 
                  {...register('salePrice', { required: true })}
                  className="w-full bg-white text-gray-900 text-sm rounded-md px-2 py-1 focus:outline-none" 
                />
              </div>
            </div>
          </div>
        </div>

        <div className="w-2/3 p-6 flex flex-col relative bg-[#FAF9F6]">
          <form id="product-form" onSubmit={handleSubmit(onSubmit, onError)} className="space-y-4 flex-1">
            <div className="flex justify-between items-start">
              <div className="space-y-4 w-2/3 pr-8 flex flex-col">
                <div className="order-1">
                  <label className="block text-xs text-gray-500 mb-1">Módulo / Pasillo</label>
                  <select 
                    {...register('moduleId', { required: true })}
                    className="w-full border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-[#9C6026]"
                  >
                    <option value="">Seleccionar...</option>
                    {modules.map(m => (
                      <option key={m._id} value={m._id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div className="order-2">
                  <label className="block text-xs text-gray-500 mb-1">Categoría (Tipo)</label>
                  <select 
                    {...register('typeId', { required: true })}
                    disabled={!watchModuleId}
                    className="w-full border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-[#9C6026] disabled:opacity-50 disabled:bg-gray-100"
                  >
                    <option value="">Seleccionar...</option>
                    {filteredCategories.map((c, i) => (
                      <option key={c._id || i} value={c._id || c}>{c.type || c}</option> 
                    ))}
                  </select>
                </div>
                
                <div className="order-3">
                  <label className="block text-xs text-gray-500 mb-1">
                    Proveedor {isStoreModule && <span className="text-red-500">*</span>}
                    {isPrintModule && <span className="text-gray-400 font-normal"> (Opcional)</span>}
                  </label>
                  <select 
                    {...register('supplierId', { required: isStoreModule })}
                    disabled={!watchModuleId}
                    className={`w-full border rounded-full px-4 py-2 text-sm focus:outline-none focus:border-[#9C6026] disabled:opacity-50 disabled:bg-gray-100 ${
                      errors.supplierId ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Seleccionar...</option>
                    {suppliers.map(s => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                  {errors.supplierId && (
                    <span className="text-xs text-red-500 mt-1 block">El proveedor es obligatorio para Tienda</span>
                  )}
                </div>
              </div>
              
              <div className="w-1/3 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1">Stock</label>
                  <input 
                    type="number" 
                    {...register('stock', { required: true })}
                    className="w-full border border-gray-300 rounded-full px-4 py-2 text-sm text-center focus:outline-none focus:border-[#9C6026]"
                    placeholder="Unidades"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-bold text-gray-900">Código Barra</label>
                    <button 
                      type="button" 
                      onClick={() => setValue('barCode', Math.floor(1000000000000 + Math.random() * 9000000000000).toString())}
                      className="text-xs text-[#C28C5D] hover:underline"
                    >
                      Generar
                    </button>
                  </div>
                  <input 
                    type="text" 
                    {...register('barCode', { required: true })}
                    className="w-full border border-gray-300 rounded-full px-4 py-2 text-sm text-center focus:outline-none focus:border-[#9C6026]"
                    placeholder="Escanear o generar..."
                  />
                </div>
              </div>
            </div>

            <div>
              <textarea 
                {...register('description', { required: true })}
                rows={3}
                placeholder="Ingrese la descripción del producto..."
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#9C6026] resize-none"
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Fecha de expiración:
              </label>
              <input 
                type="date" 
                {...register('expirationDate', { required: true })}
                className="w-1/2 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-[#9C6026]"
              />
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
          
          <div className="mt-8 flex justify-between items-center w-full relative">
            <div className="flex-1">
              {isEditing && (
                <button 
                  type="button"
                  onClick={() => onDelete(product)}
                  className="bg-red-500 hover:bg-red-600 text-white font-medium px-6 py-2 rounded-full transition-colors"
                >
                  Eliminar
                </button>
              )}
            </div>
            
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={onClose}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium px-6 py-2 rounded-full transition-colors"
              >
                Cancelar
              </button>
              <button 
                form="product-form"
                type="submit"
                className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 shadow-sm font-medium px-8 py-2 rounded-full transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
        
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};

export default ProductFormModal;
