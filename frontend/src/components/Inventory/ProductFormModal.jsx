import { useForm } from 'react-hook-form';
import { UploadCloud, X } from 'lucide-react';
import { useEffect } from 'react';

const ProductFormModal = ({ isOpen, onClose, product, onSave, onDelete }) => {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();
  
  const isEditing = !!product;

  useEffect(() => {
    if (isOpen) {
      if (product) {
        reset({
          brand: product.brand,
          name: product.name,
          pv: product.pv,
          pvp: product.pvp,
          provider: product.provider,
          category: product.category,
          description: product.description,
          expirationDate: product.expirationDate,
          currentQuantity: product.currentQuantity,
          maxQuantity: product.maxQuantity
        });
      } else {
        reset({
          brand: '',
          name: '',
          pv: '',
          pvp: '',
          provider: '',
          category: '',
          description: '',
          expirationDate: '',
          currentQuantity: 0,
          maxQuantity: 100
        });
      }
    }
  }, [isOpen, product, reset]);

  if (!isOpen) return null;

  const onSubmit = (data) => {

    onSave({ ...data, id: product?.id });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl flex overflow-hidden relative">
        <div className="w-1/3 bg-[#9C6026] text-white p-6 flex flex-col">
          <div className="space-y-4 flex-1">
            <div>
              <label className="block text-xs mb-1 opacity-90">Seleccione la marca</label>
              <select 
                {...register('brand', { required: true })}
                className="w-full bg-white text-gray-900 text-sm rounded-md px-3 py-1.5 focus:outline-none"
              >
                <option value="">Seleccionar...</option>
                <option value="DIANA">DIANA</option>
                <option value="BIMBO">BIMBO</option>
                <option value="LALA">LALA</option>
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

            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/40 rounded-xl bg-white/5 my-4 p-4 text-center cursor-pointer hover:bg-white/10 transition-colors">
              <UploadCloud className="w-8 h-8 mb-2 opacity-80" />
              <p className="text-xs opacity-90">
                Arrastra la imagen de tu producto aquí o selecciónala de tus archivos
              </p>
              <input type="file" className="hidden" accept="image/*" />
            </div>

            <div className="flex gap-4">
              <div className="flex-1 flex items-center gap-2">
                <label className="text-xs">PV:</label>
                <input 
                  type="number" step="0.01" 
                  {...register('pv', { required: true })}
                  className="w-full bg-white text-gray-900 text-sm rounded-md px-2 py-1 focus:outline-none" 
                />
              </div>
              <div className="flex-1 flex items-center gap-2">
                <label className="text-xs">PVP:</label>
                <input 
                  type="number" step="0.01" 
                  {...register('pvp', { required: true })}
                  className="w-full bg-white text-gray-900 text-sm rounded-md px-2 py-1 focus:outline-none" 
                />
              </div>
            </div>
          </div>
        </div>

        <div className="w-2/3 p-6 flex flex-col relative bg-[#FAF9F6]">
          <form id="product-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 flex-1">
            <div className="flex justify-between items-start">
              <div className="space-y-4 w-2/3 pr-8">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Seleccione un proveedor</label>
                  <select 
                    {...register('provider', { required: true })}
                    className="w-full border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-[#9C6026]"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="DIANA">DIANA</option>
                    <option value="BIMBO">BIMBO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Seleccione la categoría</label>
                  <select 
                    {...register('category', { required: true })}
                    className="w-full border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-[#9C6026]"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Snack">Snack</option>
                    <option value="Pan">Pan</option>
                    <option value="Lacteos">Lacteos</option>
                  </select>
                </div>
              </div>
              
              <div className="w-1/3">
                <label className="block text-sm font-bold text-gray-900 mb-1">Unidades</label>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-[#E07A2B]" style={{ width: '50%' }}></div>
                </div>
                <div className="flex gap-1 items-center">
                   <input 
                    type="number" 
                    {...register('currentQuantity', { required: true })}
                    className="w-1/2 border border-gray-300 rounded-full px-2 py-1 text-xs text-center focus:outline-none"
                    placeholder="Actual"
                   />
                   <span className="text-gray-500">/</span>
                   <input 
                    type="number" 
                    {...register('maxQuantity', { required: true })}
                    className="w-1/2 border border-gray-300 rounded-full px-2 py-1 text-xs text-center focus:outline-none"
                    placeholder="Máx"
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
        
      </div>
    </div>
  );
};

export default ProductFormModal;
