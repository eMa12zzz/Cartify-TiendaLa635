import { motion } from 'framer-motion';
import TableActions from '../UI/TableActions';

const ProductCard = ({ product, onEdit, onDelete, onView }) => {
  // Calcular porcentaje para la barra de cantidades (asumimos maximo de 100 si no existe)
  const maxStock = product.maxQuantity || 100;
  const currentStock = product.stock || 0;
  const quantityPercentage = Math.min(100, Math.max(0, (currentStock / maxStock) * 100));

  const imageUrl = Array.isArray(product.image) ? product.image[0] : product.image;
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1], delay: Math.min(index, 8) * 0.045 }}
      className="flex bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover-lift"
    >
      <div className="w-1/3 bg-[#9C6026] text-white p-4 flex flex-col items-center justify-between relative rounded-l-xl">
        <div className="w-full text-left">
          <p className="text-[10px] uppercase tracking-wider opacity-80">{product.brandId?.name}</p>
          <h3 className="text-xl font-bold leading-tight">{product.name}</h3>
        </div>
        
        <div className="flex-1 flex items-center justify-center py-4 w-full">
          {imageUrl && (
            <img 
              src={imageUrl} 
              alt={product.name} 
              className="max-h-32 object-contain filter drop-shadow-lg"
            />
          )}
        </div>
        
        <div className="text-xs text-center border-t border-white/20 pt-2 w-full">
          Costo: ${product.priceCost?.toFixed(2)} | Precio: ${product.salePrice?.toFixed(2)}
        </div>
      </div>

      <div className="w-2/3 p-4 flex flex-col relative">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-xs text-gray-500">Proveedor: {product.supplierId?.name}</p>
            <h4 className="text-lg font-bold text-gray-900">{product.typeId?.type}</h4>
          </div>
          
          <div className="text-right">
            <p className="text-xs font-medium text-gray-700 mb-1">Cantidades</p>
            <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#E07A2B]" 
                style={{ width: `${quantityPercentage}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">{currentStock}/{maxStock}</p>
          </div>
        </div>

        <p className="text-xs text-gray-600 line-clamp-3 mb-4 leading-relaxed">
          {product.description}
        </p>

        <div className="mt-auto flex justify-between items-end">
          <p className="text-xs font-medium text-gray-800">
            Fecha de exp: {new Date(product.expirationDate).toLocaleDateString()}
          </p>
          <TableActions 
            onView={onView ? () => onView(product) : undefined}
            onEdit={() => onEdit(product)}
            onDelete={() => onDelete && onDelete(product)}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
