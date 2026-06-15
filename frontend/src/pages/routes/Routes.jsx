import {useEffect, useState} from "react";
import {useContext} from "react";
import {api} from "../../api/api.js";
import {toast} from "react-toastify";
import Spiner from "../../Components/Spiner.jsx";
import {Helmet} from "react-helmet";
import {useNavigate, useSearchParams} from "react-router-dom";
import Pagination from "../../Components/Pagination.jsx";
import Dropdown from "../../Components/Dropdown.jsx";
import Avatar from "../../Components/Avatar.jsx";
import UseThemeContext from "../../hooks/useThemeContext.js";




const PER_PAGE_OPTIONS = [
    { value: 5, label: "5 записей" },
    { value: 10, label: "10 записей" },
    { value: 20, label: "20 записей" },
    { value: 50, label: "50 записей" }
];

const SORT_OPTIONS = [
  {value: "name_desc", label: "По убыванию названия"},
  {value: "name_asc", label: "По возрастанию названия"},
  {value: "id_desc", label: "Сначала новее"},
  {value: "id_asc", label: "Сначала старее"},
];
const VISIBLE_OPTIONS = [
  {value: "visibled", label: "Активные"},
  {value: "hided", label: "Скрытые"},
  {value: "all", label: "Любой видимости"}
];

const ROUTE_TYPE_OPTIONS = [
  {value: "all", label: "С любым типом"},
  {value: "own", label: "Мои"},
  {value: "shared", label: "Доступные мне"}
];

export default function AppRoutes() {
  const context = useContext(UseThemeContext);
  // Берём state пользователя для взятия из него информации
  const { user, getInfoBase } = context;

  const [routesData, setRoutesData] = useState({
    items: [],
    total: 0,
    page: 1,
    per_page: 10,
    total_pages: 1,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stations, setStations] = useState({});
  const [loadingStations, setLoadingStations] = useState({});
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortParam, setSortParam] = useState(localStorage.getItem('routes_sort') || 'name_asc');
  const [visibleParam, setVisibleParam] = useState(localStorage.getItem('routes_visible_param') || 'visibled');
  const [routeTypeParam, setRouteTypeParam] = useState(localStorage.getItem('routes_route_type_param') || 'all');
  const navigate = useNavigate();
  const [perPage, setPerPage] = useState(parseInt(localStorage.getItem('users_per_page_route') || 10));
  const [filtersUsed, setFiltersUsed] = useState((localStorage.getItem('routes_sort') || localStorage.getItem('routes_visible_param') || localStorage.getItem('users_per_page_route') || localStorage.getItem('users_per_page_route'))  ? true : false);
  const [usersSearchOut, setUsersSearchOut] = useState([]);
  const [usersSearchIn, setUsersSearchIn] = useState([]);
  const [searchOut, setSearchOut] = useState("");
  const [searchIn, setSearchIn] = useState("");
  const [currentRoute, setCurrentRoute] = useState(null);
  let currentPage = parseInt(searchParams.get("page")) || 1;

  useEffect(() => {
    getInfoBase();
    const handleEsc = (event) => {
        if (event.key === "Escape") setIsModalOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
}, []);

  const fetchRoutes = async (page = 1, per_page = perPage, sort = "id_asc", visibleParam = "visibled", routeTypeParam = "all") => {
    try {
      setLoading(true);
      const [field, direction] = sort.split("_");

      const response = await api.getAllRoutes(page, per_page, field, direction, visibleParam, routeTypeParam);
      if (response?.data) {
        setRoutesData(response.data);
      } else {
        setRoutesData(prev => ({...prev, items: []}));
        // toast.error("Не удалось получить список маршрутов");
        throw new Error("Не удалось получить список маршрутов");
      }
    } catch (error) {
        if (error.status != 401){
          toast.error(error?.message || "Ошибка при получении данных с сервера.", {toastId: "unique-message-47"});
        }     
        console.error("Ошибка при загрузке маршрутов:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePerPageChange = (e) => {
    const newPerPage = parseInt(e.target.value);
    setPerPage(newPerPage);
    setFiltersUsed(true);
    localStorage.setItem('users_per_page_user', newPerPage.toString());
    setSearchParams({ page: 1 });
  };

  const fetchStationsForRoute = async (routeId) => {
    // Если станции уже загружены для этого маршрута - сворачиваем их
    if (stations[routeId]) {
      setStations(prev => {
        const newStations = {...prev};
        delete newStations[routeId];
        return newStations;
      });
      return;
    }

    try {
      setLoadingStations((prev) => ({...prev, [routeId]: true}));
      const response = await api.getStations(routeId);
      if (response?.data) {
        setStations((prev) => ({
          ...prev,
          [routeId]: response.data,
        }));
      }
    } catch (error) {
      if(error.status !== 200){
        if (error?.status != 401)
          toast.error(error.message || `Ошибка при загрузке станций для маршрута ${routeId}`, {toastId: "unique-message-48"});
      }

      console.error("Ошибка:", error);
    } finally {
      setLoadingStations((prev) => ({...prev, [routeId]: false}));
    }
  };

  const handleDelete = async (routeId) => {
      try {
        const response = await api.deleteRoute(routeId);
        if (response.data.visible){
          toast.success("Маршрут успешно возвращён в список активных");
        }
        else{
          toast.success("Маршрут успешно скрыт");
        }
        

        fetchRoutes(currentPage, routesData.per_page, sortParam, visibleParam, routeTypeParam);
        setStations((prev) => {
          const newStations = {...prev};
          delete newStations[routeId];
          return newStations;
        });
      } catch (error) {
        if (error.status != 401) {
            toast.error(error.message || "Ошибка при скрытии/активации маршрута", {toastId: "unique-message-49"});
        }

      }
    
  };
  const handleOpenModal = (routeId) => {
    setCurrentRoute(routeId);
    setIsModalOpen(true);
  };
  const handlePageChange = (newPage) => {
    setSearchParams({page: newPage});
  };

  const clearFilters = () => {
    setFiltersUsed(false)
    setSortParam('name_asc')
    setVisibleParam('visibled')
    setRouteTypeParam('all')
    setPerPage(10)
    localStorage.removeItem('routes_sort')
    localStorage.removeItem('routes_visible_param')
    localStorage.removeItem('users_per_page_route')


  };
  const handleChangeSearchOut = async (e) => {
    try {
      if (e != null)
        setSearchOut(e.target.value);
        const response = await api.searchOutUsers(e == null ? searchOut : e.target.value, currentRoute);
        setUsersSearchOut(response.data);
        
    } catch (error) {
      if (error?.status != 401)
        toast.error(error.response?.data?.detail || "Ошибка", {toastId: "unique-message-53"});
    }
};
  const handleChangeSearchIn = async (e) => {
    try {
        if (e != null)
          setSearchIn(e.target.value);
        const response = await api.searchInUsers(e == null ? searchIn : e.target.value, currentRoute);
        setUsersSearchIn(response.data);      
    } catch (error) {
      if (error?.status != 401)
        toast.error(error.response?.data?.detail || "Ошибка", {toastId: "unique-message-52"});
    }
  };
  
  const handleMoveUserBetweenRoutes = async (userId) => {
    try {
        const response = await api.shareRoute({user_id:userId, route_id:currentRoute});
        handleChangeSearchIn(null);
        handleChangeSearchOut(null);
    } catch (error) {
      if (error?.status != 401)
        toast.error(error.response?.data?.detail || "Ошибка", {toastId: "unique-message-51"});
    }
  };

  const handleSortChange = (e) => {
    setSortParam(e.target.value);
    setFiltersUsed(true);
    localStorage.setItem('routes_sort', e.target.value);
    setSearchParams({page: 1});
    currentPage = parseInt(searchParams.get("page")) || 1;
  };
  const handleVisibleChange = (e) => { 
    setVisibleParam(e.target.value);
    setFiltersUsed(true);
    localStorage.setItem('routes_visible_param', e.target.value);
    setSearchParams({page: 1});
    currentPage = parseInt(searchParams.get("page")) || 1;
  };
  const handleRouteTypeChange = (e) => { 
    setRouteTypeParam(e.target.value);
    setFiltersUsed(true);
    localStorage.setItem('routes_route_type_param', e.target.value);
    setSearchParams({page: 1});
    currentPage = parseInt(searchParams.get("page")) || 1;
  };
  useEffect(() => {
    fetchRoutes(searchParams.get("page"), perPage, sortParam, visibleParam, routeTypeParam);
  }, [currentPage, sortParam, visibleParam, routeTypeParam]);
  
  useEffect(() => {
    fetchRoutes(undefined, perPage, sortParam, visibleParam, routeTypeParam);
  }, [perPage]);
  useEffect(() => {
    if(isModalOpen){
      handleChangeSearchIn(null);
    }
  }, [isModalOpen]);
  return (
      <div className="py-12">
        <Helmet>
          <title>Список маршрутов</title>
        </Helmet>

        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white shadow-sm sm:rounded-lg dark:border-gray-700 dark:bg-gray-800">
            <div className="p-6 text-gray-900">
              <div className="flex justify-between items-center mb-6 flex-wrap">
                <div>
                <h1 className="text-2xl font-bold dark:text-gray-200">
                  Список маршрутов
                </h1>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                      Всего: {routesData.total} маршрутов
                  </span>
                  </div>
   
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex gap-2 mt-2 flex-wrap">
                    {filtersUsed && (                    <button
                    onClick={() => clearFilters()}
                    className="flex р-11 items-center focus:outline-none text-white bg-red-400 hover:bg-red-500 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm py-2.5 px-2.5 me-2 dark:bg-red-900 dark:hover:bg-red-800 dark:focus:ring-red-700">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="18" cy="18" r="4.5" stroke="currentColor" stroke-width="1.4" fill="none"/>
                      <path d="M15.5 15.5L20.5 20.5M20.5 15.5L15.5 20.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                      <path d="M4 5H20L14 12V17L10 14V12L4 5Z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                    </svg>
                  </button>)}
                  {user?.admin !== null && (
                  <select
                          value={routeTypeParam}
                          onChange={handleRouteTypeChange}
                          className="p-2 rounded-md border dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      >
                        {ROUTE_TYPE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                        ))}
                      </select>
                      )}
                    <select
                          value={visibleParam}
                          onChange={handleVisibleChange}
                          className="p-2 rounded-md border dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      >
                        {VISIBLE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                        ))}
                      </select>
                      <select
                          value={sortParam}
                          onChange={handleSortChange}
                          className="p-2 rounded-md border dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      >
                        {SORT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                        ))}
                      </select>
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
                      {user.admin != null && (
                      <button
                      title="Создать маршрут"
                    onClick={() => {navigate("create-route")}}
                    className="flex р-11 items-center focus:outline-none text-white bg-green-400 hover:bg-green-500 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm py-2.5 px-2.5 me-2 dark:bg-green-900 dark:hover:bg-green-800 dark:focus:ring-green-700 transition-all duration-500 me-2"
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
  
                </div>
              </div>

              {loading ? (
                  <Spiner/>
              ) : routesData.items?.length > 0 ? (
                  <div className="space-y-6">
                    {routesData.items.map((route) => (<div
                            key={route.id}
                            className="border border-gray-200 rounded-lg dark:border-gray-700"
                        >
                          
                          <div
                              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-t-lg flex-wrap">
                <div className="flex items-center">
                {route.is_owner ? (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-yellow-600 dark:text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
  <g transform="scale(0.03125) translate(0, 64)">
    <path d="M528 448H112c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h416c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16zm64-320c-26.5 0-48 21.5-48 48 0 7.1 1.6 13.7 4.4 19.8L476 239.2c-15.4 9.2-35.3 4-44.2-11.6L350.3 85C361 76.2 368 63 368 48c0-26.5-21.5-48-48-48s-48 21.5-48 48c0 15 7 28.2 17.7 37l-81.5 142.6c-8.9 15.6-28.9 20.8-44.2 11.6l-72.3-43.4c2.7-6 4.4-12.7 4.4-19.8 0-26.5-21.5-48-48-48S0 149.5 0 176s21.5 48 48 48c2.6 0 5.2-.4 7.7-.8L128 416h384l72.3-192.8c2.5.4 5.1.8 7.7.8 26.5 0 48-21.5 48-48s-21.5-48-48-48z"/>
  </g>
</svg>) : (    <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                                            />
                                        </svg>)}

                {route.visible ? (<svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-3 text-green-600 dark:text-green-400`} viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                        </svg>) : ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-orange-600 dark:text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                                              <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                                              <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                                         
                                          </svg>)}
                            <h3 className="text-lg break-normal font-medium text-gray-900 dark:text-gray-200">
                              {route.name}
                            </h3>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                {/* Dropdown с действиями */}
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <button
                                            type="button"
                                            className="inline-flex justify-center items-center h-11 w-11 bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm py-2.5 me-2 mb-2 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-100 dark:focus:ring-gray-800 transition-colors duration-300 z-0"
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

                                    <Dropdown.Content   side="right">
                                    {route.is_owner && (
                                          
                                        
                                      <>                                    <Dropdown.Link
                                            as="button"
                                            onClick={() => handleOpenModal(route.id)}
                                           
                                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600"
                                        >
                                        
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 mr-2"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                                            />
                                        </svg>
                                            Поделиться маршрутом
                                        </Dropdown.Link>
                                        <Dropdown.Link
                                            as="button"
                                            to={`create-route/${route.id}`}
                                            linkMode={true}
                                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5 mr-2"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path 
                                                    strokeLinecap="round" 
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                />
                                            </svg>
                                            Создать на основе
                                        </Dropdown.Link>
                                        </>
)}
                                        <Dropdown.Link
                                            as="button"
                                            onClick={() => handleDelete(route.id)}
                                            className={`flex items-center px-4 py-2 text-sm ${route.visible ? "text-orange-600 dark:text-orange-400" : "text-green-600 dark:text-green-400"} hover:bg-gray-100 dark:text-orange-400 dark:hover:bg-gray-600`}
                                        >

                                            {route.visible ? ( <>
                                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                              <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                                              <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                                         
                                          </svg>
                                              Скрыть </>
                                            ) : ( <><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                        </svg>
                                        Сделать активным </>)}
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>

                                {/* Кнопка показа станций */}
                                <button
                                    onClick={() => fetchStationsForRoute(route.id)}
                                    className="inline-flex items-center text-white bg-yellow-400 hover:bg-yelllow-500 focus:ring-4 focus:ring-yellow-300 font-medium rounded-lg text-sm py-2.5 px-4 me-2 mb-2 dark:bg-yellow-900 dark:hover:bg-yellow-800 dark:focus:ring-yellow-900 transition-colors duration-300"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className={`h-5 w-5 mr-1 transition-transform duration-200 ${stations[route.id] ? 'rotate-180' : ''}`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round"
                                            strokeWidth={2} 
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                    Станции
                                </button>

                                {/* Кнопка воспроизведения */}
                                <button
                                    onClick={() => navigate(`/routes/play/${route.id}`)}
                                    className="inline-flex items-center text-white bg-green-400 hover:bg-green-500 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm py-2.5 px-4 me-2 mb-2 dark:bg-green-900 dark:hover:bg-green-800 dark:focus:ring-green-900 transition-colors duration-300"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5 mr-1"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path 
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    Воспроизвести
                                </button>
                            </div>
                          </div>

                          {stations[route.id] && (
                              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Станции маршрута:
                                </h4>
                                {loadingStations[route.id] ? (
                                    <Spiner size="small"/>
                                ) : (
                                    <div className="space-y-2">
                                      {stations[route.id].length > 0 ? (
                                          stations[route.id].map((station) => (
                                              <div
                                                  key={`${route.id}-${station.number}`}
                                                  className="flex items-center justify-between py-2 px-3 bg-gray-100 dark:bg-gray-600 rounded"
                                              >
                                <span className="text-gray-800 dark:text-gray-200">
                                    №{station.number}: {station.config_name}
                                </span>
                                                <span
                                                    className="text-sm text-gray-600 dark:text-gray-300">
                                    Следующая: {station.next || "Конечная"}
                                </span>
                                              </div>
                                          ))
                                      ) : (
                                          <p className="text-gray-500 dark:text-gray-400 text-sm">
                                            Нет станций для этого маршрута
                                          </p>
                                      )}
                                    </div>
                                )}
                              </div>
                          )}
                        </div>
                    ))}
                    <Pagination
                        currentPage={routesData.page}
                        totalPages={routesData.total_pages}
                        onPageChange={handlePageChange}
                    />
                  </div>
              ) : (
                  <p className="text-gray-500 dark:text-gray-400">Нет маршрутов для отображения</p>
              )}
            </div>
          </div>
        </div>

        {/* Модальное окно */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl dark:bg-gray-800">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold dark:text-gray-200">
                                Поделиться маршрутом
                            </h2>
                            <button
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setSearchIn('');
                                    setSearchOut('');
                                    setUsersSearchIn([]);
                                    setUsersSearchOut([]);
                                }}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex justify-between gap-5">
                            <div className="mb-4 w-1/2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Поиск пользователей без маршрута
                                </label>
                                <input
                                    placeholder="Введите имя пользователя"
                                    type="text"
                                    value={searchOut}
                                    onChange={handleChangeSearchOut}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                            </div>
                            <div className="mb-4 w-1/2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Поиск пользователей с маршрутом
                                </label>
                                <input
                                    placeholder="Введите имя пользователя"
                                    type="text"
                                    value={searchIn}
                                    onChange={handleChangeSearchIn}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="flex justify-between gap-5">
                            <div className="h-64 overflow-y-auto w-1/2 border border-gray-300 rounded-md shadow-sm">
                            {usersSearchOut.length > 0 ? (
                   usersSearchOut?.map((user) => (
                    <div
                        key={user.id}
                        className="flex justify-between items-center w-full p-4 border-b border-gray-100 dark:border-gray-700 transition-colors hover:cursor-pointer"
                    >
                        <div className="flex items-center w-full">
                        <Avatar email={user.mail} avatarUrl={user?.photo} size="md" className="me-2" />
                            <div className="flex-1">
                                <p className="text-sm font-bold text-gray-900 truncate dark:text-gray-200">
                                    {user.username}
                                </p>
                                <p className="text-xs text-gray-500 truncate dark:text-gray-400">
                                    {user.mail}
                                </p>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {user.admin ? 'Администратор' : user.admin == false ? 'Психолог' : "Диагностируемый"}
                                </div>
                            </div>
                            <button 
                                className="bg-transparent hover:bg-green-500 text-green-700 font-semibold hover:text-green-900 py-1 px-2 border border-green-500 hover:border-transparent rounded"
                                onClick={() => handleMoveUserBetweenRoutes(user.id)}
                            >
                                →
                            </button>
                        </div>
                    </div>
                ))
                            ) : (searchOut == "" ? (
                              <div className="flex flex-col items-center justify-center h-full text-center">
                              <span>Воспользуйтесь поиском для отображения списка</span>
                          </div> ) : 
                          (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                              <span>{`Пользователь ${searchOut} не найден`}</span>
                          </div>
                          )
                            )}
             
                            </div>
                            <div className="h-64 overflow-y-auto w-1/2 border border-gray-300 rounded-md shadow-sm">
                                {usersSearchIn.length > 0 ? (
                                usersSearchIn?.map((user) => (
                                  <div
                                      key={user.id}
                                      className="flex justify-between items-center w-full p-4 border-b border-gray-100 dark:border-gray-700 transition-colors hover:cursor-pointer"
                                  > 
                                      <div className="flex items-center w-full">
                                      <Avatar email={user.mail} avatarUrl={user?.photo} size="md" className="me-2" />
                                          <div className="flex-1">
                                              <p className="text-sm font-bold text-gray-900 truncate dark:text-gray-200">
                                                  {user.username}
                                              </p>
                                              <p className="text-xs text-gray-500 truncate dark:text-gray-400">
                                                  {user.mail}
                                              </p>
                                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                                  {user.admin ? 'Администратор' : user.admin == false ? 'Психолог' : "Диагностируемый"}
                                              </div>
                                          </div>
                                          <button 
                                              className="bg-transparent hover:bg-red-500 text-red-700 font-semibold hover:text-red-900 py-1 px-2 border border-red-500 hover:border-transparent rounded"
                                              onClick={() => handleMoveUserBetweenRoutes(user.id)}
                                          >
                                              ←
                                          </button>
                                      </div>
                                  </div>
                              ))) : (searchIn == "" ? (
                              <div className="flex flex-col items-center justify-center h-full text-center">
                                  <span>В этом маршруте нет пользователей</span>
                              </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                <span>{`Пользователь ${searchIn} не найден`}</span>
                            </div>
                              )
                                 
                                )}
                             
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setSearchIn('');
                                    setSearchOut('');
                                    setUsersSearchIn([]);
                                    setUsersSearchOut([]);
                                }}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-600 dark:hover:bg-blue-700"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
  );
}

// Компоненты иконок
const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2..."/>
    </svg>
);

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2..."/>
    </svg>
);

const StationIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2..."/>
    </svg>
);

const PlayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l..."/>
    </svg>
);

// Кнопка действия
const ActionButton = ({onClick, label, color, icon}) => (
    <button
        onClick={onClick}
        className={`flex items-center text-white bg-${color}-400 hover:bg-${color}-500 dark:bg-${color}-900 dark:hover:bg-${color}-800 transition-all duration-500 overflow-hidden max-w-10 hover:max-w-[200px] group focus:outline-none focus:ring-4 focus:ring-${color}-300 dark:focus:ring-${color}-900 rounded-lg text-sm py-2.5 px-2.5 me-2 mb-2`}
    >
      {icon}
      <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 whitespace-nowrap">
            {label}
        </span>
    </button>
);