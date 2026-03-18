import axios from 'axios';
import { BASE_URL } from './config';
import { setupInterceptors } from './interceptors';

const createApiClient = () => {
  const client = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });

  setupInterceptors(client);
  return client;
};

export const apiClient = createApiClient();