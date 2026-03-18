import { apiClient } from './client';

export const servicesApi = {
  getServices: async (page = 1, perPage = 10, field = 'name', direction = 'asc') => {
    return apiClient.get('/services/all_service', { 
      params: { page, per_page: perPage, field, direction } 
    });
  },

  getAvailableServices: async (page = 1, perPage = 10, field = 'name', direction = 'asc') => {
    return apiClient.get('/services/available_service', { 
      params: { page, per_page: perPage, field, direction } 
    });
  },

  getConfigurableServices: async () => {
    return apiClient.get('/services/configurable_service');
  },

  updateService: async (data) => {
    return apiClient.post('/services/change_service', data);
  },

  deleteService: async (data) => {
    return apiClient.post('/services/delete_service', data);
  },

  createService: async (data) => {
    return apiClient.post('/services/add_service', data);
  }
};