import { AlertTriangle, CheckCircle } from 'lucide-react';

const GenericConfirmModal = ({ isOpen, onClose, onConfirm, data, actionType, entityName }) => {
  if (!isOpen) return null;

  const isDelete = actionType === 'delete';
  const title = isDelete ? `¿Eliminar ${entityName}?` : `¿Guardar ${entityName}?`;
  
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden relative">
        
        <div className={`p-4 text-white flex justify-center items-center gap-2 ${isDelete ? 'bg-red-500' : 'bg-[#9C6026]'}`}>
          {isDelete ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
          <h2 className="text-xl font-bold text-center">
            {title}
          </h2>
        </div>

        <div className="p-6 flex flex-col bg-[#FAF9F6]">
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
      </div>
    </div>
  );
};

export default GenericConfirmModal;
