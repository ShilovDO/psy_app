import { apiClient } from './client';

export const usersApi = {
  getUsers: async (page = 1, perPage = Number.MAX_SAFE_INTEGER, field = 'name', direction = 'asc') => {
    return apiClient.get('/users/all_users', { 
      params: { page, per_page: perPage, field, direction } 
    });
  },

  updateUser: async (data) => {
    return apiClient.post('/users/change_user', data);
  },

  deleteUser: async (id) => {
    return apiClient.post('/users/delete_user', { id });
  }
};