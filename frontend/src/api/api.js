export { setNavigate } from './interceptors.js';
export { authApi } from './auth.js';
export { usersApi } from './users.js';
export { servicesApi } from './services.js';
export { routesApi } from './routes.js';
export { stationsApi } from './stations.js';
export { configsApi } from './configs.js';
export { resultsApi } from './results.js';

import { setNavigate } from './interceptors.js';
import { authApi } from './auth.js';
import { usersApi } from './users.js';
import { servicesApi } from './services.js';
import { routesApi } from './routes.js';
import { stationsApi } from './stations.js';
import { configsApi } from './configs.js';
import { resultsApi } from './results.js';
// Единый объект для обратной совместимости
export const api = {
  ...authApi,
  ...usersApi,
  ...servicesApi,
  ...routesApi,
  ...stationsApi,
  ...configsApi,
  ...resultsApi
};