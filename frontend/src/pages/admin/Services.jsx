import { useEffect, useState } from "react";
import { api } from "../../api/api.js";
import { toast } from "react-toastify";
import Spiner from "../../Components/Spiner.jsx";
import { Helmet } from "react-helmet";
import { useForm } from "react-hook-form";
import Pagination from "../../Components/Pagination.jsx";
import Dropdown from "../../Components/Dropdown.jsx";
import {useSearchParams} from "react-router-dom";

export default function Services() {
    const [servicesData, setServicesData] = useState({
        items: [],
        total: 0,
        page: 1,
        per_page: 10,
        total_pages: 1
    });
    const [servicesDataUser, setServicesDataUser] = useState({
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
        {value: "name_desc", label: "По убыванию названия"},
        {value: "name_asc", label: "По возрастанию названия"},
        {value: "available_desc", label: "Сначала доступные"},
        {value: "available_asc", label: "Сначала недоступные"},
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
    const [editingService, setEditingService] = useState(null);
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [adminPanelUrl, setAdminPanelUrl] = useState(null);
    const [admin, setAdmin] = useState(false);
    const [openInstructionId, setOpenInstructionId] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const [sortParam, setSortParam] = useState((location.pathname).startsWith("/admin") ? localStorage.getItem('service_sort_admin') || 'name_asc' : localStorage.getItem('service_sort') || 'name_asc');
    const [perPage, setPerPage] = useState((location.pathname).startsWith("/admin") ? parseInt(localStorage.getItem('services_per_page_admin') || 10) : (parseInt(localStorage.getItem('services_per_page'))|| 10));
    const temp = null;
    const currentPage = parseInt(searchParams.get("page")) || 1;

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
            instruction: '',
            available: false,
            admin: false
        },
    });

    const toggleInstruction = (id) => {
        setOpenInstructionId(prevId => (prevId === id ? null : id));
    };

    const fetchServices = async (page = 1, per_page = perPage, sort = sortParam) => {
        try {
            setLoading(true);
            const [field, direction] = sort.split("_");
            if ((location.pathname).startsWith("/admin")){
                setAdmin(true);
                const responseAdmin = await api.getServices(page, per_page, field, direction);
                setServicesData(responseAdmin.data);
            }
            else{
                const responseUser = await api.getAvailableServices(page, per_page, field, direction);
                setServicesDataUser(responseUser.data)               
            }
        } catch (error) {
            if (error?.status != 401)
                toast.error((error?.message || 'Ошибка при получении данных с сервера.') + ` Код ошибки: ${error?.status}`, {toastId: "unique-message-5"});
            console.error('Ошибка при загрузке сервисов:', error);
        } finally {
            setLoading(false);
        }
    };


    const handleCreateClick = () => {
        setIsCreating(true);
        setEditingService(null);
        reset({
            name: '',
            url: '',
            instruction: '',
            available: false,
            admin: false
        });
        setIsServiceModalOpen(true);
    };

    const handleEditClick = (service) => {
        setIsCreating(false);
        setEditingService(service);
        setValue('name', service.name);
        setValue('url', service.url);
        setValue('instruction', service.instruction);
        setValue('available', service.available);
        setValue('admin', service.admin);
        setIsServiceModalOpen(true);
    };

    const handleOpenAdminPanel = (service) => {
        const baseUrl = service.url.replace(/\/$/, '');
        if (admin) setAdminPanelUrl(`${baseUrl}/admin`);
        else setAdminPanelUrl(`${baseUrl}`);
    };

    const closeAdminPanel = () => {
        setAdminPanelUrl(null);
    };

    const onSubmit = async (data) => {
        try {
            let response;
            if (isCreating) {
                const dataToCreate = {
                    name: data.name,
                    url: data.url,
                    instruction: data.instruction,
                    available: Boolean(data.available),
                    admin: Boolean(data.admin)
                };
                response = await api.createService(dataToCreate);
                toast.success('Сервис успешно создан');
            } else {
                const dataToSend = {
                    id: Number(editingService.id),
                    name: data.name,
                    url: data.url,
                    instruction: data.instruction,
                    available: Boolean(data.available),
                    admin: Boolean(data.admin)
                };
                response = await api.updateService(dataToSend);
                toast.success('Сервис успешно обновлен');
            }

            if (response.data) {
                fetchServices(currentPage, perPage, sortParam);
                setIsServiceModalOpen(false);
            }
        } catch (error) {
            console.error('Full error:', error);
            if (error?.status != 401)
                toast.error(error.response?.data?.detail || `Ошибка при ${isCreating ? 'создании' : 'обновлении'} сервиса`, {toastId: "unique-message-6"});
        }
    };

    const handleDelete = async (service) => {
        if (!service?.instruction){
            service.instruction = "";
        }
        try {
            const response = await api.deleteService(service);
            if (response?.data?.active){
                toast.success('Сервис успешно включён');
            }
            else{
                toast.success('Сервис успешно отключён');
            }
            
            fetchServices(currentPage, servicesData.per_page, sortParam);
        } catch (error) {
            if (error?.status != 401)
                toast.error(error.response?.data?.detail || 'Ошибка при удалении сервиса', {toastId: "unique-message-7"});
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

    const loadServiceHandler = (e) => {
        if (admin) {
            e.target.contentWindow.postMessage('secret_key', '*');
        }
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchServices(currentPage, perPage, sortParam);
            if (location.pathname.startsWith("/admin")) {
                setAdmin(true);
            } else {
                setAdmin(false);
            }
        }, 100);
    
        return () => clearTimeout(timer);
    }, [currentPage, perPage, sortParam]);

 
    useEffect(() => {
        const handleEsc = (event) => {
            if (event.key === "Escape") setIsServiceModalOpen(false);
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, []);


    const renderAdminServices = () => {
        return servicesData.items.map((service) => (
            <div
                key={service.id}
                className="flex flex-col p-4 border-b border-gray-100 dark:border-gray-700 transition-colors"
            >
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-2">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200">
                            {service.name}
                        </h3>  
                        <a
                            href={service.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            onClick={(e) => e.stopPropagation()}>
                            {service.url}
                        </a>
                        <span className={`w-fit p-2 py-1 text-xs rounded-full ${
                            service.available
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                            {service.available ? 'Доступен' : 'Недоступен'}
                        </span>
                        {service.admin && (
                        <span className='w-fit p-2 py-1 text-xs rounded-full bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'>
                            Специально разработанный
                        </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                      

                        <Dropdown>
                            <Dropdown.Trigger>
                                <button
                                    type="button"
                                    className="inline-flex justify-center items-center h-11 w-11 bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm py-2.5 me-2 mb-2 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 dark:focus:ring-gray-800 transition-colors duration-300"
                                >
                                    <svg
                                        className="h-full w-auto text-center m-0"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"
                                        />
                                    </svg>
                                </button>
                            </Dropdown.Trigger>

                            <Dropdown.Content>
                                <Dropdown.Link
                                    as="button"
                                    onClick={() => handleEditClick(service)}
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5 mr-2"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Изменить
                                </Dropdown.Link>

                                <Dropdown.Link
                                    as="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(service);
                                    }}
                                    className={`flex items-center px-4 py-2 text-sm ${service?.available ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"} hover:bg-gray-100 dark:hover:bg-gray-600`}
                                >
                             <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M18.36 6.64A9 9 0 1 1 5.64 5.64" />
  <path d="M12 2v10" />
</svg>
                                    {service?.available ? 'Отключить' : 'Включить'}
                                </Dropdown.Link>
                            </Dropdown.Content>
                        </Dropdown>
                    </div>
                </div>
            </div>
        ));
    };

    const renderUserServices = () => {
        return servicesDataUser.items
            .filter(service => service.available)
            .map(service => (
            <div key={service.id} className="overflow-visible border border-gray-300 rounded-lg dark:border-gray-700 overflow-hidden mb-4">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700 flex-wrap">
                    <div className="flex flex-col gap-1">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200">
                            {service.name}
                        </h3>
                        {service.admin && (
                        <div className="flex items-center gap-2">
                            <span className='w-fit p-2 py-1 text-xm rounded-full bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'>
                                Специально разработанный
                            </span>
                            <div className="relative group">
                                <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    className="h-5 w-5 text-blue-600 dark:text-blue-400 cursor-help" 
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    stroke="currentColor"
                                >
                                    <path 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth={2} 
                                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                                    />
                                </svg>
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 whitespace-nowrap z-50 shadow-lg z-0">
                                    Предпросмотр специально разработанных сервисов доступен через создание новой конфигурации
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                                        <div className="border-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        )}
                    </div>
    
                    <div className="flex gap-2">
                        {service.instruction && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleInstruction(service.id);
                                }}
                                className="flex items-center me-2 h-11 focus:outline-none text-white bg-indigo-500 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 font-medium rounded-lg text-sm py-2 px-2 transition-all duration-300 group dark:bg-indigo-800 dark:hover:bg-indigo-700 dark:focus:ring-indigo-900"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
                                </svg>
                                {openInstructionId === service.id ? "Скрыть описание" : "Показать описание"}
    
                            </button>
                        )}
                        {!service.admin && (
    <button
    onClick={(e) => {
        e.stopPropagation();
        handleOpenAdminPanel(service);
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
    Просмотр сервиса
    
    </button>
                        )}
                       
                    </div>
                </div>
    
                {openInstructionId === service.id && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Описание сервиса:
                        </h4>
                        <div className="py-2 px-3 bg-gray-100 dark:bg-gray-700 rounded">
                            <p className="text-gray-800 dark:text-gray-200 text-sm whitespace-pre-line break-normal">
                                {service.instruction}
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
                <title>Список сервисов</title>
            </Helmet>

            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div className="bg-white shadow-sm sm:rounded-lg dark:border-gray-700 dark:bg-gray-800">
                    <div className="p-6 text-gray-900">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h1 className="text-2xl font-bold dark:text-gray-200">Список сервисов</h1>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    Всего: {admin ? servicesData.total : servicesDataUser.total} сервисов
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
                                </div>
                            </div>
                            {admin && (
                                <button
                                title="Добавить сервис"
                                    onClick={handleCreateClick}
                                    className="flex items-center focus:outline-none text-white bg-green-400 hover:bg-green-500 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm py-2.5 px-2.5 me-2 mb-2 dark:bg-green-900 dark:hover:bg-green-800 dark:focus:ring-green-700 transition-all duration-500 me-5"
                                >
                                    <svg 
                                        xmlns="http://www.w3.org/2000/svg" 
                                        className="h-5 w-5 flex-shrink-0" 
                                        fill="none" 
                                        viewBox="0 0 24 24" 
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </button>
                            )}
                        </div>
                        
                        {loading ? (
                            <Spiner />
                        ) : (
                            <>
                                {(servicesData.items && servicesData.items.length>0) || (servicesDataUser.items && servicesDataUser.items.length>0) ? (
                                    <div className="space-y-4">
                                        {admin ? renderAdminServices() : renderUserServices()}
                                        {admin ? 
                                        <Pagination 
                                            currentPage={servicesData.page}
                                            totalPages={servicesData.total_pages}
                                            onPageChange={handlePageChange}
                                        /> : 
                                        <Pagination 
                                            currentPage={servicesDataUser.page}
                                            totalPages={servicesDataUser.total_pages}
                                            onPageChange={handlePageChange}
                                        />}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-400">Нет сервисов для отображения</p>
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
                                {isCreating ? 'Добавить новый сервис' : 'Редактировать сервис'}
                            </h2>

                            <form onSubmit={handleSubmit(onSubmit)}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Название сервиса
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
                                        URL сервиса
                                    </label>
                                    <input
                                        type="text"
                                        {...register('url', {
                                            required: 'Обязательное поле',
                                            pattern: {
                                                value: /^(https?:\/\/)?(www\.)?(([a-zA-Z0-9-]+\.){1,}[a-zA-Z]{2,}|(\d{1,3}\.){3}\d{1,3})(:\d{1,5})?(\/[^\s?#]*)?(\?[^#\s]*)?(#\S*)?$/i,
                                                message: "Не является адресом сервиса"
                                            }
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                    {errors.url && (
                                        <p className="mt-1 text-sm text-red-600 dark:text-red-500">{errors.url.message}</p>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Инструкция прохождения
                                    </label>
                                    <textarea
                                        type="text"
                                        {...register('instruction')}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                    {errors.name && (
                                        <p className="mt-1 text-sm text-red-600 dark:text-red-500">{errors.name.message}</p>
                                    )}
                                </div>
                                {isCreating && (
                                <div className="mb-4 flex items-center">
                                    <input
                                        type="checkbox"
                                        id="available-checkbox"
                                        {...register('available')}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                                    />
                                    <label htmlFor="available-checkbox" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                        Доступен
                                    </label>
                                </div>
)}
                                <div className="mb-4 flex items-center">
                                    <input
                                        type="checkbox"
                                        id="admin-checkbox"
                                        {...register('admin')}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                                    />
                                    <label htmlFor="admin-checkbox" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                        Специально разработанный сервис
                                    </label>
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
                            <h2 className="text-lg font-semibold dark:text-white">{admin ? "Админ-панель сервиса" : "Окно сервиса"}</h2>
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