import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useForm } from 'react-hook-form';

// Datos con la MISMA forma que manda el backend:
// - las categorias vienen crudas (moduleId string)
// - el producto viene populado (typeId/moduleId como objetos)
const modules = [
  { _id: 'mod1', name: 'Tienda', isActive: true },
  { _id: 'mod2', name: 'Impresiones', isActive: true },
];

const categories = [
  { _id: 'cat1', type: 'Bebidas', moduleId: 'mod1' },
  { _id: 'cat2', type: 'Snacks', moduleId: 'mod1' },
  { _id: 'cat3', type: 'Lacteos', moduleId: 'mod1' },
  { _id: 'cat4', type: 'Limpieza', moduleId: 'mod1' },
  { _id: 'cat5', type: 'Papeleria', moduleId: 'mod2' },
];

const suppliers = [{ _id: 'sup1', name: 'Distribuidora', brandIds: ['br1'] }];
const brands = [{ _id: 'br1', name: 'Marca X' }];

const producto = {
  _id: 'p1',
  name: 'Queso',
  typeId: { _id: 'cat3', type: 'Lacteos' },
  moduleId: { _id: 'mod1', name: 'Tienda' },
  supplierId: { _id: 'sup1', name: 'Distribuidora' },
  brandId: { _id: 'br1', name: 'Marca X' },
  salePrice: 2, priceCost: 1, stock: 5, description: 'x',
};

// Copia fiel de la parte relevante de ProductFormModal
const Modal = ({ isOpen, product }) => {
  const { register, reset, setValue, watch, handleSubmit, formState: { errors } } = useForm();

  const watchModuleId = watch('moduleId');
  const watchTypeId = watch('typeId');
  const watchSupplierId = watch('supplierId');

  const filteredCategories = categories.filter((c) => {
    const catModuleId = typeof c.moduleId === 'object' ? c.moduleId?._id : c.moduleId;
    return catModuleId === watchModuleId;
  });

  const selectedCategoryObj = categories.find((c) => c._id === watchTypeId);
  const filteredSuppliers = (selectedCategoryObj?.supplierIds && selectedCategoryObj.supplierIds.length > 0)
    ? suppliers.filter((s) => selectedCategoryObj.supplierIds.includes(s._id))
    : suppliers;

  const selectedSupplierObj = suppliers.find((s) => s._id === watchSupplierId);
  const filteredBrands = (selectedSupplierObj?.brandIds && selectedSupplierObj.brandIds.length > 0)
    ? brands.filter((b) => selectedSupplierObj.brandIds.includes(b._id))
    : brands;

  const isEditing = !!product;

  useEffect(() => {
    if (isOpen) {
      if (product) {
        reset({
          brandId: product.brandId?._id || product.brandId || '',
          name: product.name,
          supplierId: product.supplierId?._id || product.supplierId || '',
          typeId: product.typeId?._id || product.typeId || '',
          moduleId: product.moduleId?._id || product.moduleId || '',
        });
      } else {
        reset({ brandId: '', name: '', supplierId: '', typeId: '', moduleId: '' });
      }
    }
  }, [isOpen, product, reset]);

  useEffect(() => {
    if (isOpen && !isEditing) {
      setValue('typeId', '');
      setValue('supplierId', '');
      setValue('brandId', '');
    }
  }, [watchModuleId, isOpen, isEditing, setValue]);

  if (!isOpen) return null;

  return (
    <form id="f" onSubmit={handleSubmit(() => { window.__resultado = 'GUARDADO OK'; },
                                        (e) => { window.__resultado = 'BLOQUEADO: ' + Object.keys(e).join(','); })}>
      <input type="hidden" {...register('moduleId', { required: true })} />

      <label>Categoria (Tipo)</label>
      <select id="sel-tipo" {...register('typeId', { required: true })} disabled={!watchModuleId}>
        <option value="">Seleccionar...</option>
        {filteredCategories.map((c, i) => (
          <option key={c._id || i} value={c._id || c}>{c.type || c}</option>
        ))}
      </select>

      <label>Proveedor</label>
      <select id="sel-prov" {...register('supplierId', { required: true })} disabled={!watchModuleId}>
        <option value="">Seleccionar...</option>
        {filteredSuppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
      </select>

      <label>Marca</label>
      <select id="sel-marca" {...register('brandId', { required: true })} disabled={!watchSupplierId}>
        <option value="">Seleccionar...</option>
        {filteredBrands.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
      </select>

      <button type="submit">Guardar</button>
      <pre id="errores">{Object.keys(errors).join(',')}</pre>
    </form>
  );
};

const App = () => {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(null);
  return (
    <div>
      <button id="btn-editar" onClick={() => { setCurrent(producto); setOpen(true); }}>Editar</button>
      <button id="btn-cerrar" onClick={() => setOpen(false)}>Cerrar</button>
      <Modal isOpen={open} product={current} />
    </div>
  );
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
