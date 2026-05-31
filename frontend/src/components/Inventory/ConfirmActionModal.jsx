import { AlertTriangle } from 'lucide-react';

const ConfirmActionModal = ({ isOpen, onClose, onConfirm, product, actionType }) => {
  if (!isOpen || !product) return null;

  const isDelete = actionType === 'delete';
  const title = isDelete ? '¿Seguro que deseas eliminar?' : '¿La información está correcta?';

  // Calcular porcentaje para la barra
  const quantityPercentage = Math.min(100, Math.max(0, (product.currentQuantity / product.maxQuantity) * 100));

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden relative">
        
        <div className="bg-[#9C6026] text-white p-4">
          <h2 className="text-xl font-bold text-center flex justify-center items-center gap-2">
            {isDelete && <AlertTriangle className="w-6 h-6 text-yellow-300" />}
            {title}
          </h2>
        </div>

        <div className="flex w-full">
          <div className="w-1/3 bg-[#B07238] text-white p-6 flex flex-col items-center">
            <div className="w-full text-left mb-4">
              <p className="text-[10px] uppercase tracking-wider opacity-80">{product.brand}</p>
              <h3 className="text-xl font-bold leading-tight">{product.name}</h3>
            </div>
            
            <div className="flex-1 flex items-center justify-center py-4 w-full bg-white/10 rounded-xl mb-4">
              {product.image ? (
                <img src={product.image} alt={product.name} className="max-h-32 object-contain filter drop-shadow-lg" />
              ) : (
                <p className="text-sm opacity-80">Sin imagen</p>
              )}
            </div>
            
            <div className="text-xs text-center border-t border-white/20 pt-2 w-full">
              PV: ${Number(product.pv).toFixed(2)} | PVP: ${Number(product.pvp).toFixed(2)}
            </div>
          </div>

          <div className="w-2/3 p-6 flex flex-col relative bg-[#FAF9F6]">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-xs text-gray-500">Proveedor: {product.provider}</p>
                <h4 className="text-xl font-bold text-gray-900">{product.category}</h4>
              </div>
              
              <div className="text-right w-1/3">
                <p className="text-xs font-medium text-gray-700 mb-1">Cantidades</p>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-1">
                  <div 
                    className="h-full bg-[#E07A2B]" 
                    style={{ width: `${quantityPercentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">{product.currentQuantity}/{product.maxQuantity}</p>
              </div>
            </div>

            <div className="flex-1 border border-gray-200 rounded-xl p-4 bg-white mb-6">
              <p className="text-sm text-gray-600 leading-relaxed">
                {product.description}
              </p>
            </div>

            <div className="mb-8">
              <p className="text-sm font-medium text-gray-800">
                Fecha de expiración: {product.expirationDate}
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
        
      </div>
    </div>
  );
};

export default ConfirmActionModal;
