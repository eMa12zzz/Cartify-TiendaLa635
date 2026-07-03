import api from './api';

export const supplierService = {
  getSuppliers: async () => {
    const response = await api.get('/supplier');
    return response.data;
  },
  createSupplier: async (data) => {
    const response = await api.post('/supplier', data);
    return response.data;
  },
  updateSupplier: async (id, data) => {
    const response = await api.put(`/supplier/${id}`, data);
    return response.data;
  },
  deleteSupplier: async (id) => {
    const response = await api.delete(`/supplier/${id}`);
    return response.data;
  }
};
