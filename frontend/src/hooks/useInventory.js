import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

// Datos de prueba basados en las imágenes
const mockCategories = ['Pan', 'Queso', 'Yogurt', 'Lacteos', 'Snack', 'Dulces', 'Vegetales', 'Frutas'];

const mockProducts = [
  {
    id: 1,
    brand: 'DIANA',
    name: 'Churritos',
    provider: 'DIANA',
    category: 'Snack',
    description: '¡El clásico sabor que a todos encanta! Crujientes palitos de maíz con el delicioso e inconfundible toque de queso Diana. La boquita perfecta para tus antojos de la tarde, compartir con amigos o disfrutar en tus fiestas. ¡Destapa la diversión y siente el verdadero crujido!',
    expirationDate: '2027-06-15',
    pv: 0.15,
    pvp: 0.20,
    currentQuantity: 95,
    maxQuantity: 100,
    image: 'https://res.cloudinary.com/demo/image/upload/v1615456789/churritos.png' 
  },
  {
    id: 2,
    brand: 'DIANA',
    name: 'Churritos',
    provider: 'DIANA',
    category: 'Snack',
    description: '¡El clásico sabor que a todos encanta! Crujientes palitos de maíz con el delicioso e inconfundible toque de queso Diana.',
    expirationDate: '2027-06-15',
    pv: 0.15,
    pvp: 0.20,
    currentQuantity: 50,
    maxQuantity: 100,
    image: 'https://res.cloudinary.com/demo/image/upload/v1615456789/churritos.png'
  },
  {
    id: 3,
    brand: 'BIMBO',
    name: 'Pan Blanco',
    provider: 'BIMBO',
    category: 'Pan',
    description: 'Pan blanco ideal para tus sándwiches diarios.',
    expirationDate: '2026-10-20',
    pv: 1.50,
    pvp: 2.00,
    currentQuantity: 20,
    maxQuantity: 50,
    image: 'https://res.cloudinary.com/demo/image/upload/v1615456789/pan.png'
  }
];

export const useInventory = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Snack');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Simular carga de datos
    setIsLoading(true);
    setTimeout(() => {
      setCategories(mockCategories);
      setProducts(mockProducts);
      setIsLoading(false);
    }, 500);
  }, []);

  const filteredProducts = products.filter(
    (product) => product.category.toLowerCase() === selectedCategory.toLowerCase()
  );

  const saveProduct = async (productData) => {
    setIsLoading(true);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        if (productData.id) {
          // Edit
          setProducts((prev) => 
            prev.map((p) => p.id === productData.id ? { ...p, ...productData } : p)
          );
          toast.success(`Has actualizado el producto: ${productData.name}`, {
            style: { background: '#333', color: '#fff', borderRadius: '10px' },
            iconTheme: { primary: '#fff', secondary: '#333' }
          });
        } else {
          // Create
          const newProduct = { ...productData, id: Date.now() };
          setProducts((prev) => [...prev, newProduct]);
          toast.success(`Has creado el producto: ${productData.name}`, {
            style: { background: '#333', color: '#fff', borderRadius: '10px' },
            iconTheme: { primary: '#fff', secondary: '#333' }
          });
        }
        setIsLoading(false);
        resolve(true);
      }, 500);
    });
  };

  const deleteProduct = async (productId) => {
    setIsLoading(true);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const productToDelete = products.find(p => p.id === productId);
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        toast.success(`Has eliminado el producto: ${productToDelete?.name}`, {
          style: { background: '#333', color: '#fff', borderRadius: '10px' },
          iconTheme: { primary: '#fff', secondary: '#333' }
        });
        setIsLoading(false);
        resolve(true);
      }, 500);
    });
  };

  return {
    products: filteredProducts,
    categories,
    selectedCategory,
    setSelectedCategory,
    isLoading,
    saveProduct,
    deleteProduct
  };
};
