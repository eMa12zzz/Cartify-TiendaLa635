import api from './api';

export const productService = {
  getProducts: async () => {
    const response = await api.get('/product');
    return response.data;
  },

  createProduct: async (formData) => {
    // Necesita formData porque lleva archivo de imagen
    const response = await api.post('/product', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  updateProduct: async (id, formData) => {
    const response = await api.put(`/product/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  deleteProduct: async (id) => {
    const response = await api.delete(`/product/${id}`);
    return response.data;
  }
};
