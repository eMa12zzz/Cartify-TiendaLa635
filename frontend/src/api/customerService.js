import api from './api';

export const customerService = {
  getCustomers: async () => {
    const response = await api.get('/registerClient/all');
    return response.data;
  }
};
