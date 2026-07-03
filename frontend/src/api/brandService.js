import api from './api';

export const brandService = {
  getBrands: async () => {
    const response = await api.get('/brand');
    return response.data;
  },

  createBrand: async (brandData) => {
    const response = await api.post('/brand', brandData);
    return response.data;
  },

  updateBrand: async (id, brandData) => {
    const response = await api.put(`/brand/${id}`, brandData);
    return response.data;
  },

  deleteBrand: async (id) => {
    const response = await api.delete(`/brand/${id}`);
    return response.data;
  }
};
