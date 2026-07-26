import { useState } from 'react';
import { useInventory } from '../hooks/useInventory';
import { Download, Plus, Search } from 'lucide-react';
import FilterSelect from '../components/UI/FilterSelect';
import CategoryPills from '../components/Inventory/CategoryPills';
import ProductCard from '../components/Inventory/ProductCard';
import ProductFormModal from '../components/Inventory/ProductFormModal';
import ProductViewModal from '../components/Inventory/ProductViewModal';
import ConfirmActionModal from '../components/Inventory/ConfirmActionModal';
// El <Toaster> global vive en App.jsx (uno solo, para que los avisos se cierren bien).

const Inventory = () => {
  const { 
    products, 
    categories,
    categoryNames,
    brands,
    suppliers,
    modules,
    selectedCategory, 
    setSelectedCategory,
    saveProduct,
    deleteProduct
  } = useInventory();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  
  const [currentProduct, setCurrentProduct] = useState(null);
  
  const [pendingAction, setPendingAction] = useState({ type: null, data: null });

  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('Todos');
  const [orden, setOrden] = useState('nombre'); // 'nombre' | 'stock' | 'precio'

  /*
   * "Stock bajo" es relativo al máximo de CADA producto, no un número fijo:
   * que queden 10 refrescos de un máximo de 1000 es crítico, pero 10 televisores
   * de un máximo de 12 es normal. Si el producto no tiene máximo, usamos 10.
   */
  const RATIO_BAJO = 0.25;
  const STOCK_BAJO_ABS = 10;
  const esBajo = (p) => {
    // Number() porque algunos productos guardaron estos campos como texto.
    const stock = Number(p.stock) || 0;
    const max = Number(p.maxQuantity) || 0;
    return stock > 0 && (max > 0 ? stock <= max * RATIO_BAJO : stock <= STOCK_BAJO_ABS);
  };

  // Resumen rápido del inventario: lo que el encargado necesita ver de un vistazo.
  const agotados = products.filter((p) => !p.stock).length;
  const bajos = products.filter(esBajo).length;
  const valorInventario = products.reduce((a, p) => a + (p.stock || 0) * (p.salePrice || 0), 0);

  const filteredProducts = products
    .filter(product => {
      const searchString = searchTerm.toLowerCase();
      const matchesSearch = product.name?.toLowerCase().includes(searchString) ||
                            product.description?.toLowerCase().includes(searchString) ||
                            product.barCode?.toLowerCase().includes(searchString);

      if (stockFilter === 'Todos') return matchesSearch;
      if (stockFilter === 'ConStock') return matchesSearch && (product.stock > 0);
      if (stockFilter === 'StockBajo') return matchesSearch && esBajo(product);
      if (stockFilter === 'Agotados') return matchesSearch && (!product.stock || product.stock === 0);

      return matchesSearch;
    })
    .sort((a, b) => {
      if (orden === 'stock') return (a.stock || 0) - (b.stock || 0);   // lo que urge, primero
      if (orden === 'precio') return (b.salePrice || 0) - (a.salePrice || 0);
      return (a.name || '').localeCompare(b.name || '');
    });

  const handleAddProduct = () => {
    setCurrentProduct(null);
    setIsFormOpen(true);
  };

  const handleEditProduct = (product) => {
    setCurrentProduct(product);
    setIsFormOpen(true);
  };

  const handleViewProduct = (product) => {
    setCurrentProduct(product);
    setIsViewOpen(true);
  };

  const handleSaveForm = (formData) => {
    setPendingAction({ type: 'save', data: formData });
    setIsConfirmOpen(true);
  };

  const handleDeleteForm = (productData) => {
    setPendingAction({ type: 'delete', data: productData });
    setIsConfirmOpen(true);
  };

  const handleConfirmAction = async (data) => {
    let success = false;
    if (pendingAction.type === 'save') {
      success = await saveProduct(data);
    } else if (pendingAction.type === 'delete') {
      success = await deleteProduct(data._id);
    }
    
    setIsConfirmOpen(false);
    
    if (success) {
      setIsFormOpen(false); 
      setPendingAction({ type: null, data: null });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-4xl font-extrabold text-[#C28C5D]">Inventario</h1>
        
        <div className="flex gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar producto..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-full text-sm outline-none focus:border-[#B47C4D] transition-colors w-64 shadow-sm"
            />
          </div>
          <FilterSelect
            value={stockFilter}
            onChange={setStockFilter}
            options={[
              { value: 'ConStock', label: 'Con Stock' },
              { value: 'StockBajo', label: 'Stock bajo' },
              { value: 'Agotados', label: 'Agotados' },
            ]}
          />
          <select
            value={orden}
            onChange={(e) => setOrden(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm outline-none focus:border-[#B47C4D] shadow-sm cursor-pointer"
          >
            <option value="nombre">Ordenar: Nombre</option>
            <option value="stock">Ordenar: Menos stock</option>
            <option value="precio">Ordenar: Mayor precio</option>
          </select>
          <button 
            onClick={handleAddProduct}
            className="flex items-center gap-2 px-6 py-2 bg-[#B47C4D] hover:bg-[#9C6026] text-white rounded-full text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Añadir producto
          </button>
        </div>
      </div>

      {/* Resumen del inventario: contexto antes de la lista */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Productos', valor: products.length, tono: 'text-gray-900' },
          { label: 'Stock bajo', valor: bajos, tono: bajos > 0 ? 'text-orange-500' : 'text-gray-900' },
          { label: 'Agotados', valor: agotados, tono: agotados > 0 ? 'text-red-500' : 'text-gray-900' },
          { label: 'Valor en bodega', valor: `$${valorInventario.toFixed(2)}`, tono: 'text-gray-900' },
        ].map((s) => (
          <div key={s.label} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="text-xs font-bold text-gray-500 mb-1">{s.label}</div>
            <div className={`text-2xl font-extrabold ${s.tono}`}>{s.valor}</div>
          </div>
        ))}
      </div>

      <CategoryPills
        categories={categoryNames}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      <div>
        <div className="flex items-baseline justify-between flex-wrap gap-2 mb-6">
          <h2 className="text-2xl font-bold text-[#C28C5D]">{selectedCategory}</h2>
          <span className="text-sm text-gray-500">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProducts.map((product, i) => (
            <ProductCard
              key={product._id}
              index={i}
              product={product}
              onView={handleViewProduct}
              onEdit={handleEditProduct}
              onDelete={handleDeleteForm}
            />
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-2 text-center py-14">
              <p className="text-gray-800 font-semibold mb-1">No hay productos que coincidan</p>
              <p className="text-gray-500 text-sm">Prueba con otra búsqueda, categoría o filtro.</p>
            </div>
          )}
        </div>
      </div>

      <ProductFormModal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)}
        product={currentProduct}
        onSave={handleSaveForm}
        onDelete={handleDeleteForm}
        brands={brands}
        suppliers={suppliers}
        categories={categories}
        modules={modules}
      />

      <ConfirmActionModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmAction}
        product={pendingAction.data}
        actionType={pendingAction.type}
        brands={brands}
        suppliers={suppliers}
        categories={categories}
      />
      <ProductViewModal 
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        product={currentProduct}
        modules={modules}
      />

    </div>
  );
};

export default Inventory;
