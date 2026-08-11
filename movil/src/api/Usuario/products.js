import api from './client';

// --- MOCK DATA -------------------------------------------------
// Usa esta data mientras el backend está listo. Cuando esté disponible,
// simplemente borra el bloque MOCK y deja las funciones haciendo fetch real
// (ya están preparadas abajo, solo comenta el "return MOCK...").
const MOCK_PRODUCTS = [
  {
    id: 'naranjas-1',
    name: 'Naranjas',
    variant: '1.5-2 lb',
    pricePerUnit: '$2.71/lb',
    price: 99.99,
    oldPrice: 99.99,
    salePrice: 25.98,
    stock: 12,
    category: 'Frutas',
    isBestSeller: true,
    rating: 4.5,
    reviewsCount: 5391,
    images: [
      'https://images.unsplash.com/photo-1547514701-42782101795e',
    ],
    description:
      'Naranjas frescas, jugosas y 100% naturales. Ideales para jugo o para comer directo.',
  },
  {
    id: 'manzana-1',
    name: 'Manzana',
    variant: '1 lb',
    pricePerUnit: '$2.71/lb',
    price: 99.99,
    salePrice: 25.98,
    stock: 12,
    category: 'Frutas',
    isBestSeller: true,
    rating: 4.6,
    reviewsCount: 2210,
    images: ['https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6'],
  },
  {
    id: 'uvas-1',
    name: 'Uvas',
    variant: '1 lb',
    pricePerUnit: '$2.71/lb',
    price: 99.99,
    salePrice: 25.98,
    stock: 12,
    category: 'Frutas',
    isBestSeller: true,
    rating: 4.4,
    reviewsCount: 1802,
    images: ['https://images.unsplash.com/photo-1599819177626-b0dff7622da8'],
  },
  {
    id: 'kiwi-1',
    name: 'Kiwi',
    variant: '1.5 lb',
    pricePerUnit: '$2.71/lb',
    price: 99.99,
    salePrice: 25.98,
    stock: 12,
    category: 'Frutas',
    rating: 4.3,
    reviewsCount: 980,
    images: ['https://images.unsplash.com/photo-1618897996318-5a901fa6ca71'],
  },
  {
    id: 'mystic-cheese-1',
    name: 'Mystic Cheese',
    variant: '1 lb',
    pricePerUnit: '$2.71/lb',
    price: 99.99,
    salePrice: 25.98,
    stock: 12,
    category: 'Lacteos',
    isBestSeller: true,
    rating: 4.2,
    reviewsCount: 640,
    images: ['https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d'],
  },
];

export const CATEGORIES = [
  'Lacteos',
  'Snacks',
  'Dulces',
  'Vegetales',
  'Frutas',
  'Pan',
  'Queso',
  'Yogurt',
];

// --- ENDPOINTS ---------------------------------------------------

export async function getHomeSections() {
  // return api.get('/home'); // <- cuando el backend esté listo
  return {
    banners: [
      { id: 'b1', title: 'Refreshing summer sips', subtitle: 'Beverages & desserts' },
      { id: 'b2', title: 'Crazy 8 Weekly Deals', subtitle: 'Save up to 50% off' },
    ],
    categories: CATEGORIES,
    sections: [
      { id: 'quesos', title: 'Quesos', products: MOCK_PRODUCTS.filter(p => p.category === 'Lacteos') },
      { id: 'mas-vendidos', title: 'Productos más vendidos', products: MOCK_PRODUCTS.filter(p => p.isBestSeller) },
      { id: 'del-hogar', title: 'Del hogar', products: MOCK_PRODUCTS },
    ],
  };
}

export async function searchProducts(query) {
  // return api.get(`/products/search?q=${encodeURIComponent(query)}`);
  const q = (query || '').toLowerCase();
  return MOCK_PRODUCTS.filter(p => p.name.toLowerCase().includes(q));
}

export async function getProductById(id) {
  // return api.get(`/products/${id}`);
  return MOCK_PRODUCTS.find(p => p.id === id);
}

export async function getRecommendations(excludeId) {
  // return api.get(`/products/${excludeId}/recommendations`);
  return MOCK_PRODUCTS.filter(p => p.id !== excludeId);
}
