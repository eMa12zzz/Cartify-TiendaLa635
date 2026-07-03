import { AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ConfirmActionModal = ({ isOpen, onClose, onConfirm, product, actionType, brands = [], suppliers = [], categories = [] }) => {

  const isDelete = actionType === 'delete';
  const title = isDelete ? '¿Seguro que deseas eliminar?' : '¿La información está correcta?';

  // Determine what data to display based on action type
  const displayData = isDelete ? product : product?.previewData;
  const imagePreview = isDelete 
    ? (Array.isArray(product?.image) ? product?.image[0] : product?.image) 
    : (product?.selectedImage ? URL.createObjectURL(product?.selectedImage) : (Array.isArray(product?.previewData?.image) ? product?.previewData?.image[0] : product?.previewData?.image));

  const maxStock = displayData?.maxQuantity || displayData?.stock || 100;
  const currentStock = displayData?.stock || 0;
  const quantityPercentage = Math.min(100, Math.max(0, (currentStock / maxStock) * 100));

  const getBrandName = (id) => isDelete ? id?.name : brands?.find(b => b._id === id)?.name || id;
  const getSupplierName = (id) => isDelete ? id?.name : suppliers?.find(s => s._id === id)?.name || id;
  const getCategoryName = (id) => isDelete ? id?.type : categories?.find(c => (c._id === id || c === id))?.type || categories?.find(c => (c._id === id || c === id))?.name || id;

  return (
    <AnimatePresence>
      {(isOpen && product) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden relative z-10"
          >
            
            <div className="bg-[#9C6026] text-white p-4">
              <h2 className="text-xl font-bold text-center flex justify-center items-center gap-2">
                {isDelete && <AlertTriangle className="w-6 h-6 text-yellow-300" />}
                {title}
              </h2>
            </div>

        <div className="flex w-full">
          <div className="w-1/3 bg-[#B07238] text-white p-6 flex flex-col items-center">
            <div className="w-full text-left mb-4">
              <p className="text-[10px] uppercase tracking-wider opacity-80">
                {getBrandName(displayData?.brandId) || 'Sin Marca'}
              </p>
              <h3 className="text-xl font-bold leading-tight">{displayData?.name}</h3>
            </div>
            
            <div className="flex-1 flex items-center justify-center py-4 w-full bg-white/10 rounded-xl mb-4 overflow-hidden h-48">
              {imagePreview ? (
                <img src={imagePreview} alt={displayData?.name} className="w-full h-full object-cover" />
              ) : (
                <p className="text-sm opacity-80">Sin imagen</p>
              )}
            </div>
            
            <div className="text-xs text-center border-t border-white/20 pt-2 w-full">
              Costo: ${Number(displayData?.priceCost || 0).toFixed(2)} | Precio: ${Number(displayData?.salePrice || 0).toFixed(2)}
            </div>
          </div>

          <div className="w-2/3 p-6 flex flex-col relative bg-[#FAF9F6]">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-xs text-gray-500">Proveedor: {getSupplierName(displayData?.supplierId) || 'N/A'}</p>
                <h4 className="text-xl font-bold text-gray-900">Categoría: {getCategoryName(displayData?.typeId)}</h4>
              </div>
              
              <div className="text-right w-1/3">
                <p className="text-xs font-medium text-gray-700 mb-1">Stock</p>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-1">
                  <div 
                    className="h-full bg-[#E07A2B]" 
                    style={{ width: `${quantityPercentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">{currentStock}</p>
              </div>
            </div>

            <div className="flex-1 border border-gray-200 rounded-xl p-4 bg-white mb-6">
              <p className="text-sm text-gray-600 leading-relaxed">
                {displayData?.description}
              </p>
            </div>

            <div className="mb-8">
              <p className="text-sm font-medium text-gray-800">
                Fecha de expiración: {displayData?.expirationDate ? new Date(displayData.expirationDate).toLocaleDateString() : ''}
              </p>
            </div>

            <div className="mt-auto flex justify-end gap-3 w-full">
              <button 
                onClick={onClose}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium px-6 py-2 rounded-full transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => onConfirm(product)}
                className={`${isDelete ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 shadow-sm'} font-medium px-8 py-2 rounded-full transition-colors`}
              >
                {isDelete ? 'Eliminar' : 'Guardar'}
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

export default ConfirmActionModal;
