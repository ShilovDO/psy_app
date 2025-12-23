import { useState, useEffect } from "react";
import { api } from "../../api/api.js";
import { toast } from "react-toastify";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet";

export default function CreateRoute() {
    const { routeId } = useParams();
    const [routeName, setRouteName] = useState("");
    const [stations, setStations] = useState([]);
    const [deletedStations, setDeletedStations] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingServices, setLoadingServices] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {

        const fetchStations = async () => {
            if (routeId){
                const stationsResponse = await api.getStations(routeId);
                const stationsData = stationsResponse.data;
                const route = await api.getRoute(routeId);
                const routeData = route.data;
                setStations(stationsData);
                setRouteName(routeData.name);
            }
            else {
                setStations([]);
                setRouteName("");
            }
        }

        const fetchServices = async () => {
            try {
                setLoadingServices(true);
                const response = await api.getAllConfigForRoute();
                if (response?.data) {
                    setServices(response.data);
                }
            } catch (error) {
                toast.error("Не удалось загрузить список сервисов");
                console.error("Ошибка загрузки сервисов:", error);
            } finally {
                setLoadingServices(false);
            }
        };

        fetchStations();
        fetchServices();
    }, [location]);

    const addStation = () => {
        setStations([...stations, {
            number: stations.length + 1,
            config: services.length > 0 ? services[0].id : "",
            next: stations.length + 2,
            description: "",
            entry: false
        }]);
    };

    const removeStation = (index) => {
        const updatedStations = [...stations];

        setDeletedStations([...deletedStations, updatedStations[index]])

        updatedStations.splice(index, 1);
        setStations(updatedStations.map((station, idx) => ({
            ...station,
            number: idx + 1,
            next: idx + 2 > updatedStations.length ? null : idx + 2
        })));
    };

    const updateStation = (index, field, value) => {
        const updatedStations = [...stations];
        updatedStations[index][field] = value;
        setStations(updatedStations);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!routeName.trim()) {
            toast.error("Введите название маршрута");
            return;
        }

        if (stations.length === 0) {
            toast.error("Добавьте хотя бы одну станцию");
            return;
        }

        try {
            setLoading(true);


            if(routeId){

                await api.changeRoute({id: routeId, name: routeName});

                for (const station of stations) {
                    let data_stations = {
                        id: station.id,
                        number: station.number,
                        config: station.config,
                        next: station.number === stations.length ? 0 : station.number + 1,
                        description: station.description,
                        entry: false
                    }
                    alert(data_stations.id)
                    if (data_stations.id !== undefined)
                    {
                        await api.changeStation(data_stations);
                    }
                    else
                    {
                        data_stations = {
                            route_id: routeId,
                            number: station.number,
                            config: station.config,
                            next: station.number === stations.length ? 0 : station.number + 1,
                            entry: false,
                            description: station.description,
                            entry: false
                        }
                        await api.createStation(data_stations);
                    }
                }
                
                for (const deleted_station of deletedStations){
                    await api.deleteStation(deleted_station.id);
                }
            }
            else{

                const routeResponse = await api.createRoute({ name: routeName });
                const route_id = routeResponse.data.id;
                
                for (const station of stations) {
                    const data_stations = {
                        route_id: route_id,
                        number: station.number,
                        config: station.config,
                        next: station.number === stations.length ? 0 : station.number + 1,
                        entry: false,
                        description: station.description
                    }
                    await api.createStation(data_stations);
                }
                
            }
            toast.success("Маршрут успешно создан");
            navigate("/routes");
        } catch (error) {
            console.error("Ошибка при создании маршрута:", error);
            toast.error(error.response?.data?.detail || "Ошибка при создании маршрута");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        //console.log()
        //alert(JSON.stringify(services));
    }, [services]);
    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            <Helmet>
                <title>Создание маршрута</title>
            </Helmet>
            {/* Боковая панель настроек */}
            <div className="w-1/3 p-6 overflow-y-auto bg-white dark:bg-gray-800 shadow-lg">
                {!routeId ? 
                <h1 className="text-2xl font-bold mb-6 dark:text-gray-200">Создание маршрута</h1> : 
                <h1 className="text-2xl font-bold mb-6 dark:text-gray-200">Изменение маршрута</h1>}
                      
                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Название маршрута:
                        </label>
                        <input
                            type="text"
                            value={routeName}
                            onChange={(e) => setRouteName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            required
                        />
                    </div>
                    
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300">
                                Станции маршрута:
                            </h2>
                            <button
                                type="button"
                                onClick={addStation}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                            >
                                Добавить станцию
                            </button>
                        </div>
                        
                        {stations.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-400 mb-4">Нет добавленных станций</p>
                        ) : (
                            <div className="space-y-4 mb-4">
                                {stations.map((station, index) => (
                                    <div key={index} className="p-3 border border-gray-200 rounded-md dark:border-gray-600 relative">
                                        <button
                                            type="button"
                                            onClick={() => removeStation(index)}
                                            className="absolute top-2 right-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                            title="Удалить станцию"
                                        >
                                            ×
                                        </button>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
                                                    Номер:
                                                </label>
                                                <input
                                                    disabled="true"
                                                    type="text"
                                                    value={station.number}
                                                    onChange={(e) => updateStation(index, 'number', parseInt(e.target.value))}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                    required
                                                    min="1"
                                                />
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
                                                    Сервис:
                                                </label>
                                                {loadingServices ? (
                                                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                                ) : (
                                                    <select
                                                        value={station.config}
                                                        onChange={(e) => updateStation(index, 'config', e.target.value)}
                                                        className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                        required
                                                    >
                                                        {services.map((config) => (
                                                            <option key={config.id} value={config.id}>
                                                                {config.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
                                                Описание:
                                            </label>
                                            <textarea
                                                type="text"
                                                value={station.description}
                                                onChange={(e) => updateStation(index, 'description', e.target.value)}
                                                className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            />
                                        </div>

                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => navigate("/routes")}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {loading ? "Создание..." : routeId ? "Изменить маршрут": "Создать маршрут"}
                        </button>
                    </div>
                </form>
            </div>

            {/* Основное поле с визуализацией маршрута */}
            <div className="flex-1 p-6 overflow-y-auto">
                <h2 className="text-xl font-semibold mb-4 dark:text-gray-200">Визуализация маршрута</h2>
                
                {stations.length === 0 ? (
                    <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <p className="text-gray-500 dark:text-gray-400">Добавьте станции, чтобы увидеть маршрут</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <div className="relative w-full max-w-2xl">
                            {/* Линия маршрута */}
                            <div className="absolute left-8 top-0 bottom-0 w-1 bg-blue-500 dark:bg-blue-400"></div>
                            
                            {stations.map((station, index) => (
                                <div key={index} className="relative flex items-center mb-8 ml-12">
                                    {/* Кружок станции */}
                                    <div className="flex-shrink-0 w-16 h-16 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center text-white font-bold text-xl z-10">
                                        {station.number}
                                    </div>
                                    
                                    {/* Название сервиса */}
                                    <div className="ml-4 p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
                                        <p className="font-medium dark:text-gray-200">
                                            {(() => {
                                                for (const config of services) {
                                                    if (config.id == station.config) {
                                                        return config.name;
                                                    }
                                                }
                                                return "Неизвестный сервис";
                                            })()}
                                        </p>
                                    </div>
                                    
                                    {/* Стрелка (кроме последней станции) */}
                                    {index < stations.length - 1 && (
                                        <div className="absolute left-8 top-16 w-1 h-8 bg-blue-500 dark:bg-blue-400"></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}