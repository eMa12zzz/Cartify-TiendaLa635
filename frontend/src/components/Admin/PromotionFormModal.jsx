import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { productService } from '../../api/productService';

/*
 * PromotionFormModal — crear/editar una promoción (multi-tipo).
 *   - descuento    : cada producto con su %.
 *   - precio_fijo  : cada producto con un precio de oferta.
 *   - nxm          : compra N, paga M sobre los productos.
 * Los productos se agregan con buscador (sin bajar por toda la lista).
 */
const TIPOS = [
  { v: 'descuento', l: 'Descuento %' },
  { v: 'precio_fijo', l: 'Precio fijo' },
  { v: 'nxm', l: 'NxM (2x1)' },
];

const PromotionFormModal = ({ isOpen, onClose, promoData, onSave }) => {
  const isEditing = !!promoData;
  const [form, setForm] = useState({ title: '', promoDescription: '', isActive: true });
  const [type, setType] = useState('descuento');
  const [items, setItems] = useState([]); // [{ productId, name, discount, fixedPrice }]
  const [buyQty, setBuyQty] = useState(2);
  const [payQty, setPayQty] = useState(1);
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [imagen, setImagen] = useState(null);
  const [preview, setPreview] = useState(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    productService.getProducts()
      .then((d) => setProductos(Array.isArray(d) ? d.filter((p) => p.isActive !== false) : []))
      .catch(() => {});

    if (promoData) {
      setForm({ title: promoData.title || '', promoDescription: promoData.promoDescription || '', isActive: promoData.isActive !== false });
      setType(promoData.type || 'descuento');
      setBuyQty(promoData.buyQty || 2);
      setPayQty(promoData.payQty || 1);
      setItems((promoData.items || []).map((it) => ({
        productId: typeof it.productId === 'object' ? it.productId?._id : it.productId,
        name: typeof it.productId === 'object' ? it.productId?.name : 'Producto',
        discount: it.discount ?? 0,
        fixedPrice: it.fixedPrice ?? '',
      })));
      setPreview(promoData.image || null);
    } else {
      setForm({ title: '', promoDescription: '', isActive: true });
      setType('descuento');
      setBuyQty(2); setPayQty(1);
      setItems([]);
      setPreview(null);
    }
    setImagen(null);
    setBusqueda('');
  }, [isOpen, promoData]);

  const onImagen = (e) => {
    const file = e.target.files?.[0];
    if (file) { setImagen(file); setPreview(URL.createObjectURL(file)); }
  };

  const addProducto = (p) => {
    if (items.some((it) => it.productId === p._id)) return;
    setItems([...items, { productId: p._id, name: p.name, discount: 0, fixedPrice: p.salePrice ?? 0 }]);
    setBusqueda('');
  };
  const removeItem = (id) => setItems(items.filter((it) => it.productId !== id));
  const updateItem = (id, field, value) => setItems(items.map((it) => (it.productId === id ? { ...it, [field]: value } : it)));

  const disponibles = productos.filter(
    (p) => !items.some((it) => it.productId === p._id) &&
      (p.name || '').toLowerCase().includes(busqueda.toLowerCase().trim())
  );

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.promoDescription.trim()) { toast.error('La descripción es requerida'); return; }
    if (items.length === 0) { toast.error('Agrega al menos un producto'); return; }
    if (!isEditing && !imagen) { toast.error('Sube una imagen para el banner'); return; }

    const itemsPayload = items.map((it) => ({
      productId: it.productId,
      discount: Number(it.discount) || 0,
      fixedPrice: it.fixedPrice === '' || it.fixedPrice === null ? undefined : Number(it.fixedPrice),
    }));

    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('promoDescription', form.promoDescription);
    fd.append('type', type);
    fd.append('isActive', form.isActive);
    fd.append('buyQty', buyQty);
    fd.append('payQty', payQty);
    fd.append('items', JSON.stringify(itemsPayload));
    if (imagen) fd.append('image', imagen);

    setGuardando(true);
    try {
      await onSave(fd, promoData?._id);
    } finally {
      setGuardando(false);
    }
  };

  const inputCls = 'w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-full px-4 py-2 focus:outline-none focus:border-[#9C6026]';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col overflow-hidden relative z-10 max-h-[92vh]"
          >
            <div className="bg-[#9C6026] text-white p-5">
              <h2 className="text-2xl font-bold text-center">{isEditing ? 'Editar Promoción' : 'Nueva Promoción'}</h2>
            </div>

            <div className="p-6 bg-[#FAF9F6] flex-1 overflow-y-auto">
              <form id="promo-form" onSubmit={onSubmit} className="space-y-4">
                {/* Tipo */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Tipo de promoción</label>
                  <div className="flex flex-wrap gap-2">
                    {TIPOS.map((t) => (
                      <button type="button" key={t.v} onClick={() => setType(t.v)}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${type === t.v ? 'bg-[#B47C4D] text-white border-[#B47C4D]' : 'bg-white text-gray-600 border-gray-300'}`}>
                        {t.l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* NxM */}
                {type === 'nxm' && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="font-bold">Compra</span>
                    <input type="number" min="1" value={buyQty} onChange={(e) => setBuyQty(e.target.value)} className="w-16 bg-white border border-gray-300 rounded-full px-3 py-1.5 text-center focus:outline-none focus:border-[#9C6026]" />
                    <span className="font-bold">paga</span>
                    <input type="number" min="1" value={payQty} onChange={(e) => setPayQty(e.target.value)} className="w-16 bg-white border border-gray-300 rounded-full px-3 py-1.5 text-center focus:outline-none focus:border-[#9C6026]" />
                  </div>
                )}

                {/* Banner */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Banner (imagen)</label>
                  <div className="flex items-center gap-4">
                    <div className="w-28 h-20 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center flex-none">
                      {preview ? <img src={preview} alt="banner" className="w-full h-full object-cover" /> : <span className="text-gray-400 text-xs">Sin imagen</span>}
                    </div>
                    <input type="file" accept="image/*" onChange={onImagen} className="text-sm text-gray-700" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Título (opcional)</label>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} placeholder="Ej. Fin de semana dulce" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Descripción</label>
                  <textarea value={form.promoDescription} onChange={(e) => setForm({ ...form, promoDescription: e.target.value })} rows={2}
                    className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#9C6026] resize-none"
                    placeholder="Ej. Promo de quesos seleccionados" />
                </div>

                {/* Productos */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-gray-700">Productos ({items.length})</label>
                  </div>
                  {/* Buscador para agregar */}
                  <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar producto para agregar..." className={`${inputCls} mb-2`} />
                  {busqueda.trim() && (
                    <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg bg-white mb-2">
                      {disponibles.length === 0 ? (
                        <p className="text-xs text-gray-400 p-2">Sin resultados.</p>
                      ) : (
                        disponibles.map((p) => (
                          <button type="button" key={p._id} onClick={() => addProducto(p)}
                            className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between">
                            <span>{p.name}</span>
                            <span className="text-xs text-[#B47C4D] font-medium">+ Agregar</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  {/* Lista de productos agregados */}
                  <div className="border border-gray-200 rounded-lg bg-white p-2 space-y-1">
                    {items.length === 0 ? (
                      <p className="text-xs text-gray-400 py-2">Aún no agregas productos. Búscalos arriba.</p>
                    ) : (
                      items.map((it) => (
                        <div key={it.productId} className="flex items-center gap-2 py-1">
                          <span className="flex-1 text-sm text-gray-700 truncate">{it.name}</span>
                          {type === 'descuento' && (
                            <div className="flex items-center gap-1">
                              <input type="number" min="0" max="100" value={it.discount} onChange={(e) => updateItem(it.productId, 'discount', e.target.value)}
                                className="w-16 bg-white border border-gray-300 rounded-full px-2 py-1 text-sm text-center focus:outline-none focus:border-[#9C6026]" />
                              <span className="text-xs text-gray-500">%</span>
                            </div>
                          )}
                          {type === 'precio_fijo' && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">$</span>
                              <input type="number" min="0" step="0.01" value={it.fixedPrice} onChange={(e) => updateItem(it.productId, 'fixedPrice', e.target.value)}
                                className="w-20 bg-white border border-gray-300 rounded-full px-2 py-1 text-sm text-center focus:outline-none focus:border-[#9C6026]" />
                            </div>
                          )}
                          <button type="button" onClick={() => removeItem(it.productId)} className="text-red-500 text-sm px-1" aria-label="Quitar">✕</button>
                        </div>
                      ))
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Al hacer click en el banner, la tienda mostrará estos productos con su promo.</p>
                </div>

                <label className="flex items-center cursor-pointer pt-1">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="mr-2" />
                  <span className="text-sm font-medium text-gray-700">Activa (se muestra en la tienda)</span>
                </label>
              </form>
            </div>

            <div className="p-4 bg-[#FAF9F6] border-t border-gray-100 flex justify-end gap-3">
              <button type="button" onClick={onClose} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium px-6 py-2 rounded-full transition-colors">Cancelar</button>
              <button form="promo-form" type="submit" disabled={guardando} className="bg-[#B47C4D] hover:bg-[#9C6026] text-white font-medium px-8 py-2 rounded-full transition-colors disabled:opacity-60">
                {guardando ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PromotionFormModal;
