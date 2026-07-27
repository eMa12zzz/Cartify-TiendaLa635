import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Sparkles, Palette } from 'lucide-react';
import { productService } from '../../api/productService';
import { validarPromocion, avisoVentaBajoCosto, bloquearTeclasNumero } from '../../utils/validaciones';
import { etiquetaPromo } from '../../utils/promos';
import { usePromoAI } from '../../hooks/usePromoAI';
import PromoCard from '../Store/PromoCard';
import { TEMAS } from '../../utils/temasPromo';

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
  const [form, setForm] = useState({ title: '', promoDescription: '', isActive: true, showBanner: true });
  const [type, setType] = useState('descuento');
  const [items, setItems] = useState([]); // [{ productId, name, discount, fixedPrice }]
  const [buyQty, setBuyQty] = useState(2);
  const [payQty, setPayQty] = useState(1);
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [imagen, setImagen] = useState(null);
  const [preview, setPreview] = useState(null);
  const [guardando, setGuardando] = useState(false);
  // Diseño del banner (reemplaza al canvas que armaba la IA).
  const [tema, setTema] = useState('cafe');
  const [colorFondo, setColorFondo] = useState('#B46C30');
  const [colorTexto, setColorTexto] = useState('#FFFFFF');
  const [colorAcento, setColorAcento] = useState('#F3E7D8');
  const { generando, generarPromo } = usePromoAI();

  useEffect(() => {
    if (!isOpen) return;
    productService.getProducts()
      .then((d) => setProductos(Array.isArray(d) ? d.filter((p) => p.isActive !== false) : []))
      .catch(() => {});

    if (promoData) {
      setForm({
        title: promoData.title || '',
        promoDescription: promoData.promoDescription || '',
        isActive: promoData.isActive !== false,
        showBanner: promoData.showBanner !== false,
      });
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
      setTema(promoData.tema || 'cafe');
      setColorFondo(promoData.colorFondo || '#B46C30');
      setColorTexto(promoData.colorTexto || '#FFFFFF');
      setColorAcento(promoData.colorAcento || '#F3E7D8');
    } else {
      setForm({ title: '', promoDescription: '', isActive: true, showBanner: true });
      setType('descuento');
      setBuyQty(2); setPayQty(1);
      setItems([]);
      setPreview(null);
      setTema('cafe');
      setColorFondo('#B46C30');
      setColorTexto('#FFFFFF');
      setColorAcento('#F3E7D8');
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

  /*
   * La IA solo escribe el TEXTO. El banner se diseña acá con los colores, así
   * que se puede seguir ajustando después sin regenerar nada.
   */
  const onGenerarIA = async () => {
    const resultado = await generarPromo({ tipo: type, items, buyQty, payQty });
    if (!resultado) return;

    setForm((prev) => ({
      ...prev,
      title: resultado.title || prev.title,
      promoDescription: resultado.promoDescription || prev.promoDescription,
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.promoDescription.trim()) { toast.error('La descripción es requerida'); return; }

    // Reglas del negocio según el tipo (descuentos 0-100, precio de oferta menor
    // al normal, y que en un NxM se pague menos de lo que se lleva).
    const precios = Object.fromEntries(productos.map((p) => [p._id, Number(p.salePrice) || 0]));
    const error = validarPromocion({ tipo: type, items, buyQty, payQty, precios });
    if (error) { toast.error(error); return; }

    /*
     * Aviso (no bloqueo) si la promo vende por debajo del costo. Un producto
     * gancho a pérdida puede ser intencional, pero tiene que ser una decisión:
     * un 50% sobre algo con 40% de margen pierde plata en cada venta.
     */
    const costos = Object.fromEntries(productos.map((p) => [p._id, Number(p.priceCost) || 0]));
    const aviso = avisoVentaBajoCosto({ tipo: type, items, buyQty, payQty, costos, precios });
    if (aviso) {
      toast(aviso, { icon: '⚠️', duration: 7000, style: { maxWidth: 460 } });
    }

    /*
     * Ya no se exige imagen: la tarjeta se dibuja con el texto y los colores.
     * Lo que sí hace falta para anunciarla es un título — sin él el banner
     * saldría con el texto de relleno.
     */
    if (form.showBanner && !form.title.trim()) {
      toast.error('Ponle un título a la promoción, o desmarca "Anunciar en la tienda"');
      return;
    }

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
    fd.append('showBanner', form.showBanner);
    fd.append('buyQty', buyQty);
    fd.append('payQty', payQty);
    fd.append('items', JSON.stringify(itemsPayload));
    // Diseño del banner (solo se usa si no hay imagen propia).
    fd.append('tema', tema);
    if (tema === 'personalizado') {
      fd.append('colorFondo', colorFondo);
      fd.append('colorTexto', colorTexto);
      fd.append('colorAcento', colorAcento);
    }
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
                    <input type="number" min="2" step="1" value={buyQty} onKeyDown={bloquearTeclasNumero} onChange={(e) => setBuyQty(e.target.value)} className="w-16 bg-white border border-gray-300 rounded-full px-3 py-1.5 text-center focus:outline-none focus:border-[#9C6026]" />
                    <span className="font-bold">paga</span>
                    <input type="number" min="1" step="1" value={payQty} onKeyDown={bloquearTeclasNumero} onChange={(e) => setPayQty(e.target.value)} className="w-16 bg-white border border-gray-300 rounded-full px-3 py-1.5 text-center focus:outline-none focus:border-[#9C6026]" />
                  </div>
                )}

                {/* Ayudante de IA: escribe el texto y arma el banner solito */}
                <div className="rounded-xl border border-[#E4D5C3] bg-[#FBF6F0] p-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={onGenerarIA}
                      disabled={generando || items.length === 0}
                      className="hover-scale press flex items-center gap-2 bg-[#9C6026] hover:bg-[#6B4423] text-white text-sm font-medium px-4 py-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Sparkles size={16} />
                      {generando ? 'Generando…' : 'Generar con IA'}
                    </button>
                    <p className="text-xs text-gray-600 flex-1">
                      {items.length === 0
                        ? 'Agrega los productos más abajo y la IA escribe el anuncio por vos.'
                        : `Redacta el texto y arma el banner con ${items.length === 1 ? 'el producto' : 'los productos'} que elegiste.`}
                    </p>
                  </div>
                </div>

                {/* Banner: se diseña acá mismo, con vista previa en vivo */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Banner — así se verá en la tienda
                  </label>

                  {/* Misma pieza que usa el carrusel del cliente: lo que se ve
                      aquí es exactamente lo que va a ver la gente. */}
                  <PromoCard
                    promo={{ tema, colorFondo, colorTexto, colorAcento }}
                    imagen={preview}
                    title={form.title}
                    descripcion={form.promoDescription}
                    etiqueta={etiquetaPromo({ type, items, buyQty, payQty })}
                  />

                  {/* Los colores solo aplican si NO hay imagen propia */}
                  {!preview && (
                    <div className="mt-3">
                      <span className="block text-xs font-bold text-gray-600 mb-2">Colores</span>
                      <div className="flex flex-wrap gap-2">
                        {TEMAS.map((t) => (
                          <button
                            type="button"
                            key={t.id}
                            onClick={() => setTema(t.id)}
                            title={t.nombre}
                            aria-label={`Tema ${t.nombre}`}
                            aria-pressed={tema === t.id}
                            className="press flex items-center gap-2 pr-3 pl-1.5 py-1.5 rounded-full border transition-colors"
                            style={{
                              borderColor: tema === t.id ? '#9C6026' : '#e5e5e5',
                              background: tema === t.id ? '#FBF6F0' : '#fff',
                            }}
                          >
                            <span
                              className="w-5 h-5 rounded-full border border-black/10"
                              style={{ background: t.muestra }}
                            />
                            <span className="text-xs font-medium text-gray-700">{t.nombre}</span>
                          </button>
                        ))}

                        <button
                          type="button"
                          onClick={() => setTema('personalizado')}
                          aria-pressed={tema === 'personalizado'}
                          className="press flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors"
                          style={{
                            borderColor: tema === 'personalizado' ? '#9C6026' : '#e5e5e5',
                            background: tema === 'personalizado' ? '#FBF6F0' : '#fff',
                          }}
                        >
                          <Palette size={14} className="text-gray-500" />
                          <span className="text-xs font-medium text-gray-700">Personalizado</span>
                        </button>
                      </div>

                      {tema === 'personalizado' && (
                        <div className="flex flex-wrap gap-4 mt-3 bg-white border border-gray-200 rounded-xl p-3">
                          {[
                            { l: 'Fondo', v: colorFondo, set: setColorFondo },
                            { l: 'Texto', v: colorTexto, set: setColorTexto },
                            { l: 'Etiqueta', v: colorAcento, set: setColorAcento },
                          ].map((c) => (
                            <label key={c.l} className="flex items-center gap-2 text-xs text-gray-600">
                              <input
                                type="color"
                                value={c.v}
                                onChange={(e) => c.set(e.target.value)}
                                className="w-8 h-8 rounded cursor-pointer border border-gray-200"
                              />
                              {c.l}
                            </label>
                          ))}
                          <p className="text-xs text-gray-400 w-full">
                            Ojo con el contraste: si el fondo es claro, el texto tiene que ser oscuro.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-3 mt-3">
                    <input type="file" accept="image/*" onChange={onImagen} className="text-sm text-gray-700 flex-1" />
                    {preview && (
                      <button
                        type="button"
                        onClick={() => { setImagen(null); setPreview(null); }}
                        className="press text-xs text-gray-500 hover:text-red-500 whitespace-nowrap"
                      >
                        Quitar imagen
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {preview
                      ? 'Con imagen propia el texto no se encima, para no duplicar lo que la imagen ya trae. Lo ideal es 1200 × 480.'
                      : 'No hace falta subir imagen: la tarjeta se arma con el texto y los colores que elija.'}
                  </p>
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
                              <input type="number" min="0" max="100" value={it.discount} onKeyDown={bloquearTeclasNumero} onChange={(e) => updateItem(it.productId, 'discount', e.target.value)}
                                className="w-16 bg-white border border-gray-300 rounded-full px-2 py-1 text-sm text-center focus:outline-none focus:border-[#9C6026]" />
                              <span className="text-xs text-gray-500">%</span>
                            </div>
                          )}
                          {type === 'precio_fijo' && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">$</span>
                              <input type="number" min="0" step="0.01" value={it.fixedPrice} onKeyDown={bloquearTeclasNumero} onChange={(e) => updateItem(it.productId, 'fixedPrice', e.target.value)}
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

                <div className="pt-1 space-y-2">
                  <label className="flex items-center cursor-pointer">
                    <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="mr-2" />
                    <span className="text-sm font-medium text-gray-700">Activa (el descuento se aplica)</span>
                  </label>

                  {/* Promo silenciosa: aplica el descuento pero sin anunciarlo */}
                  <label className="flex items-start cursor-pointer">
                    <input type="checkbox" checked={form.showBanner} onChange={(e) => setForm({ ...form, showBanner: e.target.checked })} className="mr-2 mt-1" />
                    <span className="text-sm font-medium text-gray-700">
                      Anunciar en la tienda con banner
                      <span className="block text-xs font-normal text-gray-500">
                        Si lo desmarcas, el descuento se aplica igual pero no aparece en el carrusel.
                      </span>
                    </span>
                  </label>
                </div>
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
