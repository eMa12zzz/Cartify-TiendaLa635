import { useState } from 'react';
import { useInventory } from '../hooks/useInventory';
import { Download, Plus, Search } from 'lucide-react';
import FilterSelect from '../components/UI/FilterSelect';
import CategoryPills from '../components/Inventory/CategoryPills';
import ProductCard from '../components/Inventory/ProductCard';
import ProductFormModal from '../components/Inventory/ProductFormModal';
import ProductViewModal from '../components/Inventory/ProductViewModal';
import ConfirmActionModal from '../components/Inventory/ConfirmActionModal';
import { Toaster } from 'react-hot-toast';

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

  const filteredProducts = products.filter(product => {
    const searchString = searchTerm.toLowerCase();
    const matchesSearch = product.name?.toLowerCase().includes(searchString) || 
                          product.description?.toLowerCase().includes(searchString);
    
    if (stockFilter === 'Todos') return matchesSearch;
    if (stockFilter === 'ConStock') return matchesSearch && (product.stock > 0);
    if (stockFilter === 'Agotados') return matchesSearch && (!product.stock || product.stock === 0);
    
    return matchesSearch;
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
    if (pendingAction.type === 'save') {
      await saveProduct(data);
    } else if (pendingAction.type === 'delete') {
      await deleteProduct(data._id);
    }
    
    setIsConfirmOpen(false);
    setIsFormOpen(false); 
    setPendingAction({ type: null, data: null });
  };

  return (
    <div className="flex flex-col gap-6">
      <Toaster position="bottom-right" />

      <div className="flex justify-between items-center">
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
              { value: 'Agotados', label: 'Agotados' },
            ]}
          />
          <button 
            onClick={handleAddProduct}
            className="flex items-center gap-2 px-6 py-2 bg-[#B47C4D] hover:bg-[#9C6026] text-white rounded-full text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Añadir producto
          </button>
        </div>
      </div>

      <CategoryPills 
        categories={categoryNames} 
        selectedCategory={selectedCategory} 
        onSelectCategory={setSelectedCategory} 
      />

      <div>
        <h2 className="text-2xl font-bold text-[#C28C5D] mb-6">{selectedCategory}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard 
              key={product._id} 
              product={product} 
              onView={handleViewProduct}
              onEdit={handleEditProduct} 
              onDelete={handleDeleteForm}
            />
          ))}
          {filteredProducts.length === 0 && (
            <p className="text-gray-500 col-span-2 text-center py-10">No se encontraron productos que coincidan con la búsqueda.</p>
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
