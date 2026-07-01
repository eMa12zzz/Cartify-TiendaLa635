import api from './api';

export const productTypeService = {
  getProductTypes: async () => {
    const response = await api.get('/productType');
    return response.data;
  },
  createProductType: async (data) => {
    const response = await api.post('/productType', data);
    return response.data;
  },
  updateProductType: async (id, data) => {
    const response = await api.put(`/productType/${id}`, data);
    return response.data;
  },
  deleteProductType: async (id) => {
    const response = await api.delete(`/productType/${id}`);
    return response.data;
  }
};
