import { useState, useEffect } from 'react';
import { Filter } from 'lucide-react';
import DataTable from '../components/UI/DataTable';
import { employeeService } from '../api/employeeService';
import toast from 'react-hot-toast';
import EmployeeFormModal from '../components/Admin/EmployeeFormModal';
import GenericConfirmModal from '../components/Admin/GenericConfirmModal';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const columns = ['Nombre', 'Número de Teléfono', 'Correo', 'DUI', 'Nombre de Usuario', 'Estatus', 'Acciones'];

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [pendingAction, setPendingAction] = useState({ type: null, data: null });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await employeeService.getEmployees();
      setEmployees(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAddEmployee = () => {
    setCurrentEmployee(null);
    setIsFormOpen(true);
  };

  const handleEditEmployee = (emp) => {
    setCurrentEmployee(emp);
    setIsFormOpen(true);
  };

  const handleDeleteEmployee = (emp) => {
    setPendingAction({ type: 'delete', data: emp });
    setIsConfirmOpen(true);
  };

  const handleSaveForm = (savePayload) => {
    setPendingAction({ type: 'save', data: savePayload });
    setIsConfirmOpen(true);
  };

  const handleConfirmAction = async (payload) => {
    try {
      if (pendingAction.type === 'save') {
        if (payload.id) {
          await employeeService.updateEmployee(payload.id, payload.formData);
          toast.success("Empleado actualizado");
        } else {
          await employeeService.createEmployee(payload.formData);
          toast.success("Empleado creado");
        }
      } else if (pendingAction.type === 'delete') {
        await employeeService.deleteEmployee(payload._id);
        toast.success("Empleado eliminado");
      }
      
      fetchEmployees();
    } catch (error) {
      console.error(error);
    } finally {
      setIsConfirmOpen(false);
      setIsFormOpen(false);
      setPendingAction({ type: null, data: null });
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-8">
      <h1 className="text-4xl font-extrabold text-[#C28C5D] mb-6">Empleados</h1>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-end gap-3 mb-6">
          <button 
            onClick={handleAddEmployee}
            className="px-4 py-2 bg-[#B47C4D] hover:bg-[#9C6026] text-white rounded-md text-sm font-medium transition-colors"
          >
            Añadir Empleados
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors">
            <Filter className="w-4 h-4" /> Filtros
          </button>
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors">
            Descargar todo
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500">Cargando empleados...</p>
        ) : (
          <DataTable 
            columns={columns}
            data={employees}
            renderRow={(item) => (
              <>
                <td className="py-4 px-4 text-sm text-gray-800">
                  <div className="flex items-center gap-3">
                    {item.image ? (
                      <img src={item.image} alt={item.fullName} className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200" />
                    )}
                    {item.fullName || item.name}
                  </div>
                </td>
                <td className="py-4 px-4 text-sm text-gray-600">{item.phoneNumber}</td>
                <td className="py-4 px-4 text-sm text-gray-600">{item.email}</td>
                <td className="py-4 px-4 text-sm text-gray-600">{item.dui}</td>
                <td className="py-4 px-4 text-sm text-gray-600">{item.userName}</td>
                <td className={`py-4 px-4 text-sm font-medium ${item.isActive ? 'text-green-500' : 'text-red-500'}`}>
                  {item.isActive ? 'Activo' : 'Inactivo'}
                </td>
                <td className="py-4 px-4 text-sm text-gray-800 flex gap-4">
                  <button onClick={() => handleEditEmployee(item)} className="text-blue-500 hover:underline">Editar</button>
                  <button onClick={() => handleDeleteEmployee(item)} className="text-red-500 hover:underline">Eliminar</button>
                </td>
              </>
            )}
          />
        )}
      </div>

      <EmployeeFormModal 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        employee={currentEmployee}
        onSave={handleSaveForm}
      />

      <GenericConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmAction}
        data={pendingAction.data}
        actionType={pendingAction.type}
        entityName="Empleado"
      />
    </div>
  );
};

export default Employees;
