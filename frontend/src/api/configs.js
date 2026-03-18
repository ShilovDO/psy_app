import { apiClient } from './client';

export const configsApi = {
  getConfigs: async (page = 1, perPage = 10, field = 'name', direction = 'asc', sort = 0) => {
    return apiClient.get('/configs/all_config', { 
      params: { page, per_page: perPage, field, direction, sort } 
    });
  },

  createConfig: async (data) => {
    return apiClient.post('/configs/add_config', data);
  },

  getAllConfigForRoute: async () => {
    return apiClient.get('/configs/all_config_for_route');
  },

  getAllConfigConfigurable: async () => {
    return apiClient.get('/configs/all_configs_configurable');
  }
};