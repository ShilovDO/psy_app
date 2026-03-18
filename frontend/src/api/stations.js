import { apiClient } from './client';

export const stationsApi = {
  getStations: async (routeId) => {
    console.log(`API ID output:`, Number(routeId));
    return apiClient.get(`/stations/all_station/${routeId}`);
  },

  createStation: async (data) => {
    return apiClient.post('/stations/add_station', data);
  },

  changeStation: async (data) => {
    return apiClient.post('/stations/change_station', data);
  },

  deleteStation: async (stationId) => {
    return apiClient.post('/stations/delete_station', { id: stationId });
  }
};