import { ACCESS_TOKEN } from './config';

let navigate = null;

export const setNavigate = (navigateFunction) => {
  navigate = navigateFunction;
};

export const setupInterceptors = (apiClient) => {
  // Интерсептор запросов
  apiClient.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      console.log('Отправляем запрос:', config.method?.toUpperCase(), config.url);
      return config;
    },
    (error) => {
      console.error('Ошибка в запросе:', error);
      return Promise.reject(error);
    }
  );

  // Интерсептор ответов
  apiClient.interceptors.response.use(
    (response) => {
      console.log('Получен ответ:', response.status, response.config.url);
      const newAccessToken = response?.headers['new-access-token'];
      if (newAccessToken) {
        localStorage.setItem(ACCESS_TOKEN, newAccessToken);
      }
      return response;
    },
    async (error) => {
      return handleResponseError(error, apiClient);
    }
  );
};

const handleResponseError = async (error, apiClient) => {
  console.log(error);
  
  const errorMessage = error.response?.data?.message || 'Ошибка сети или сервера';
  const status = error.response?.status || 500;
  const originalRequest = error.config;
  
  console.error(`Ошибка ${status}: ${errorMessage}`);

  // Обработка 401 ошибки
  if (status === 401 && !originalRequest?._retry) {
    return handleUnauthorizedError(error, apiClient);
  }

  // Пробрасываем нормализованную ошибку
  return Promise.reject({
    status,
    message: errorMessage,
    original: error
  });
};

const handleUnauthorizedError = async (error, apiClient) => {
  const originalRequest = error.config;
  originalRequest._retry = true;

  try {
    const response = await apiClient.post('/auth/refresh');
    
    if (response.status === 200 && response?.data?.access_token) {
      localStorage.setItem(ACCESS_TOKEN, response.data.access_token);
      originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`;
      return apiClient(originalRequest);
    }
  } catch (refreshError) {
    console.error('Ошибка обновления токена:', refreshError);
  }

  // Если не удалось обновить токен
  localStorage.removeItem(ACCESS_TOKEN);
  if (navigate) {
    navigate('/login');
  }
  
  return Promise.reject(error);
};