import { apiClient } from './client';

export const resultsApi = {
  createResult: async (data) => {
    return apiClient.post('/results/create_result', data);
  },

  getResults: async (page = 1, perPage = 10, field = 'name', direction = 'asc', user = 0, config = 0, route = 0) => {
    return apiClient.get('/results/all_result', { 
      params: { page, per_page: perPage, field, direction, user, config, route } 
    });
  }
};