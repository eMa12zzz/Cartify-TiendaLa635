import { AlertTriangle, CheckCircle, Trash2, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { modalTransition } from '../../utils/motion';

const GenericConfirmModal = ({ isOpen, onClose, onConfirm, data, actionType, entityName }) => {

  const isDelete = actionType === 'delete';
  const title = isDelete ? `¿Eliminar ${entityName}?` : `¿Guardar ${entityName}?`;
  
  return (
    <AnimatePresence>
      {isOpen && (
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
        transition={modalTransition}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden relative z-10"
      >
        
        <div className={`p-4 text-white flex justify-center items-center gap-2 ${isDelete ? 'bg-red-500' : 'bg-[#00283D]'}`}>
          {isDelete ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
          <h2 className="text-xl font-bold text-center">
            {title}
          </h2>
        </div>

        <div className="p-6 flex flex-col bg-[#F1F6F9]">
          <p className="text-gray-700 text-center mb-8">
            {isDelete 
              ? `Estás a punto de eliminar permanentemente este registro. Esta acción no se puede deshacer.`
              : `Por favor confirma que la información ingresada es correcta antes de guardar.`
            }
          </p>

          <div className="flex justify-center gap-4 w-full">
            <button 
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium px-6 py-2 rounded-full transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={() => onConfirm(data)}
              className={`${isDelete ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 shadow-sm'} font-medium px-8 py-2 rounded-full transition-colors`}
            >
              {isDelete ? 'Eliminar' : 'Confirmar'}
            </button>
          </div>
        </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};

export default GenericConfirmModal;
