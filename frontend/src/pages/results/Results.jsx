import { useEffect, useState } from "react";
import { api } from "../../api/api.js";
import { toast } from "react-toastify";
import Spiner from "../../Components/Spiner.jsx";
import { Helmet } from "react-helmet";
import { useForm } from "react-hook-form";
import Pagination from "../../Components/Pagination.jsx";
import Dropdown from "../../Components/Dropdown.jsx";
import {useSearchParams} from "react-router-dom";
import { useMemo } from 'react';
import Avatar from "../../Components/Avatar.jsx";
import UserSelect from "../../Components/UserSelect.jsx";
import Select from "../../Components/Select.jsx";

export default function Results() {
    const [loadingServices, setLoadingServices] = useState(false);
    const [servicesData, setServicesData] = useState({
        items: [],
        total: 0,
        page: 1,
        per_page: 10,
        total_pages: 1
    });
    const testUsers = [
        { id: '1', username: 'Тест 1' },
        { id: '2', username: 'Тест 2' },
    ];
    const [servicesDataUser, setServicesDataUser] = useState({
        items: [],
        total: 0,
        page: 1,
        per_page: 10,
        total_pages: 1
    });

    const [configsData, setConfigsData] = useState({
        items: [],
        total: 0,
        page: 1,
        per_page: 10,
        total_pages: 1
    });

    const [servicesDataForConfigs, setServicesDataForConfigs] = useState({
        items: [],
        total: 0,
        page: 1,
        per_page: 10,
        total_pages: 1
    });


    const PER_PAGE_OPTIONS = [
        { value: 5, label: "5 записей" },
        { value: 10, label: "10 записей" },
        { value: 20, label: "20 записей" },
        { value: 50, label: "50 записей" }
    ];



    const SORT_OPTIONS_ADMIN = [
        // {value: "name_desc", label: "По убыванию названия"},
        // {value: "name_asc", label: "По возрастанию названия"},
        // {value: "available_desc", label: "Сначала доступные"},
        // {value: "available_asc", label: "Сначала недоступные"},
        {value: "id_desc", label: "Сначала новые"},
        {value: "id_asc", label: "Сначала старые"},
    ];
    const SORT_OPTIONS_USER = [
        {value: "name_desc", label: "По убыванию названия"},
        {value: "name_asc", label: "По возрастанию названия"},
        {value: "id_desc", label: "Сначала новые"},
        {value: "id_asc", label: "Сначала старые"},
    ];
    const [loading, setLoading] = useState(false);
    const [editingConfig, setEditingConfig] = useState(null);
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [adminPanelUrl, setAdminPanelUrl] = useState(null);
    const [admin, setAdmin] = useState(true);
    const [opendescriptionId, setOpendescriptionId] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const [sortParam, setSortParam] = useState((location.pathname).startsWith("/admin") ? localStorage.getItem('service_sort_admin') || 'name_asc' : localStorage.getItem('service_sort') || 'name_asc');
    const [perPage, setPerPage] = useState((location.pathname).startsWith("/admin") ? parseInt(localStorage.getItem('services_per_page_admin') || 10) : (parseInt(localStorage.getItem('services_per_page'))|| 10));
    const [userParam, setUserParam] = useState(localStorage.getItem('user_filter') || '0');
    const [configParam, setConfigParam] = useState(localStorage.getItem('config_filter') || '0');
    const [routeParam, setRouteParam] = useState(localStorage.getItem('route_filter') || '0');
    const currentPage = parseInt(searchParams.get("page")) || 1;
    const [services, setServices] = useState([]);
    const [users, setUsers] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [configs, setConfigs] = useState([]);
    

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue
    } = useForm({
        mode: "onTouched",
        defaultValues: {
            name: '',
            url: '',
            description: '',
            available: false,
            admin: false
        },
    });


    const fetchServices = async () => {
        try {
            setLoadingServices(true);
            const response = await api.getConfigurableServices();
            if (response?.data?.items) {
                setServices(response.data.items);
            }
        } catch (error) {
            if (error?.status != 401)
                toast.error("Не удалось загрузить список сервисов", {toastId: "unique-message-31"});
            console.error("Ошибка загрузки сервисов:", error, {toastId: "unique-message-30"});
        } finally {
            setLoadingServices(false);
        }
    };

    const fetchUsers = async () => {
        try {
            setLoadingServices(true);
            const response = await api.getUsersForResults();
            if (response?.data) {
                setUsers([{id: 0, username: "Пользователь", mail: "", admin: false, photo: ""}, ...response.data]);
            }
            console.info(response?.data?.items)
        } catch (error) {
            if (error?.status != 401)
                toast.error("Не удалось загрузить список пользователей", {toastId: "unique-message-32"});
            console.error("Ошибка загрузки пользователей:", error);
        } finally {
            setLoadingServices(false);
        }
    };

    const fetchConfigsToSort = async () => {
        try {
            setLoadingServices(true);
            const response = await api.getAllConfigConfigurable();
            if (response?.data) {
                setConfigs([{id: 0, name: "Конфигурация", description: "", service: 0, owner: 0}, ...response.data]);
                
            }
        } catch (error) {
            if (error?.status != 401)
                toast.error("Не удалось загрузить список конфигураций", {toastId: "unique-message-33"});
            console.error("Ошибка загрузки конфигураций:", error);
        } finally {
            setLoadingServices(false);
        }
    };

    const fetchRoutes = async () => {
        try {
            setLoadingServices(true);
            const response = await api.getAllRoutes();
            if (response?.data?.items) {
                setRoutes([{id: 0, name: "Маршрут", owner: 0}, ...response.data?.items]);
                
            }
        } catch (error) {
            if (error?.status != 401)
                toast.error("Не удалось загрузить список маршрутов", {toastId: "unique-message-31"});
            console.error("Ошибка загрузки маршрутов:", error, {toastId: "unique-message-34"});
        } finally {
            setLoadingServices(false);
        }
    };

    const toggledescription = (id) => {
        setOpendescriptionId(prevId => (prevId === id ? null : id));
    };

    // const fetchServices = async (page = 1, per_page = perPage, sort = sortParam) => {
    //     try {
    //         setLoading(true);
    //         const [field, direction] = sort.split("_");
    //         const responseAdmin = await api.getConfigs(page, per_page, field, direction, serviceParam)
    //         setServicesData(responseAdmin.data);
    //         setServicesDataUser(responseAdmin.data)    
            
    //     } catch (error) {
    //         toast.error((error?.message || 'Ошибка при получении данных с сервера.') + ` Код ошибки: ${error?.status}`);
    //         console.error('Ошибка при загрузке сервисов:', error);
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    const fetchConfigs = async (page = 1, per_page = perPage, sort = sortParam, user=0, config=0, route=0) => {
        try {
            if (user == NaN) user=0;
            setLoading(true);
            const [field, direction] = sort.split("_");
                const responseUser = await api.getResults(page, per_page, field, direction, user, config, route);
                setConfigsData(responseUser.data)               
      
        } catch (error) {
            if (error?.status != 401)
                toast.error((error?.message || 'Ошибка при получении данных с сервера.') + ` Код ошибки: ${error?.status}`, {toastId: "unique-message-35"});
            console.error('Ошибка при загрузке сервисов:', error);
        } finally {
            setLoading(false);
        }
    };



    const handleCreateClick = () => {
        setIsCreating(true);
        setEditingConfig(null);
        reset({
            name: '',
            description: '',
            service: ''
        });
        setIsServiceModalOpen(true);
    };

    const handleEditClick = (config) => {
        setIsCreating(false);
        setEditingConfig(config);
        setValue('name', config.name);
        setValue('description', config.description);
        setValue('service', config.service);
        setIsServiceModalOpen(true);
    };

    const handleOpenAdminPanel = (service) => {
        console.info('Тест URL:')
        console.info(service)
        const baseUrl = service.url.replace(/\/$/, '');
        setAdminPanelUrl(`${baseUrl}/config?id=${service.id}`)
    };

    const handleOpenViewPanel = (service) => {
        console.info('Тест URL:')
        console.info(service)
        const baseUrl = service.url.replace(/\/$/, '');
        setAdminPanelUrl(`${baseUrl}/result/?id=${service.id}`)
    };

    const closeAdminPanel = () => {
        setAdminPanelUrl(null);
    };

    const onSubmit = async (data) => {
        console.info(data)
        try {
            let response;
            if (isCreating) {
                const dataToCreate = {
                    name: data.name,
                    description: data.description,
                    service: data.service
                };
                response = await api.createConfig(dataToCreate);
                toast.success('Сервис успешно создан');

                handleOpenAdminPanel(response.data);

            } else {
                const dataToSend = {
                    id: Number(editingConfig.id),
                    name: data.name,
                    url: data.url,
                    description: data.description,
                    available: Boolean(data.available),
                    admin: Boolean(data.admin)
                };
                response = await api.updateService(dataToSend);
                toast.success('Сервис успешно обновлен');
            }

            setIsCreating(false);
            setIsServiceModalOpen(false);

            if (response.data) {
                fetchConfigs(currentPage, perPage, sortParam);
                
            }
        } catch (error) {
            console.error('Full error:', error);
            if (error?.status != 401)
                toast.error(error.response?.data?.detail || `Ошибка при ${isCreating ? 'создании' : 'обновлении'} сервиса`, {toastId: "unique-message-36"});
        }
    };

    const handleDelete = async (service) => {
        if (!service?.description){
            service.description = "";
        }
        if (window.confirm('Вы уверены, что хотите удалить этот сервис?')) {
            try {
                await api.deleteService(service);
                toast.success('Сервис удален');
                fetchConfigs(currentPage, servicesData.per_page, sortParam);
            } catch (error) {
                if (error?.status != 401)
                    toast.error(error.response?.data?.detail || 'Ошибка при удалении сервиса', {toastId: "unique-message-37"});
            }
        }
    };

    const handlePageChange = (newPage) => {
        setSearchParams({page: newPage});
    };

    const handleSortChange = (e) => {
        setSortParam(e.target.value);
        localStorage.setItem((location.pathname).startsWith("/admin") ? 'service_sort_admin' : 'service_sort', e.target.value);
        setSearchParams({page: 1});
    };

    const handlePerPageChange = (e) => {
        const newPerPage = parseInt(e.target.value);
        setPerPage(newPerPage);
        localStorage.setItem((location.pathname).startsWith("/admin") ? 'services_per_page_admin' : 'services_per_page', newPerPage.toString());
        setSearchParams({page: 1});
    };


    const handleUserChange = (userId) => {
        const newUser = parseInt(userId);
        setUserParam(newUser);
        localStorage.setItem('user_filter', newUser.toString());
        setSearchParams({page: 1});
    };
    
    const handleRouteChange = (routeId) => {
        const newRoute = parseInt(routeId);
        setRouteParam(newRoute);
        localStorage.setItem('route_filter', newRoute.toString());
        setSearchParams({page: 1});
    };
    
    const handleConfigChange = (configId) => {
        const newConfig = parseInt(configId);
        setConfigParam(newConfig);
        localStorage.setItem('config_filter', newConfig.toString());
        setSearchParams({page: 1});
    };

    const loadServiceHandler = (e) => {
        if (admin) {
            e.target.contentWindow.postMessage('secret_key', '*');
        }
    }

    useEffect(() => {
        setTimeout(() => {
            fetchConfigs(currentPage, perPage, sortParam);
            fetchServices();
            fetchUsers();
            fetchConfigsToSort();
            fetchRoutes();
            if ((location.pathname).startsWith("/admin")) setAdmin(true);
        }, 100);
    }, []);

    

    useEffect(() => {
        fetchConfigs(currentPage, perPage, sortParam, userParam, configParam, routeParam);
    }, [currentPage, sortParam, userParam, configParam, routeParam]);

    useEffect(() => {
        fetchConfigs(currentPage, perPage, sortParam);
    }, [perPage]);

    useEffect(() => {
        const handleEsc = (event) => {
            if (event.key === "Escape") setIsServiceModalOpen(false);
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, []);


    const renderAdminServices = () => {
        alert(configsData.items)
        return configsData.items.map(config => (
            <div key={config.id} className="border border-gray-300 rounded-lg dark:border-gray-700 overflow-hidden mb-4">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700 flex-wrap">
                    <div className="flex flex-col gap-1">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200">
                            {config.name}
                        </h3>
                    </div>

                    <div className="flex gap-2">
                        {config.description && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggledescription(config.id);
                                }}
                                className="flex items-center h-11 focus:outline-none text-white bg-indigo-500 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 font-medium rounded-lg text-sm py-2 px-2 transition-all duration-300 group dark:bg-indigo-800 dark:hover:bg-indigo-700 dark:focus:ring-indigo-900"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
                                </svg>
                                {opendescriptionId === config.id ? "Скрыть описание" : "Показать описание"}

                            </button>
                        )}

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleOpenViewPanel(config);
                            }}
                            className="inline-flex items-center h-11 text-white bg-green-400 hover:bg-green-500 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm py-2.5 px-4 me-2 mb-2 dark:bg-green-900 dark:hover:bg-green-800 dark:focus:ring-green-900 transition-colors duration-300"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 mr-1"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                      clipRule="evenodd"/>
                            </svg>
                            Просмотр конфигурации

                        </button>
                    </div>
                </div>

                {opendescriptionId === config.id && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Описание сервиса:
                        </h4>
                        <div className="py-2 px-3 bg-gray-100 dark:bg-gray-700 rounded">
                            <p className="text-gray-800 dark:text-gray-200 text-sm whitespace-pre-line break-normal">
                                {config.description}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        ));
        // return configsData.items.map((service) => (
        //     <div
        //         key={service.id}
        //         className="flex flex-col p-4 border-b border-gray-100 dark:border-gray-700 transition-colors"
        //     >
        //         <div className="flex items-center justify-between">
        //             <div className="flex flex-col gap-2">
        //                 <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200">
        //                     {service.name}
        //                 </h3>  
        //                 <a
        //                     href={service.url}
        //                     target="_blank"
        //                     rel="noopener noreferrer"
        //                     className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        //                     onClick={(e) => e.stopPropagation()}>
        //                     {service.url}
        //                 </a>
        //                 <span className={`w-fit p-2 py-1 text-xs rounded-full ${
        //                     service.available
        //                         ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
        //                         : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        //                 }`}>
        //                     {service.available ? 'Доступен' : 'Недоступен'}
        //                 </span>
        //             </div>
        //             <div className="flex items-center gap-2">
        //                 {service.admin && (
        //                     <button
        //                         onClick={(e) => {
        //                             e.stopPropagation();
        //                             handleOpenAdminPanel(service);
        //                         }}
        //                         className="text-white inline-flex h-11 bg-yellow-500 hover:bg-yellow-600 focus:ring-4 focus:ring-yellow-300 font-medium rounded-lg text-sm py-2.5 px-4 me-2 mb-2 dark:bg-yellow-900 dark:hover:bg-yellow-800 dark:focus:ring-yellow-800 transition-colors duration-300"
        //                     >
        //                         <svg
        //                             xmlns="http://www.w3.org/2000/svg"
        //                             className="h-5 w-5 flex-shrink-0 me-1"
        //                             viewBox="0 0 20 20"
        //                             fill="currentColor"
        //                         >
        //                             <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        //                         </svg>
        //                         Админ-панель
        //                     </button>
        //                 )}

        //                 <Dropdown>
        //                     <Dropdown.Trigger>
        //                         <button
        //                             type="button"
        //                             className="inline-flex justify-center items-center h-11 w-11 bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm py-2.5 me-2 mb-2 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 dark:focus:ring-gray-800 transition-colors duration-300"
        //                         >
        //                             <svg
        //                                 className="h-full w-auto text-center m-0"
        //                                 xmlns="http://www.w3.org/2000/svg"
        //                                 viewBox="0 0 20 20"
        //                                 fill="currentColor"
        //                             >
        //                                 <path
        //                                     d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"
        //                                 />
        //                             </svg>
        //                         </button>
        //                     </Dropdown.Trigger>

        //                     <Dropdown.Content>
        //                         <Dropdown.Link
        //                             as="button"
        //                             onClick={() => handleEditClick(service)}
        //                             className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600"
        //                         >
        //                             <svg
        //                                 xmlns="http://www.w3.org/2000/svg"
        //                                 className="h-5 w-5 mr-2"
        //                                 fill="none"
        //                                 viewBox="0 0 24 24"
        //                                 stroke="currentColor"
        //                             >
        //                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        //                             </svg>
        //                             Изменить
        //                         </Dropdown.Link>

        //                         <Dropdown.Link
        //                             as="button"
        //                             onClick={(e) => {
        //                                 e.stopPropagation();
        //                                 handleDelete(service);
        //                             }}
        //                             className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-600"
        //                         >
        //                             <svg
        //                                 xmlns="http://www.w3.org/2000/svg"
        //                                 className="h-5 w-5 mr-2"
        //                                 fill="none"
        //                                 viewBox="0 0 24 24"
        //                                 stroke="currentColor"
        //                             >
        //                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        //                             </svg>
        //                             Удалить
        //                         </Dropdown.Link>
        //                     </Dropdown.Content>
        //                 </Dropdown>
        //             </div>
        //         </div>
        //     </div>
        // ));
    };

    const usersById = useMemo(() => {
        const map = {};
        console.info("мы тут")
        users.forEach(user => {
            console.info("userinfo")
            console.info(user)
            map[user.id] = user.username; // или user.username, если поле так называется
        });
        return map;
    }, [users]);

    const usersEmailById = useMemo(() => {
        const map = {};
        users.forEach(user => {
            map[user.id] = user.mail; // или user.username, если поле так называется
        });
        return map;
    }, [users]);


    const usersPhotoById = useMemo(() => {
        const map = {};
        users.forEach(user => {
            map[user.id] = user.photo; // или user.username, если поле так называется
        });
        return map;
    }, [users]);

    const configsById = useMemo(() => {
        const map = {};
        configs.forEach(config => {
            map[config.id] = config.name; // или user.username, если поле так называется
        });
        return map;
    }, [configs]);
    

    const routesById = useMemo(() => {
        const map = {};
        routes.forEach(route => {
            map[route.id] = route.name; // или user.username, если поле так называется
        });
        return map;
    }, [routes]);

    const renderUserServices = () => {

        console.info('configData: ')
        console.info(configsData)


        return configsData.items
            .map(config => (
            <div key={config.id} className="border border-gray-300 rounded-lg dark:border-gray-700 overflow-hidden mb-4">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700 flex-wrap">
                    <div className="flex flex-col gap-1">
                        <h3 className="flex flex-row items-center text-lg font-medium text-gray-900 dark:text-gray-200">
                        <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 flex-shrink-0 me-1"
    viewBox="0 0 20 20"
    fill="currentColor"
>
    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
</svg>
                            {`Дата: ${new Date(config.date_time).toLocaleString('ru-RU')}`}
                        </h3>
                        <h3 className="flex flex-row items-center text-lg font-medium text-gray-900 dark:text-gray-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
        </svg>
                            {`Сервис: ${config.service_name}`}
                        </h3>
                        {/* <h3 className="flex flex-row items-center text-lg font-medium text-gray-900 dark:text-gray-200">
                        <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 flex-shrink-0 me-1"
    viewBox="0 0 20 20"
    fill="currentColor"
>
    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
</svg>
                            {`Пользователь: ${usersById[config.user]}`}
                        </h3> */}
                        <h3 className="flex flex-row items-center text-lg font-medium text-gray-900 dark:text-gray-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 me-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clipRule="evenodd" />
                </svg>
                            {`Маршрут: ${routesById[config.route] ? routesById[config.route] : ""}`}
                        </h3>
                        <h3 className="flex flex-row items-center text-lg font-medium text-gray-900 dark:text-gray-200">
                        <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 flex-shrink-0 me-1"
    viewBox="0 0 20 20"
    fill="currentColor"
>
    <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1H8a3 3 0 00-3 3v1.5a1.5 1.5 0 01-3 0V6z" clipRule="evenodd" />
    <path d="M6 12a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2H2h2a2 2 0 002-2v-2z" />
</svg>
                            {`Конфигурация: ${configsById[config.config] ? configsById[config.config] : ""}`}
                        </h3>
                        <h3 className="flex flex-row items-center text-lg font-medium text-gray-900 dark:text-gray-200">
                        <svg
  xmlns="http://www.w3.org/2000/svg"
  className="h-5 w-5 flex-shrink-0 me-1"
  viewBox="0 0 20 20"
  fill="currentColor"
>
  <path
    fill-rule="evenodd"
    d="M10 2a3 3 0 100 6 3 3 0 000-6zM5 14a5 5 0 0110 0v1a2 2 0 01-2 2H7a2 2 0 01-2-2v-1z"
    clip-rule="evenodd"
  />
</svg>
                            {`Тестируемый:`}
                        </h3>
                        <div className="flex-1 ms-5 bg-white dark:bg-gray-800 flex items-center gap-3 rounded-l-full rounded-r-full shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200">
    <Avatar 
        email={usersEmailById[config?.user]} 
        avatarUrl={usersPhotoById[config?.user]} 
        size="xl" 
        className="me-1 ring-2 ring-white dark:ring-gray-700 shadow-sm" 
    />
    <div className="flex-1 py-2 pe-4 rounded-r-4xl">
        <p className="text-base font-semibold text-gray-800 truncate dark:text-gray-100 rounded-r-4xl">
            {usersById[config?.user]}
        </p>
        {usersEmailById[config?.user] && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate rounded-r-4xl">
                {usersEmailById[config?.user]}
            </p>
        )}
    </div>
</div>
                        
                    </div>

                    <div className="flex gap-2">
                        {config.description && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggledescription(config.id);
                                }}
                                className="flex items-center me-3 h-11 focus:outline-none text-white bg-indigo-500 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 font-medium rounded-lg text-sm py-2 px-2 transition-all duration-300 group dark:bg-indigo-800 dark:hover:bg-indigo-700 dark:focus:ring-indigo-900"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
                                </svg>
                                {opendescriptionId === config.id ? "Скрыть описание" : "Показать описание"}

                            </button>
                        )}
                        {config.service_available ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleOpenViewPanel(config);
                            }}
                            className="inline-flex items-center h-11 text-white bg-green-400 hover:bg-green-500 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm py-2.5 px-4 me-2 mb-2 dark:bg-green-900 dark:hover:bg-green-800 dark:focus:ring-green-900 transition-colors duration-300"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 mr-1"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                      clipRule="evenodd"/>
                            </svg>
                            Просмотр результата

                        </button>
                        ) : (
                            <span className='w-fit p-2 py-1 text-xm rounded-full bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100'>
                            Сервис отключен. Просмотр результата невозможен!
                        </span>
                        )}
                    </div>
                </div>

                {opendescriptionId === config.id && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Описание сервиса:
                        </h4>
                        <div className="py-2 px-3 bg-gray-100 dark:bg-gray-700 rounded">
                            <p className="text-gray-800 dark:text-gray-200 text-sm whitespace-pre-line break-normal">
                                {config.description}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        ));
    };

    return (
        <div className="py-12">
            <Helmet>
                <title>Список результатов</title>
            </Helmet>

            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div className="bg-white shadow-sm sm:rounded-lg dark:border-gray-700 dark:bg-gray-800">
                    <div className="p-6 text-gray-900">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h1 className="text-2xl font-bold dark:text-gray-200">Список результатов</h1>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    Всего: { configsData.total} результатов
                                </span>
                                <div className="flex gap-2 mt-2 flex-wrap">
                                    {admin ?
                                        <select
                                            value={sortParam}
                                            onChange={handleSortChange}
                                            className="p-2 rounded-md border dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        >
                                            {SORT_OPTIONS_ADMIN.map((opt) => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select> :
                                        <select
                                            value={sortParam}
                                            onChange={handleSortChange}
                                            className="p-2 rounded-md border dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        >
                                            {SORT_OPTIONS_USER.map((opt) => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                    }
                                    <select
                                        value={perPage}
                                        onChange={handlePerPageChange}
                                        className="p-2 rounded-md border dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    >
                                        {PER_PAGE_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                   
<UserSelect
    users={users}
    value={userParam}
    onChange={handleUserChange}
    placeholder="Выберите пользователя"
/>


<Select
    options={routes}
    value={routeParam}
    onChange={handleRouteChange}
    placeholder="Выберите маршрут"
/>


<Select
    options={configs}
    value={configParam}
    onChange={handleConfigChange}
    placeholder="Выберите конфигурацию"
/>
                                </div>
                            </div>
                        
                        </div>
                        
                        {loading ? (
                            <Spiner />
                        ) : (
                            <>
                                {(configsData.items && configsData.items.length>0) ? (
                                    <div className="space-y-4">
                                        {renderUserServices()}
                                        {<Pagination 
                                            currentPage={configsData.page}
                                            totalPages={configsData.total_pages}
                                            onPageChange={handlePageChange}
                                        />}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-400">Нет конфигураций для отображения</p>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Модальное окно для редактирования/создания сервиса */}
            {isServiceModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md dark:bg-gray-800">
                        <div className="p-6">
                            <h2 className="text-xl font-bold mb-4 dark:text-gray-200">
                                {isCreating ? 'Добавить новый экземпляр сервиса' : 'Редактировать экземпляр сервиса'}
                            </h2>

                            <form onSubmit={handleSubmit(onSubmit)}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Название экземпляра
                                    </label>
                                    <input
                                        type="text"
                                        {...register('name', { required: 'Обязательное поле' })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                    {errors.name && (
                                        <p className="mt-1 text-sm text-red-600 dark:text-red-500">{errors.name.message}</p>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Описание
                                    </label>
                                    <textarea
                                        type="text"
                                        {...register('description')}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                    {errors.name && (
                                        <p className="mt-1 text-sm text-red-600 dark:text-red-500">{errors.name.message}</p>
                                    )}
                                </div>

                                <div>
                                        <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
                                            Сервис:
                                        </label>
                                        {loadingServices ? (
                                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                        ) : (
                                            <select    
                                                {...register('service')}                                                                   
                                                className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                required
                                            >
                                                {services.map((service) => (
                                                    <option key={service.id} value={service.id}>
                                                        {service.name}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                </div>

                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsServiceModalOpen(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                                    >
                                        Отмена
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        {isCreating ? 'Создать' : 'Сохранить'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Модальное окно для админ-панели */}
            {adminPanelUrl && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col dark:bg-gray-800">
                        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                            <h2 className="text-lg font-semibold dark:text-white">Просмотр результата</h2>
                            <button
                                onClick={closeAdminPanel}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex-1 relative">
                            <iframe
                                onLoad={loadServiceHandler}
                                src={adminPanelUrl}
                                className="absolute top-0 left-0 w-full h-full border-none"
                                allowFullScreen
                                title="Admin Panel"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}