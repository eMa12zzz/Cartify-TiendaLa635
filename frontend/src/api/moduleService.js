import api from './api';

export const moduleService = {
  getModules: async () => {
    const response = await api.get('/module');
    return response.data;
  },
  createModule: async (data) => {
    const response = await api.post('/module', data);
    return response.data;
  },
  updateModule: async (id, data) => {
    const response = await api.put(`/module/${id}`, data);
    return response.data;
  },
  deleteModule: async (id) => {
    const response = await api.delete(`/module/${id}`);
    return response.data;
  }
};
