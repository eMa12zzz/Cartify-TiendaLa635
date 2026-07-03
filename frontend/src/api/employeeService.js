import api from './api';

export const employeeService = {
  getEmployees: async () => {
    const response = await api.get('/employee');
    return response.data;
  },
  createEmployee: async (formData) => {
    const response = await api.post('/employee', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  updateEmployee: async (id, formData) => {
    const response = await api.put(`/employee/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  deleteEmployee: async (id) => {
    const response = await api.delete(`/employee/${id}`);
    return response.data;
  }
};
