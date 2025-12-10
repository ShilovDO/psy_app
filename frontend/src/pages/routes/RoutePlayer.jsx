import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../api/api.js";
import { toast } from "react-toastify";
import Spiner from "../../Components/Spiner.jsx";
import { Helmet } from "react-helmet";
import { motion, AnimatePresence } from "framer-motion";
import { Confetti } from "@neoconfetti/react";

export default function RoutePlayer() {
    const { routeId } = useParams();
    const navigate = useNavigate();
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentStationIndex, setCurrentStationIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [completedStations, setCompletedStations] = useState([]);
    const [routeName, setRouteName] = useState("");
    const [showCompletionModal, setShowCompletionModal] = useState(false);
    const [showStationModal, setShowStationModal] = useState(false);
    const [showUnavailableModal, setShowUnavailableModal] = useState(false);
    const iframeRef = useRef(null);


    // Загрузка данных маршрута
    useEffect(() => {
        const fetchRouteData = async () => {
            try {
                setLoading(true);

                // Получаем информацию о маршруте
                const routeResponse = await api.getAllRoutes(1, Number.MAX_SAFE_INTEGER);
                const route = routeResponse.data.items.find(r => r.id === Number(routeId));
                if (route) setRouteName(route.name);

                // Получаем станции маршрута
                const stationsResponse = await api.getStations(routeId);
                const stationsData = stationsResponse.data;

                // Проверяем, все ли станции уже пройдены
                const allCompleted = stationsData.every(station => station.entry);

                // Если все пройдены или нет станций, сбрасываем статус
                if (allCompleted || stationsData.length === 0) {
                    const resetStations = stationsData.map(station => ({
                        ...station,
                        entry: false
                    }));
                    setStations(resetStations);
                } else {
                    // Находим первую непройденную станцию
                    const firstIncompleteIndex = stationsData.findIndex(station => !station.entry);
                    setStations(stationsData);
                    setCurrentStationIndex(firstIncompleteIndex >= 0 ? firstIncompleteIndex : 0);
                }

            } catch (error) {
                toast.error("Ошибка при загрузке маршрута");
                console.error(error);
                navigate("/routes");
            } finally {
                setLoading(false);
            }
        };

        fetchRouteData();
    }, [routeId, navigate]);

    
    useEffect(() => {
        if (showStationModal && iframeRef.current) {
            iframeRef.current.contentWindow.postMessage(
                { type: "MODAL_OPENED", station: currentStation },
                "*"
            );
        }
    }, [showStationModal]);

    const currentStation = stations[currentStationIndex];

    // Обработчик перехода к следующей станции
    const handleNextStation = async () => {
        try {
            if (currentStationIndex < stations.length - 1) {
                setIsTransitioning(true);

                // Обновляем статус станции через бекенд
                await api.changeStation({
                    route_id: currentStation.route,
                    number: currentStation.number,
                    entry: true,
                    next: currentStation.next,
                    service: currentStation.service,
                    description: currentStation.description || ""
                });

                // Обновляем локальное состояние
                const updatedStations = [...stations];
                updatedStations[currentStationIndex].entry = true;
                setStations(updatedStations);

                // Добавляем текущую станцию в список завершенных
                setCompletedStations(prev => [...prev, stations[currentStationIndex]]);

                // Задержка для анимации перед переходом
                setTimeout(() => {
                    setCurrentStationIndex(prev => prev + 1);
                    setIsTransitioning(false);
                    
                    // Проверяем доступность следующей станции
                    if (stations[currentStationIndex + 1]?.available === false) {
                        setShowUnavailableModal(true);
                    }
                }, 500);
            } else {
                // Маршрут завершен - обновляем последнюю станцию
                await api.changeStation({
                    route_id: currentStation.route,
                    number: currentStation.number,
                    entry: true,
                    next: currentStation.next,
                    service: currentStation.service,
                    description: currentStation.description || ""
                });

                // Обновляем локальное состояние
                const updatedStations = [...stations];
                updatedStations[currentStationIndex].entry = true;
                setStations(updatedStations);

                setShowCompletionModal(true);
            }
        } catch (error) {
            toast.error("Ошибка при обновлении статуса станции");
            console.error(error);
            setIsTransitioning(false);
        }
    };

    // Пропустить недоступную станцию
    const handleSkipUnavailableStation = async () => {
        try {
            setIsTransitioning(true);
            
            // Помечаем станцию как пройденную
            await api.changeStation({
                route_id: currentStation.route,
                number: currentStation.number,
                entry: true,
                next: currentStation.next,
                service: currentStation.service,
                description: currentStation.description || ""
            });

            // Обновляем локальное состояние
            const updatedStations = [...stations];
            updatedStations[currentStationIndex].entry = true;
            setStations(updatedStations);

            setCompletedStations(prev => [...prev, stations[currentStationIndex]]);
            setShowUnavailableModal(false);

            // Переходим к следующей станции
            setTimeout(() => {
                setCurrentStationIndex(prev => prev + 1);
                setIsTransitioning(false);
            }, 500);
        } catch (error) {
            toast.error("Ошибка при обновлении статуса станции");
            console.error(error);
            setIsTransitioning(false);
        }
    };

    // Обработчик завершения маршрута
    const handleCompleteRoute = async () => {
        try {
            // Сбрасываем все станции в непройденные через бекенд
            for (const station of stations) {
                await api.changeStation({
                    route_id: station.route,
                    number: station.number,
                    entry: false,
                    next: station.next,
                    service: station.service,
                    description: currentStation.description || ""
                });
            }

            // Обновляем локальное состояние
            const resetStations = stations.map(station => ({
                ...station,
                entry: false
            }));
            setStations(resetStations);

            setShowCompletionModal(false);
            toast.success("Маршрут успешно завершен!");
            navigate("/routes");
        } catch (error) {
            toast.error("Ошибка при завершении маршрута");
            console.error(error);
        }
    };

    // Обработчик выхода из маршрута
    const handleExitRoute = () => {
        if (window.confirm("Вы уверены, что хотите прервать прохождение маршрута?")) {
            navigate("/routes");
        }
    };

    // Обработчик открытия станции
    const handleOpenStation = () => {
        if (currentStation?.available === false) {
            setShowUnavailableModal(true);
        } else {
            setShowStationModal(true);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Spiner />
            </div>
        );
    }

    if (!stations || stations.length === 0) {
        return (
            <div className="w-full text-center py-5">
                <div className="bg-white rounded-lg shadow-md p-6 dark:bg-gray-800 dark:text-gray-200">
                    <p className="text-gray-500 mb-4">Нет станций для этого маршрута</p>
                    <button 
                        onClick={() => navigate("/routes")}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors"
                    >
                        Вернуться к списку маршрутов
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <Helmet>
                <title>Прохождение маршрута: {routeName}</title>
            </Helmet>

            {/* Шапка с названием маршрута */}
            <div className="bg-white shadow-sm py-3 px-4 dark:bg-gray-800 dark:text-gray-100">
                <div className="flex justify-between items-center max-w-7xl mx-auto">
                    <h1 className="text-xl font-semibold text-gray-800 truncate max-w-xs md:max-w-md dark:text-gray-200">
                        {routeName}
                    </h1>
                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                        Станция {currentStationIndex + 1} из {stations.length}
                    </span>
                </div>
            </div>

            {/* Прогресс-бар */}
            <div className="bg-white shadow-sm py-4 px-4 dark:bg-gray-800 dark:text-gray-200">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between space-x-4">
                        <button 
                            onClick={handleExitRoute}
                            className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            Выйти
                        </button>

                        {/* Отображение станций в виде кружков с переносом на новую строку */}
                        <div className="flex-1 overflow-x-auto py-2">
                            <div className="flex flex-wrap items-center justify-center gap-4 min-w-max">
                                {stations.map((station, index) => (
                                    <div key={index} className="flex flex-col items-center">
                                        <motion.div
                                            className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all ${
                                                index < currentStationIndex 
                                                    ? "bg-green-500 text-white" 
                                                    : index === currentStationIndex 
                                                        ? station.available === false 
                                                            ? "bg-yellow-500 text-white ring-4 ring-yellow-300" 
                                                            : "bg-blue-600 text-white ring-4 ring-blue-300" 
                                                        : "bg-gray-200 dark:bg-gray-600"
                                            }`}
                                        >
                                            {station.number}
                                            {station.available === false && index === currentStationIndex && (
                                                <span className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                                    !
                                                </span>
                                            )}
                                        </motion.div>
                                        <span className="text-xs mt-1 text-gray-500 dark:text-gray-400 truncate max-w-20">
                                            {station.service_name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {!currentStation.entry && currentStation.available ? (
                            <motion.button 
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleOpenStation}
                                className="px-6 py-2 rounded-lg font-medium text-white shadow-md bg-blue-600 hover:bg-blue-700 transition-all"
                            >
                                Пройти станцию
                            </motion.button>
                        ) : 
                        (
                            ""
                        )}

                        {currentStationIndex === stations.length - 1 && currentStation.entry && (
                            <motion.button 
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setShowCompletionModal(true)}
                                className="px-6 py-2 rounded-lg font-medium text-white shadow-md bg-green-600 hover:bg-green-700 transition-all"
                            >
                                Завершить маршрут
                            </motion.button>
                        )}
                    </div>
                </div>
            </div>

            {/* Основное содержимое - информация о станции */}
            <div className="flex-1 overflow-y-auto bg-white p-6 dark:bg-gray-800 dark:text-gray-200">
                <div className="max-w-7xl mx-auto">
                    {currentStation?.available === false ? (
                        <div className="bg-yellow-50 rounded-lg p-6 mb-6 dark:bg-gray-700 border-l-4 border-yellow-400">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200">
                                        Станция временно недоступна
                                    </h3>
                                    <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                                        <p>
                                            В настоящее время эта станция находится на техническом обслуживании или временно недоступна.
                                            Вы можете пропустить ее и перейти к следующей станции.
                                        </p>
                                    </div>
                                    <div className="mt-4">
                                        <button
                                            type="button"
                                            onClick={handleSkipUnavailableStation}
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                                        >
                                            Пропустить станцию
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-blue-50 rounded-lg p-6 mb-6 dark:bg-gray-700">
                            <h2 className="text-xl font-semibold mb-2">
                                <span className="text-blue-600 dark:text-blue-400">Станция {currentStation.number}:</span> {currentStation.service_name}
                            </h2>
                            <p className="text-gray-700 dark:text-gray-300">
                                Пройдите станцию, нажав кнопку "Пройти станцию" выше. После выполнения задания нажмите "Следующая станция".
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-700">
                            <h2 className="font-bold text-lg mb-3">Описание станции</h2>
                            <div>
                                {currentStation?.description ? (currentStation?.description.split('\n').map((paragraph, index) => (
                                    <p className="text-gray-600 dark:text-gray-300" key={index}>{paragraph}</p>))) : (
                                    "Описание отсутствует"
                                )}
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-700">
                            <h2 className="font-bold text-lg mb-3">Инструкция</h2>
                            <p className="text-gray-600 dark:text-gray-300">
                                {currentStation.instruction || "Инструкция отсутствует"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Модальное окно станции с iframe */}
            <AnimatePresence>
                {showStationModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="bg-white rounded-xl shadow-xl w-full max-w-6xl h-[90vh] flex flex-col dark:bg-gray-800"
                        >
                            <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                                <h2 className="text-lg font-semibold dark:text-white">
                                    Станция {currentStation.number}: {currentStation.service_name}
                                </h2>
                                <button
                                    onClick={() => setShowStationModal(false)}
                                    className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="flex-1 relative">
                                <iframe
                                    ref={iframeRef}
                                    src={currentStation.url}
                                    title={`Станция ${currentStation.number}`}
                                    className="absolute inset-0 w-full h-full border-0"
                                    allow="fullscreen"
                                    loading="eager"
                                />
                            </div>
                            <div className="p-4 border-t dark:border-gray-700 flex justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setShowStationModal(false);
                                        handleNextStation();
                                    }}
                                    className={`flex items-center px-3 py-2 rounded-md text-sm text-white ${currentStationIndex < stations.length - 1 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700' } transition-all duration-500 overflow-hidden max-w-10 hover:max-w-[180px] group`}
                                >
                                    {currentStationIndex < stations.length - 1 ? (
                                        <>
                                            <svg 
                                                xmlns="http://www.w3.org/2000/svg" 
                                                className="h-5 w-5 flex-shrink-0" 
                                                fill="none" 
                                                viewBox="0 0 24 24" 
                                                stroke="currentColor"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                            </svg>
                                            <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                                                Следующая станция
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <svg 
                                                xmlns="http://www.w3.org/2000/svg" 
                                                className="h-5 w-5 flex-shrink-0" 
                                                fill="none" 
                                                viewBox="0 0 24 24" 
                                                stroke="currentColor"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                                                Завершить маршрут
                                            </span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Модальное окно завершения маршрута */}
            <AnimatePresence>
                {showCompletionModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowCompletionModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative overflow-hidden dark:bg-gray-800 dark:text-gray-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Confetti />
                            <div className="text-center">
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-200 mb-2">
                                    Маршрут успешно завершен!
                                </h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500 dark:text-gray-300">
                                        Поздравляем! Вы успешно прошли все станции маршрута "{routeName}".
                                    </p>
                                </div>
                                <div className="mt-5">
                                    <button
                                        type="button"
                                        className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                                        onClick={handleCompleteRoute}
                                    >
                                        Отлично!
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Модальное окно недоступной станции */}
            <AnimatePresence>
                {showUnavailableModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative dark:bg-gray-800 dark:text-gray-200"
                        >
                            <div className="text-center">
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                                    <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-200 mb-2">
                                    Станция временно недоступна
                                </h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500 dark:text-gray-300">
                                        Станция "{currentStation?.service_name}" в настоящее время находится на техническом обслуживании или временно недоступна.
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-300 mt-2">
                                        Вы можете пропустить эту станцию и перейти к следующей.
                                    </p>
                                </div>
                                <div className="mt-5 flex justify-center space-x-3">
                                    <button
                                        type="button"
                                        className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                                        onClick={() => setShowUnavailableModal(false)}
                                    >
                                        Отмена
                                    </button>
                                    <button
                                        type="button"
                                        className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-yellow-600 text-base font-medium text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 sm:text-sm"
                                        onClick={handleSkipUnavailableStation}
                                    >
                                        Пропустить станцию
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}