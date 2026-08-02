import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { modalTransition } from '../../utils/motion';
import { formatearFecha } from '../../utils/fechas';

const ProductViewModal = ({ isOpen, onClose, product, modules = [] }) => {

  const moduleId = product?.typeId?.moduleId || product?.typeId;
  const moduleName = modules?.find(m => m._id === moduleId)?.name || 'Módulo Desconocido';
  const imageUrl = Array.isArray(product?.image) ? product?.image[0] : product?.image;

  return (
    <AnimatePresence>
      {(isOpen && product) && (
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
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex overflow-hidden relative z-10"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 bg-white/50 rounded-full p-1 z-10"
        >
          <X size={20} />
        </button>

        <div className="w-1/3 bg-[#9C6026] text-white p-6 flex flex-col items-center justify-center relative">
          <div className="w-full text-center mb-6">
            <h3 className="text-xl font-bold leading-tight mb-1">{product.name}</h3>
            <p className="text-xs uppercase tracking-wider opacity-80">{product.brandId?.name || 'Sin Marca'}</p>
          </div>
          
          <div className="flex-1 w-full flex items-center justify-center mb-6">
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt={product.name} 
                className="max-h-48 object-contain filter drop-shadow-xl"
              />
            ) : (
              <div className="w-full h-48 flex items-center justify-center border-2 border-dashed border-white/40 rounded-xl bg-white/5">
                <span className="text-sm opacity-80">Sin imagen</span>
              </div>
            )}
          </div>
          
          <div className="text-sm text-center border-t border-white/20 pt-4 w-full">
            <div className="font-semibold">Costo: <span className="font-normal">${product.priceCost?.toFixed(2)}</span></div>
            <div className="font-semibold mt-1">Precio Venta: <span className="font-normal">${product.salePrice?.toFixed(2)}</span></div>
          </div>
        </div>

        <div className="w-2/3 p-8 flex flex-col bg-[#FAF9F6] relative">
          <h2 className="text-2xl font-bold text-[#8B5A2B] mb-6 border-b border-gray-200 pb-2">
            Detalles del Producto
          </h2>

          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Módulo / Pasillo</p>
                <p className="text-sm text-gray-900 font-medium">{moduleName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Categoría</p>
                <p className="text-sm text-gray-900 font-medium">{product.typeId?.type || 'Sin Categoría'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Proveedor</p>
                <p className="text-sm text-gray-900 font-medium">{product.supplierId?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Estado</p>
                <p className={`text-sm font-bold ${product.isActive !== false ? 'text-green-600' : 'text-red-600'}`}>
                  {product.isActive !== false ? 'Activo' : 'Inactivo'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Stock Actual</p>
                <p className="text-sm text-gray-900 font-medium">{product.stock || 0} unidades</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Stock Máximo</p>
                <p className="text-sm text-gray-900 font-medium">{product.maxQuantity || product.stock || 0} unidades</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Fecha de Expiración</p>
                {/* Mismo criterio que la tarjeta: sin fecha válida no se pinta una. */}
                <p className="text-sm text-gray-900 font-medium">
                  {formatearFecha(product.expirationDate) || 'Sin fecha de vencimiento'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Código de Barras</p>
                <p className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded inline-block">
                  {product.barCode || 'N/A'}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Descripción</p>
              <div className="bg-white p-3 rounded-lg border border-gray-200 text-sm text-gray-700 min-h-[60px]">
                {product.description || 'Sin descripción...'}
              </div>
            </div>
          </div>
          
          <div className="mt-auto pt-6 flex justify-end">
            <button 
              onClick={onClose}
              className="bg-[#9C6026] hover:bg-[#8B5A2B] text-white font-medium px-8 py-2 rounded-full transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};

export default ProductViewModal;
