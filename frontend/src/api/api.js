import axios from 'axios';

let navigate = null;

// Функция для установки navigate из React Router
export const setNavigate = (navigateFunction) => {
    navigate = navigateFunction;
};

const ACCESS_TOKEN = 'accessToken';
const BASE_URL = '/api';

// Создаем кастомный экземпляр axios
const apiClient = axios.create({
    baseURL: BASE_URL,
    withCredentials: true, // Если нужно для всех запросов
    headers: {
	'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
});

// Интерсептор запросов
apiClient.interceptors.request.use(
    (config) => {

        // Можно добавить общие заголовки, токены и т.д.
        if (localStorage.getItem(ACCESS_TOKEN) !== null) {
            config.headers.Authorization = `Bearer ${localStorage.getItem(ACCESS_TOKEN)}`;
            console.log('Зашли, вот конфиг' + config);
        }
        console.log('Отправляем запрос:', config.method?.toUpperCase(), config.url);
        console.log('Заголовок токена:', config.method?.toUpperCase(), config.headers.Authorization);
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
        console.log(`Headers ${error}`);
        console.log("Ниже должна быть ошибка");
        console.log(error);
        
        //const navigate = useNavigate(); // Хук для навигации
        const errorMessage = error.response?.data?.message || 'Ошибка сети или сервера';
        const status = error.response?.status || 500;
        const originalRequest = error.config;
        console.log(status);
        console.error(`Ошибка ${status}: ${errorMessage}`);

        // Можно добавить редиректы для определенных статусов
        if (status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try{
                const response = await apiClient.post('/refresh')
                console.info(response.data.access_token);
                if (response.status === 200) {
                    if (response?.data?.access_token) {
                        localStorage.setItem('accessToken', response?.data?.access_token);
                        originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`;
                        return apiClient(originalRequest);
                    }
                    else{
                        console.info('Ошибка 401')
                        localStorage.removeItem("accessToken");
                        navigate('/login');
                    }
                }

            }
            catch{
                console.log('Ошибка 401')
                localStorage.removeItem("accessToken");
                navigate('/login');
            }
        }

        // Пробрасываем нормализованную ошибку
        return Promise.reject({
            status,
            message: errorMessage,
            original: error
        });
    }
);

export const api = {
    getCurrentUser: async () => {
        return apiClient.get('/get_current_user');
    },

    setTheme: async (theme) => {
        return apiClient.post('/theme', {theme});
    },

    setHelloCheck: async () => {
        return apiClient.post('/hello-check');
    },

    taskOne: async () => {
        return apiClient.get('/task-one');
    },

    taskTwo: async () => {
        return apiClient.get('/task-two');
    },

    taskThree: async (query) => {
        return apiClient.get('/task-three', {params: {query}});
    },

    postLogin: async (mail, password, remember) => {
        return apiClient.post('/auth', {mail, password, remember});
    },
    postRegister: async (data) => {
        return apiClient.post('/registration', data);
    },
    postLogout: async () => {
        return apiClient.post('/logout');
    },
    deleteUser: async (id) => {
        return apiClient.post('/delete_user', {id});
    },
    getUsers: async (page = 1, perPage = 10,  field='name', direction='asc') => {
        return apiClient.get('/all_users', { params: { page, per_page: perPage,  field, direction } });
    },
    getServices: async (page = 1, perPage = 10, field='name', direction='asc') => {
        return apiClient.get('/all_service', { params: { page, per_page: perPage, field, direction } });
    },
    getAvailableServices: async (page = 1, perPage = 10, field='name', direction='asc') => {
        return apiClient.get('/available_service', { params: { page, per_page: perPage, field, direction } });
    },
    updateUser: async (data) => {
        return apiClient.post('/change_user', data);
    },
    updateService: async (data) => {
        return apiClient.post('/change_service', data);
    },
    deleteService: async (data) => {
        return apiClient.post('/delete_service', data);
    },
    createService: async (data) => {
        return apiClient.post('/add_service', data);
    },
    getAllRoutes: async (page = 1, perPage = 10, field='name', direction='asc') => {
        return apiClient.get('/all_route', { params: { page, per_page: perPage, field, direction } });
    },
    deleteRoute: async (routeId) => {
        return apiClient.post('/delete_route', { id: routeId });
    },
    getStations: async (routeId) => {
        console.log(`API ID output :`);
        console.log(Number(routeId));
        return apiClient.get(`/all_station/${routeId}`);
    },
    createRoute: async (data) => {
        return apiClient.post('/add_route', data);
    },
    createStation: async (data) => {
        return apiClient.post('/add_station', data);
    },
    changeStation: async (data) => {
        return apiClient.post('/change_station', data);
    },
    checkMail: async (data) => {
        return apiClient.get(`/check_mail/${data}`);
    },
    getRoute: async (data) => {
        return apiClient.get(`/get_route/${data}`);
    },
};