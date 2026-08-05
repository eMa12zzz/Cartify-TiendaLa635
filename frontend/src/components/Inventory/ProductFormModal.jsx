import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { modalTransition } from '../../utils/motion';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import SubidorArchivo from '../UI/SubidorArchivo';
import { reglaPrecio, reglaEntero, reglaCodigoBarras, bloquearTeclasNumero, bloquearNoDigitos } from '../../utils/validaciones';
import { flujoDeModulo, iconoDeModulo, modulosVisibles } from '../../utils/modulos';
import { UNIDADES, etiquetaPiezas } from '../../utils/unidades';
import toast from 'react-hot-toast';

/*
 * Lo que el producto YA tiene nunca se cae de su desplegable.
 *
 * Las listas van en cascada (proveedores de la categoría, marcas del
 * proveedor), y un producto viejo puede haber quedado fuera de esa
 * combinación: si su opción no está entre los <option>, el navegador deja el
 * campo vacío —un <select> no puede quedarse en un valor que no existe— y el
 * formulario termina diciendo que falta llenar algo que en realidad ya estaba.
 * Se agrega al final para que se vea que es la de antes, no una del filtro.
 */
const conElActual = (lista, completa, valorActual) => {
  const id = valorActual?._id || valorActual;
  if (!id || lista.some((x) => x._id === id)) return lista;
  const actual = completa.find((x) => x._id === id) || (typeof valorActual === 'object' ? valorActual : null);
  return actual ? [...lista, actual] : lista;
};

const ProductFormModal = ({ isOpen, onClose, product, onSave, onDelete, brands = [], suppliers = [], categories = [], modules = [] }) => {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();
  const [selectedImage, setSelectedImage] = useState(null);

  /*
   * "Más opciones" — lo que casi nunca se toca.
   *
   * El formulario pedía doce campos de una sentada y no cabía en la pantalla.
   * Pero de esos doce, seis son los que de verdad hacen falta para poner algo
   * a la venta; los otros —código de barras, vencimiento, piezas, +18— se
   * llenan de vez en cuando. Pedirlos todos con el mismo peso hace que cargar
   * un producto se sienta un trámite, y el trámite se pospone.
   */
  const [masOpciones, setMasOpciones] = useState(false);


  // 1- Observamos los campos clave para filtrado en cascada
  const watchModuleId = watch('moduleId');
  const watchTypeId = watch('typeId');
  const watchSupplierId = watch('supplierId');
  const watchIsActive = watch('isActive');

  /*
   * Cómo se vende: por pieza o por peso. Es la respuesta que cambia el
   * significado del precio y del stock, así que se observa para que las
   * etiquetas de esos dos campos digan la verdad mientras se llena el
   * formulario, y no después. Ver utils/unidades.js.
   */
  const watchUnidad = watch('unidadVenta') || 'unidad';
  const unidad = UNIDADES.find((u) => u.clave === watchUnidad) || UNIDADES[0];
  const porLibra = unidad.clave === 'libra';
  // El campo "piezas" cambia de nombre y de sentido según la unidad.
  const textoPiezas = etiquetaPiezas(unidad.clave);

  const isEditing = !!product;

  /*
   * El pasillo del que cuelga todo lo demás, sin esperar al watch.
   *
   * Al editar, el reset() llena el formulario desde un efecto, pero el primer
   * render pasa ANTES: ahí el watch todavía viene vacío y el desplegable de
   * categorías se pintaba sin la opción del producto. Cuando react-hook-form
   * le escribe el valor al <select>, esa opción todavía no existe, el
   * navegador lo deja en "Seleccionar..." —y no lo vuelve a intentar—, así que
   * al guardar se leía el campo vacío y saltaba el aviso de campos
   * obligatorios sobre una categoría que el producto SÍ tenía.
   *
   * Arrancando del producto, la opción ya está puesta cuando le toca el valor.
   */
  const idGuardado = (valor) => valor?._id || valor || '';
  const moduleOriginal = idGuardado(product?.moduleId);
  const typeOriginal = idGuardado(product?.typeId);
  const supplierOriginal = idGuardado(product?.supplierId);

  const moduleIdActivo = watchModuleId || moduleOriginal;

  /*
   * Las reglas dependen del FLUJO del módulo, no de cómo se llame.
   *
   * Antes esto comparaba el nombre con "tienda" e "impresiones": el día que la
   * tienda creara "Panadería", el proveedor dejaba de ser obligatorio sin que
   * nadie lo hubiera decidido, y nadie se iba a enterar hasta encontrar panes
   * sin proveedor en el inventario.
   */
  const selectedModuleObj = modules.find(m => m._id === moduleIdActivo);
  const isPrintModule = selectedModuleObj ? flujoDeModulo(selectedModuleObj) === 'impresiones' : false;
  const isStoreModule = selectedModuleObj ? !isPrintModule : false;

  // Solo los pasillos que la tienda tiene encendidos.
  const modulosActivos = modulosVisibles(modules);

  const categoriasDelModulo = categories.filter(c => {
    const catModuleId = typeof c.moduleId === 'object' ? c.moduleId?._id : c.moduleId;
    return catModuleId === moduleIdActivo;
  });
  /*
   * Lo que ya tenía se conserva SOLO mientras no cambie el de arriba: si el
   * empleado mueve el producto a otro pasillo, la categoría vieja no tiene
   * por qué seguir en la lista.
   */
  const filteredCategories = isEditing && moduleIdActivo === moduleOriginal
    ? conElActual(categoriasDelModulo, categories, product.typeId)
    : categoriasDelModulo;

  // Filtrar Proveedores por la Categoría seleccionada
  const selectedCategoryObj = categories.find(c => c._id === watchTypeId);
  const proveedoresDeLaCategoria = (selectedCategoryObj?.supplierIds && selectedCategoryObj.supplierIds.length > 0)
    ? suppliers.filter(s => selectedCategoryObj.supplierIds.includes(s._id))
    : suppliers;
  const filteredSuppliers = isEditing && watchTypeId === typeOriginal
    ? conElActual(proveedoresDeLaCategoria, suppliers, product.supplierId)
    : proveedoresDeLaCategoria;


  // 2- Marca (Brand) filtrada por Proveedor (Supplier)
  const selectedSupplierObj = suppliers.find(s => s._id === watchSupplierId);
  const marcasDelProveedor = (selectedSupplierObj?.brandIds && selectedSupplierObj.brandIds.length > 0)
    ? brands.filter(b => selectedSupplierObj.brandIds.includes(b._id))
    : brands;
  const filteredBrands = isEditing && watchSupplierId === supplierOriginal
    ? conElActual(marcasDelProveedor, brands, product.brandId)
    : marcasDelProveedor;

  /*
   * La imagen que ya tiene el producto, para que al editar se vea la actual.
   * El Array.isArray no es paranoia: image llega como arreglo casi siempre,
   * pero hay productos viejos con la URL suelta, y ahí image[0] devolvía la
   * primera LETRA del enlace.
   */
  const imagenGuardada = Array.isArray(product?.image)
    ? (product.image[0] || null)
    : (product?.image || null);

  // 3- Efecto para rellenar datos si es edición, o limpiar si es creación
  useEffect(() => {
    if (isOpen) {
      if (product) {
        reset({
          brandId: product.brandId?._id || product.brandId || '',
          name: product.name,
          priceCost: product.priceCost,
          salePrice: product.salePrice,
          supplierId: product.supplierId?._id || product.supplierId || '',
          typeId: product.typeId?._id || product.typeId || '',
          moduleId: product.moduleId?._id || product.moduleId || '',
          description: product.description,
          expirationDate: product.expirationDate ? new Date(product.expirationDate).toISOString().split('T')[0] : '',
          stock: product.stock,
          barCode: product.barCode || '',
          // Los productos cargados antes de que esto existiera no traen el
          // campo: son por unidad, que es como se han estado vendiendo.
          unidadVenta: product.unidadVenta === 'libra' ? 'libra' : 'unidad',
          piezas: product.piezas ?? '',
          soloAdultos: !!product.soloAdultos,
          isActive: product.isActive !== false
        });
        setSelectedImage(null);
      } else {
        reset({
          brandId: '',
          name: '',
          priceCost: '',
          salePrice: '',
          supplierId: '',
          typeId: '',
          moduleId: '',
          description: '',
          expirationDate: '',
          stock: 0,
          barCode: '',
          unidadVenta: 'unidad',
          piezas: '',
          soloAdultos: false,
          isActive: true
        });
        setSelectedImage(null);
      }
    }
  }, [isOpen, product, reset]);

  // 4- Efectos para limpiar campos dependientes (Categorías, Proveedores, Marcas) cuando el padre cambia
  useEffect(() => {
    if (isOpen && !isEditing) {
      setValue('typeId', '');
      setValue('supplierId', '');
      setValue('brandId', '');
    }
  }, [watchModuleId, isOpen, isEditing, setValue]);

  useEffect(() => {
    if (isOpen && !isEditing) {
      setValue('brandId', '');
    }
  }, [watchSupplierId, isOpen, isEditing, setValue]);

  /*
   * Con un solo pasillo no hay nada que elegir: se marca solo. Obligar a
   * clickear la única opción posible es pedirle al empleado que confirme algo
   * que no puede ser de otra manera.
   */
  useEffect(() => {
    if (!isOpen || isEditing || watchModuleId) return;
    const activos = modulosVisibles(modules);
    if (activos.length === 1) setValue('moduleId', activos[0]._id);
  }, [isOpen, isEditing, watchModuleId, modules, setValue]);

  if (!isOpen) return null;

  // 5- Manejar el cambio de la imagen del producto
  // La preview y el manejo del blob viven en SubidorArchivo; acá solo queda el
  // archivo que se va a mandar en el FormData.
  const handleImageChange = (file) => setSelectedImage(file);

  // 6- Validar y empaquetar los datos para enviarlos al backend (FormData)
  const onSubmit = (data) => {
    if (!isEditing && !selectedImage) {
      toast.error('La imagen es obligatoria para un producto nuevo');
      return;
    }

    /*
     * Código de barras: si lo dejaron vacío, se genera.
     *
     * El backend lo exige, pero media tienda no tiene código impreso —las
     * frutas, las verduras, el queso a granel— y obligar a inventarse uno a
     * mano era una pared para justo los productos que ahora se venden por
     * libra. Se genera uno interno, que es exactamente lo que hacía el botón
     * "Generar" con un clic de por medio.
     */
    if (!String(data.barCode || '').trim()) {
      data.barCode = Math.floor(1000000000000 + Math.random() * 9000000000000).toString();
    }

    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('brandId', data.brandId);
    formData.append('priceCost', data.priceCost);
    formData.append('salePrice', data.salePrice);
    formData.append('supplierId', data.supplierId);
    formData.append('typeId', data.typeId);
    formData.append('moduleId', data.moduleId);
    formData.append('description', data.description);
    formData.append('expirationDate', data.expirationDate);
    formData.append('stock', data.stock);
    formData.append('barCode', data.barCode);
    formData.append('unidadVenta', data.unidadVenta || 'unidad');
    formData.append('piezas', data.piezas ?? '');
    formData.append('soloAdultos', data.soloAdultos ? 'true' : 'false');
    formData.append('isActive', data.isActive);
    
    if (selectedImage) {
      formData.append('image', selectedImage);
    }

    onSave({ formData, id: product?._id, previewData: data, selectedImage, originalImage: product?.image, originalProduct: product });
  };

  const onError = (errs) => {
    /*
     * Si lo que falló está escondido, se abre solo. Un aviso que señala un
     * campo que no está en pantalla deja a la persona buscando qué corregir.
     */
    if (errs?.barCode || errs?.piezas) setMasOpciones(true);

    // Mensaje concreto de la regla que falló (precio, stock, código de barras...).
    const primero = Object.values(errs || {}).find((e) => e?.message)?.message;
    if (primero) { toast.error(primero, { duration: 4000 }); return; }
    toast.error('Por favor, completa todos los campos obligatorios (Revisa si olvidaste la Marca, Categoría, etc.)', {
      duration: 4000,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
        /*
          Ancho, no alto. Con los campos nuevos el formulario pedía scroll, y
          un formulario que se recorre hacia abajo esconde la mitad de lo que
          hay que llenar: se guarda a medias porque nadie bajó a ver el resto.
          Aprovechando el ancho de la pantalla cabe entero de una sola vista.
        */
        className="bg-white rounded-2xl shadow-xl w-full max-w-4xl flex overflow-hidden relative z-10"
      >
        {/*
          El panel café se estira para igualar el alto del formulario de la
          derecha, y con la imagen a 192px clavados le sobraba media columna de
          rojo vacío debajo del precio.

          En vez de repartir ese hueco (que solo lo disimula), lo ocupa la
          FOTO: es lo único de este panel que gana algo con más espacio, y de
          paso se ve mejor lo que se acaba de subir. Marca y nombre quedan
          arriba, el precio abajo, y la imagen estira lo que haga falta —así se
          acomoda solo al abrir o cerrar "Más opciones".
        */}
        {/*
          Un solo lienzo claro, sin la columna café.

          Ese panel oscuro repartía los campos por color y no por sentido: el
          precio caía del lado café y el stock del lado crema, sin una razón
          que alguien pudiera explicar. Y como los dos lados tenían distinta
          cantidad de campos, uno se estiraba para igualar al otro y sobraba
          fondo — un hueco que no se arreglaba con espaciado porque el problema
          era la división misma.

          Ahora el modal es una sola superficie y la separación es solo una
          línea. La izquierda es la identidad del producto (qué es, cómo se ve,
          cuánto cuesta) y la derecha, cómo se vende.
        */}
        <div className="w-1/3 bg-[#FAF9F6] text-gray-900 p-6 flex flex-col border-r border-gray-200">
          <div className="space-y-4 flex-1 flex flex-col min-h-0">
            <div>
              <label className="block text-xs mb-1 opacity-90">Seleccione la marca</label>
              <select 
                {...register('brandId', { required: true })}
                disabled={!watchSupplierId && isStoreModule}
                className="w-full bg-white text-gray-900 text-sm rounded-md px-3 py-1.5 focus:outline-none disabled:opacity-50"
              >
                <option value="">Seleccionar...</option>
                {filteredBrands.map(b => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs mb-1 opacity-90">Nombre del producto</label>
              <input 
                type="text" 
                {...register('name', { required: true })}
                className="w-full bg-white text-gray-900 text-sm rounded-md px-3 py-1.5 focus:outline-none"
              />
            </div>

            {/*
              "contain": el producto se ve entero, aunque la foto venga cuadrada
              o apaisada. Al editar arranca mostrando la que ya tiene guardada,
              para que no parezca que se perdió.
            */}
            <div className="my-4 flex-1 min-h-0 flex flex-col">
              <SubidorArchivo
                accept="image/*"
                maxMB={8}
                valorInicial={imagenGuardada}
                onArchivo={handleImageChange}
                /* Paleta clara: el panel ya no es café. */
                variante="claro"
                ajuste="contain"
                crecer
                alto={168}
                radio={12}
                titulo="Arrastra la imagen o selecciona de tus archivos"
                ayuda={isEditing ? '' : 'Obligatoria para un producto nuevo'}
                etiquetaAria="Subir la imagen del producto"
              />
            </div>

            {/*
              Etiqueta ARRIBA y no al lado: "Precio x libra ($)" es bastante
              más largo que "Precio ($)", y en línea le comía el ancho al campo
              hasta dejarlo en una rendija. Arriba, el texto crece sin quitarle
              nada al número.
            */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs mb-1">Costo ($)</label>
                <input
                  type="number" step="0.01" min="0"
                  onKeyDown={bloquearTeclasNumero}
                  {...register('priceCost', reglaPrecio('El costo'))}
                  className="w-full bg-white text-gray-900 text-sm rounded-md px-2 py-1 focus:outline-none"
                />
              </div>
              <div className="flex-1">
                {/* La etiqueta dice qué se está cobrando. "$1.25" y "$1.25 la
                    libra" son dos precios distintos aunque el número sea el
                    mismo, y hasta ahora eso solo se aclaraba —cuando se
                    aclaraba— escribiéndolo en la descripción. */}
                <label className="block text-xs mb-1">
                  {porLibra ? 'Precio x libra ($)' : 'Precio ($)'}
                </label>
                <input
                  type="number" step="0.01" min="0"
                  onKeyDown={bloquearTeclasNumero}
                  {...register('salePrice', {
                    ...reglaPrecio('El precio de venta'),
                    // Regla de negocio: nunca vender por debajo del costo.
                    validate: (v, form) => {
                      const base = reglaPrecio('El precio de venta').validate(v);
                      if (base !== true) return base;
                      if (Number(v) < Number(form.priceCost || 0)) {
                        return 'El precio de venta no puede ser menor al costo';
                      }
                      return true;
                    },
                  })}
                  className="w-full bg-white text-gray-900 text-sm rounded-md px-2 py-1 focus:outline-none"
                />
              </div>
            </div>
            {/* Rojo oscuro: el claro de antes estaba pensado para leerse sobre
                el panel café, y sobre fondo claro casi desaparece. */}
            {(errors.priceCost || errors.salePrice) && (
              <p className="text-xs text-red-500 mt-1">
                {errors.priceCost?.message || errors.salePrice?.message}
              </p>
            )}
          </div>
        </div>

        {/*
          El panel derecho, en TRES bloques con título en vez de una pared de
          campos sueltos.

          Antes era un `flex` con una columna de 2/3 y otra de 1/3, y cada campo
          nuevo se metía donde cupiera. Con la venta por libra —que trajo
          unidad, piezas y el +18— la columna angosta quedó del doble de alto
          que la ancha y el formulario se leía en zigzag. Agrupado por la
          pregunta que responde cada bloque (dónde se vende, cómo se vende, qué
          más hay que saber), se recorre de arriba abajo una sola vez.

          Y el panel scrollea por dentro: con todos los campos, en una pantalla
          de portátil el botón Guardar quedaba fuera de la ventana.
        */}
        <div className="w-2/3 p-6 flex flex-col relative bg-[#FAF9F6] max-h-[90vh] overflow-y-auto">
          <form id="product-form" onSubmit={handleSubmit(onSubmit, onError)} className="space-y-5 flex-1">

            {/* ── Dónde se vende ── */}
            <section className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Dónde se vende
              </h3>

              {/*
                El pasillo va primero y en pastillas, no en un desplegable
                perdido entre otros cinco: es la pregunta que decide todo lo
                que sigue (qué categorías, si hace falta proveedor).
              */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-0.5">
                    ¿En qué parte de la tienda se vende?
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    El pasillo donde el cliente lo va a encontrar.
                  </p>

                  <input type="hidden" {...register('moduleId', { required: true })} />

                  <div className="flex flex-wrap gap-2">
                    {modulosActivos.map((m) => {
                      const activo = moduleIdActivo === m._id;
                      const Icono = iconoDeModulo(m);
                      return (
                        <button
                          type="button"
                          key={m._id}
                          onClick={() => setValue('moduleId', m._id, { shouldValidate: true })}
                          aria-pressed={activo}
                          className="press flex items-center gap-2 px-3 py-2 rounded-full border text-sm font-medium transition-colors"
                          style={{
                            borderColor: activo ? 'var(--theme-primary)' : 'var(--theme-card-border)',
                            background: activo ? 'var(--theme-primary-light)' : 'var(--theme-card-bg)',
                            color: 'var(--theme-text-primary)',
                          }}
                        >
                          <Icono size={15} style={{ color: 'var(--theme-primary)' }} />
                          {m.name}
                        </button>
                      );
                    })}
                  </div>

                  {/* Un pasillo con flujo propio pide otros datos; conviene avisarlo */}
                  {isPrintModule && (
                    <p className="text-xs text-gray-500 mt-2">
                      Este pasillo tiene su propia forma de comprarse: el cliente elegirá archivo, tamaño y color al pedirlo.
                    </p>
                  )}
                </div>

              {/* Categoría y proveedor, lado a lado: son la misma pregunta en
                  dos partes y los dos dependen del pasillo de arriba. */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Categoría (Tipo)</label>
                  <select 
                    {...register('typeId', { required: true })}
                    disabled={!moduleIdActivo}
                    className="w-full border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-[#9C6026] disabled:opacity-50 disabled:bg-gray-100"
                  >
                    <option value="">Seleccionar...</option>
                    {filteredCategories.map((c, i) => (
                      <option key={c._id || i} value={c._id || c}>{c.type || c}</option>
                    ))}
                  </select>
                  {/*
                    Un pasillo recién creado no tiene categorías, así que el
                    desplegable sale vacío y el producto no se puede guardar.
                    Sin este aviso parecía que el formulario estaba fallando.
                  */}
                  {moduleIdActivo && filteredCategories.length === 0 && (
                    <span className="text-xs text-gray-500 mt-1 block">
                      Este pasillo todavía no tiene categorías: creá una en <b>Catálogo → Categorías</b> antes de cargarle productos.
                    </span>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Proveedor {isStoreModule && <span className="text-red-500">*</span>}
                    {isPrintModule && <span className="text-gray-400 font-normal"> (Opcional)</span>}
                  </label>
                  <select 
                    {...register('supplierId', { required: isStoreModule })}
                    disabled={!moduleIdActivo}
                    className={`w-full border rounded-full px-4 py-2 text-sm focus:outline-none focus:border-[#9C6026] disabled:opacity-50 disabled:bg-gray-100 ${
                      errors.supplierId ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Seleccionar...</option>
                    {filteredSuppliers.map(s => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                  {errors.supplierId && (
                    <span className="text-xs text-red-500 mt-1 block">
                      El proveedor es obligatorio en los pasillos de la tienda
                    </span>
                  )}
                </div>
              </div>
            </section>

            {/* ── Cómo se vende ── */}
            <section className="space-y-3 pt-4 border-t border-gray-200">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Cómo se vende
              </h3>

              {/*
                Esta es la pregunta que decide qué significan el precio y el
                stock. Antes no existía y la única forma de decir "esto se
                vende por libra" era escribirlo en la descripción y confiar en
                que el cliente lo leyera.
              */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1">¿Cómo se vende?</label>
                  <div className="flex gap-2 max-w-xs">
                    {UNIDADES.map((u) => {
                      const activa = watchUnidad === u.clave;
                      return (
                        <button
                          type="button"
                          key={u.clave}
                          onClick={() => setValue('unidadVenta', u.clave, { shouldValidate: true })}
                          aria-pressed={activa}
                          title={u.descripcion}
                          className="press flex-1 px-3 py-2 rounded-full border text-xs font-semibold transition-colors"
                          style={{
                            borderColor: activa ? 'var(--theme-primary)' : 'var(--theme-card-border)',
                            background: activa ? 'var(--theme-primary-light)' : 'var(--theme-card-bg)',
                            color: activa ? 'var(--theme-primary)' : 'var(--theme-text-secondary)',
                          }}
                        >
                          {u.nombre}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{unidad.descripcion}</p>
                  {/* El valor real viaja aquí; los botones de arriba solo lo escriben. */}
                  <input type="hidden" {...register('unidadVenta')} />
                </div>

              <div className="max-w-xs">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1">
                    {porLibra ? 'Libras en existencia' : 'Stock'}
                  </label>
                  {/*
                    Por libra el stock admite decimales: 3.5 libras de queso es
                    una existencia normal y obligar a redondearla haría que el
                    inventario mintiera media libra en cada producto a granel.
                  */}
                  <input
                    type="number" min="0" step={porLibra ? '0.01' : '1'}
                    onKeyDown={bloquearTeclasNumero}
                    {...register('stock', porLibra
                      ? {
                          required: 'Las libras en existencia son obligatorias',
                          validate: (v) => {
                            const n = Number(v);
                            if (!Number.isFinite(n) || n < 0) return 'Las libras deben ser un número de 0 o más';
                            return true;
                          },
                        }
                      : reglaEntero('El stock', 0))}
                    className="w-full border border-gray-300 rounded-full px-4 py-2 text-sm text-center focus:outline-none focus:border-[#9C6026]"
                    placeholder={unidad.existencia}
                  />
                  {errors.stock && <p className="text-xs text-red-500 mt-1">{errors.stock.message}</p>}
                </div>

              </div>

              <div>
                {/* La descripción tenía el texto solo en el placeholder, que
                    desaparece en cuanto se escribe la primera letra: a media
                    ficha ya no había forma de saber qué era ese recuadro. */}
                <label className="block text-sm font-bold text-gray-900 mb-1">Descripción</label>
                <textarea
                  {...register('description', { required: true })}
                  rows={3}
                  placeholder="Qué es, para qué sirve, qué trae…"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#9C6026] resize-none"
                ></textarea>
                <p className="text-xs text-gray-500 mt-1">
                  Los saltos de línea se respetan tal como los escriba.
                </p>
              </div>
            </section>

            {/*
              ── Más opciones ──
              Lo que se llena de vez en cuando. Plegado por defecto: seis campos
              bastan para poner algo a la venta, y los otros cuatro solo hacen
              falta a veces. Se abre solo si algo de adentro falla, para que un
              aviso nunca señale un campo invisible.
            */}
            <section className="pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setMasOpciones((v) => !v)}
                aria-expanded={masOpciones}
                className="flex items-center gap-1.5 text-sm font-bold text-gray-700 hover:text-gray-900 transition-colors"
              >
                <ChevronDown
                  className="w-4 h-4"
                  style={{
                    transform: masOpciones ? 'rotate(180deg)' : 'none',
                    transition: 'transform var(--dur-press) var(--ease-out)',
                  }}
                />
                Más opciones
                {!masOpciones && (
                  <span className="text-xs font-normal text-gray-400">
                    código de barras, vencimiento{porLibra && ', piezas'}, +18
                  </span>
                )}
              </button>

              {masOpciones && (
              <div className="grid grid-cols-2 gap-3 items-start mt-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-bold text-gray-900">Código de barras</label>
                    <button
                      type="button"
                      onClick={() => setValue('barCode', Math.floor(1000000000000 + Math.random() * 9000000000000).toString())}
                      className="text-xs text-[#C28C5D] hover:underline"
                    >
                      Generar
                    </button>
                  </div>
                  <input
                    type="text" inputMode="numeric"
                    onKeyDown={bloquearNoDigitos}
                    {...register('barCode', reglaCodigoBarras)}
                    className="w-full border border-gray-300 rounded-full px-4 py-2 text-sm text-center focus:outline-none focus:border-[#9C6026]"
                    placeholder="Escanear o dejar en blanco"
                  />
                  {errors.barCode
                    ? <p className="text-xs text-red-500 mt-1">{errors.barCode.message}</p>
                    : <p className="text-xs text-gray-500 mt-1">Si lo deja vacío se genera uno interno.</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1">
                    Fecha de expiración
                  </label>
                  <input
                    type="date"
                    {...register('expirationDate')}
                    className="w-full border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-[#9C6026]"
                  />
                </div>

                {/*
                  El mismo campo con dos sentidos según cómo se venda: por libra
                  es en cuántos bultos está la existencia, y por unidad es
                  cuántas trae cada producto (un six-pack trae 6). Opcional en
                  los dos casos, y en ninguno se cobra por aquí. El texto sale
                  de utils/unidades.js para que diga lo mismo en todas partes.
                */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1">
                    {textoPiezas.titulo}{' '}
                    <span className="text-gray-400 font-normal text-xs">(opcional)</span>
                  </label>
                  <input
                    type="number" min="0" step="1"
                    onKeyDown={bloquearTeclasNumero}
                    {...register('piezas')}
                    className="w-full border border-gray-300 rounded-full px-4 py-2 text-sm text-center focus:outline-none focus:border-[#9C6026]"
                    placeholder={textoPiezas.pista}
                  />
                  <p className="text-xs text-gray-500 mt-1">{textoPiezas.ayuda}</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1">Venta restringida</label>
                  <label className="flex items-center gap-2 cursor-pointer py-2">
                    <input
                      type="checkbox"
                      {...register('soloAdultos')}
                      className="w-4 h-4 rounded"
                      style={{ accentColor: 'var(--theme-primary)' }}
                    />
                    <span className="text-sm text-gray-700">Solo para mayores de 18</span>
                  </label>
                  <p className="text-xs text-gray-500">
                    Se marca en la tienda y se pedirá documento al entregar.
                  </p>
                </div>
              </div>
              )}
            </section>

            {isEditing && (
              <div className="pt-4 border-t border-gray-200">
                <label className="flex items-center cursor-pointer w-max">
                  <div className="relative">
                    <input type="checkbox" className="sr-only" {...register('isActive')} />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${watchIsActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${watchIsActive ? 'transform translate-x-4' : ''}`}></div>
                  </div>
                  <div className="ml-3 text-sm font-medium text-gray-700">
                    Estado: {watchIsActive ? 'Activo' : 'Inactivo'}
                  </div>
                </label>
              </div>
            )}
            
          </form>
          
          <div className="mt-8 flex justify-between items-center w-full relative">
            <div className="flex-1">
              {isEditing && (
                <button 
                  type="button"
                  onClick={() => onDelete(product)}
                  className="bg-red-500 hover:bg-red-600 text-white font-medium px-6 py-2 rounded-full transition-colors"
                >
                  Eliminar
                </button>
              )}
            </div>
            
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={onClose}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium px-6 py-2 rounded-full transition-colors"
              >
                Cancelar
              </button>
              <button 
                form="product-form"
                type="submit"
                className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 shadow-sm font-medium px-8 py-2 rounded-full transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
        
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};

export default ProductFormModal;
