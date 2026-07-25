import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import DataTable from '../components/UI/DataTable';
import TableActions from '../components/UI/TableActions';
import GenericConfirmModal from '../components/Admin/GenericConfirmModal';
import { printServiceService } from '../api/printServiceService';

/*
 * ServiciosImpresion (Admin) — catálogo de formatos de impresión con precio.
 * El cliente elige estos formatos en /impresiones.
 */
const emptyForm = { name: '', widthCm: 21.6, heightCm: 27.9, pricePerCopy: '', allowsColor: true, colorSurcharge: '', isActive: true };

const ServiciosImpresion = () => {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const cargar = async () => {
    setLoading(true);
    try { const d = await printServiceService.getServices(); setServicios(Array.isArray(d) ? d : []); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { cargar(); }, []);

  const abrirNuevo = () => { setEditId(null); setForm(emptyForm); setModalOpen(true); };
  const abrirEditar = (s) => {
    setEditId(s._id);
    setForm({
      name: s.name || '', widthCm: s.widthCm ?? 21.6, heightCm: s.heightCm ?? 27.9,
      pricePerCopy: s.pricePerCopy ?? '', allowsColor: s.allowsColor !== false,
      colorSurcharge: s.colorSurcharge ?? '', isActive: s.isActive !== false,
    });
    setModalOpen(true);
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || form.pricePerCopy === '') { toast.error('Nombre y precio por copia son requeridos'); return; }
    try {
      if (editId) { await printServiceService.updateService(editId, form); toast.success('Formato actualizado'); }
      else { await printServiceService.createService(form); toast.success('Formato creado'); }
      setModalOpen(false); cargar();
    } catch (e) { console.error(e); }
  };

  const eliminar = async () => {
    if (!toDelete) return;
    try { await printServiceService.deleteService(toDelete._id); toast.success('Formato eliminado'); }
    catch (e) { console.error(e); }
    finally { setConfirmOpen(false); setToDelete(null); cargar(); }
  };

  const inputSm = 'w-40 bg-white border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-[#9C6026]';

  return (
    <div className="flex flex-col gap-6 w-full pb-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-4xl font-extrabold text-[#C28C5D]">Impresiones</h1>
        <button onClick={abrirNuevo} className="px-4 py-2 bg-[#B47C4D] hover:bg-[#9C6026] text-white rounded-full text-sm font-medium transition-colors shadow-sm">Agregar formato</button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Servicios de Impresión</h3>
        {loading ? (
          <p className="text-gray-500">Cargando...</p>
        ) : (
          <DataTable
            columns={['Formato', 'Tamaño', 'Precio/copia', 'Color', 'Estado', 'Acciones']}
            data={servicios}
            renderRow={(item) => (
              <>
                <td className="py-4 px-4 text-sm text-gray-800">{item.name}</td>
                <td className="py-4 px-4 text-sm text-gray-600">{item.widthCm ?? 21.6} × {item.heightCm ?? 27.9} cm</td>
                <td className="py-4 px-4 text-sm text-gray-600">${Number(item.pricePerCopy).toFixed(2)}</td>
                <td className="py-4 px-4 text-sm text-gray-600">{item.allowsColor ? `Sí (+$${Number(item.colorSurcharge || 0).toFixed(2)})` : 'No'}</td>
                <td className={`py-4 px-4 text-sm font-medium ${item.isActive ? 'text-green-500' : 'text-red-500'}`}>{item.isActive ? 'Activo' : 'Inactivo'}</td>
                <td className="py-4 px-4 text-sm">
                  <TableActions onEdit={() => abrirEditar(item)} onDelete={() => { setToDelete(item); setConfirmOpen(true); }} />
                </td>
              </>
            )}
          />
        )}
      </div>

      {/* Modal crear/editar */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40" onClick={() => setModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col overflow-hidden relative z-10">
              <div className="bg-[#9C6026] text-white p-5"><h2 className="text-2xl font-bold text-center">{editId ? 'Editar formato' : 'Nuevo formato'}</h2></div>
              <form onSubmit={guardar} className="p-6 bg-[#FAF9F6] space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nombre del formato</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-[#9C6026]" placeholder="Ej. Carta, A4, Póster, DUI" />
                </div>
                {/* Medidas de la plantilla: definen la hoja del editor del cliente */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Tamaño de la plantilla (cm)</label>
                  <div className="flex items-center gap-2">
                    <input type="number" min="1" step="0.1" value={form.widthCm} onChange={(e) => setForm({ ...form, widthCm: e.target.value })}
                      className="w-28 bg-white border border-gray-300 rounded-full px-4 py-2 text-sm text-center focus:outline-none focus:border-[#9C6026]" placeholder="Ancho" />
                    <span className="text-gray-500">×</span>
                    <input type="number" min="1" step="0.1" value={form.heightCm} onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
                      className="w-28 bg-white border border-gray-300 rounded-full px-4 py-2 text-sm text-center focus:outline-none focus:border-[#9C6026]" placeholder="Alto" />
                    <span className="text-xs text-gray-400">cm</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Ej. DUI 8.5 × 5.4 · Carta 21.6 × 27.9 · A4 21 × 29.7</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Precio por copia ($)</label>
                  <input type="number" min="0" step="0.01" value={form.pricePerCopy} onChange={(e) => setForm({ ...form, pricePerCopy: e.target.value })} className={inputSm} placeholder="0.00" />
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={form.allowsColor} onChange={(e) => setForm({ ...form, allowsColor: e.target.checked })} /> Permite color
                </label>
                {form.allowsColor && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Recargo por color ($/copia)</label>
                    <input type="number" min="0" step="0.01" value={form.colorSurcharge} onChange={(e) => setForm({ ...form, colorSurcharge: e.target.value })} className={inputSm} placeholder="0.00" />
                  </div>
                )}
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Activo
                </label>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setModalOpen(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium px-6 py-2 rounded-full">Cancelar</button>
                  <button type="submit" className="bg-[#B47C4D] hover:bg-[#9C6026] text-white font-medium px-8 py-2 rounded-full">Guardar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <GenericConfirmModal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={eliminar} data={toDelete} actionType="delete" entityName="Formato" />
    </div>
  );
};

export default ServiciosImpresion;
