import { apiClient } from './client';

export const routesApi = {
  getAllRoutes: async (page = 1, perPage = Number.MAX_SAFE_INTEGER, field = 'name', direction = 'asc', visibleParam ="visibled") => {
    return apiClient.get('/routes/all_route', { 
      params: { page, per_page: perPage, field, direction, visibleParam } 
    });
  },

  getRoute: async (routeId) => {
    return apiClient.get(`/routes/get_route/${routeId}`);
  },

  createRoute: async (data) => {
    return apiClient.post('/routes/add_route', data);
  },

  changeRoute: async (data) => {
    return apiClient.post('/routes/change_route', data);
  },

  deleteRoute: async (routeId) => {
    return apiClient.post('/routes/delete_route', { id: routeId });
  }
};