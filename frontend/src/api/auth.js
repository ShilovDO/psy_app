import { apiClient } from './client';

export const authApi = {
  postLogin: async (mail, password, remember) => {
    return apiClient.post('/auth/auth', { mail, password, remember });
  },

  postRegister: async (data) => {
    return apiClient.post('/auth/registration', data);
  },

  postLogout: async () => {
    return apiClient.post('/auth/logout');
  },

  checkMail: async (email) => {
    return apiClient.get(`/auth/check_mail/${email}`);
  },

  getCurrentUser: async () => {
    return apiClient.get('/get_current_user');
  }
};