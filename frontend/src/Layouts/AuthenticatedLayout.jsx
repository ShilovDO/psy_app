import ApplicationLogo from '../Components/ApplicationLogo';
import Dropdown from '../Components/Dropdown';
import NavLink from '../Components/NavLink';
import ResponsiveNavLink from '../Components/ResponsiveNavLink';
import {useContext, useEffect, useLayoutEffect, useState} from 'react';
import ThemeSwitcher from "../Components/ThemeSwitcher.jsx";
import GeneralLayout from "../Layouts/GeneralLayout.jsx";
import Avatar from "../Components/Avatar.jsx";
import {Link, Outlet, useLocation, useNavigate, Navigate} from "react-router-dom";
import '../index.css';
import UseThemeContext from "../hooks/useThemeContext.js";
import Spiner from "../Components/Spiner.jsx";
import {api} from "../api/api";
import {toast} from "react-toastify";


export default function AuthenticatedLayout({header}) {
    const context = useContext(UseThemeContext);

    const {user, loading, getInfoBase, globalLoading, userGetting} = context;

    // State для бургер-меню в мобильной версии
    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);

    const location = useLocation();

    const navigate = useNavigate();

    // При изменении пути...
    useEffect(() => {
        // если globalLoading хука завершён, то запрашиваем вновь информацию (тему, пользователя)
        if (globalLoading) {
            getInfoBase(false);
        }
        // если пользователь заходит на корневой путь, то перенаправляем на первое задание
        if (location.pathname === '/') {
            navigate("/routes");
        }
    }, [location]);

    // Функция запрос-ответа для выхода из аккаунта
    const logout = async () => {
        try {
            //setLoading(true); // Устанавливаем состояние загрузки в true.
            const response = await api.postLogout(); // Отправляем ответ на сервер.

            if (response.status === 200) {
                localStorage.removeItem("accessToken");
                navigate(location.pathname);
                //toast.success(response?.status + ' logout successfully.');
            }

        } catch (error) {
            // Обработка ошибок при отправке ответа
            if (error?.status != 401)
                toast.error((error?.message || 'Ошибка при получении данных с сервера') + ` Код: ${error?.status}`, {toastId: "unique-message-4"}); // Отображаем сообщение об ошибке
        } finally {
            //setLoading(false); // Устанавливаем состояние загрузки в false в любом случае (успех или ошибка)
            setShowingNavigationDropdown(false); // гасим бургер меню при выходе из аккаунта
        }
    };

    useEffect(() => {
        console.info(user);
    }, [user]);


    if (userGetting && !user) {
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
      }

    return userGetting ? (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <nav className="border-b border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800 sticky top-0 z-50">
    <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
            <div className="flex">
                <div className="flex shrink-0 items-center">
                    <Link to="/">
                        <ApplicationLogo
                            className="block h-9 w-auto fill-current text-gray-800 dark:text-gray-200"/>
                    </Link>
                </div>

                <div className="hidden space-x-2 sm:-my-px sm:ms-10 md:flex">
                    {user?.admin && ( 
                        <NavLink
                            to='/admin/users'
                            active={(location.pathname).startsWith("/admin")}
                            className="inline-flex items-center px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                            </svg>
                            Админ-панель
                        </NavLink>
                    )}
                    
                    <NavLink
                        to='/routes'
                        active={(location.pathname).startsWith('/routes')}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clipRule="evenodd" />
                        </svg>
                        Маршруты
                    </NavLink>
                    {user?.admin !== null && ( 
                        <>
                    <NavLink
                        to='/services'
                        active={location.pathname === '/services'}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
                        </svg>
                        Сервисы
                    </NavLink>
                    
                    <NavLink
                        to='/configs'
                        active={location.pathname === '/configs'}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
<svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 flex-shrink-0 me-1"
    viewBox="0 0 20 20"
    fill="currentColor"
>
    <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1H8a3 3 0 00-3 3v1.5a1.5 1.5 0 01-3 0V6z" clipRule="evenodd" />
    <path d="M6 12a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2H2h2a2 2 0 002-2v-2z" />
</svg>
                        Конфигурации
                    </NavLink>
                    <NavLink
                        to='/results'
                        active={location.pathname === '/results'}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                       <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 flex-shrink-0 me-1"
    viewBox="0 0 20 20"
    fill="currentColor"
>
    <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
</svg>
                        Результаты
                    </NavLink>
                    </>
                    )}
                </div>
            </div>

            <div className="hidden sm:ms-6 md:flex sm:items-center">
                <ThemeSwitcher className="mr-4"/>
                <div className="relative ms-3">
                    {user?.email && (
                        <>
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <span className="inline-flex rounded-md">
                                        <button
                                            type="button"
                                            className="inline-flex items-center rounded-md border border-transparent bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-500 transition duration-150 ease-in-out hover:text-gray-700 focus:outline-none dark:bg-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                                        >
                                            <Avatar email={user?.email} avatarUrl={user?.photo} size="md" className="me-2"/>
                                            {user?.username}
                                            <svg
                                                className="-me-0.5 ms-2 h-4 w-4"
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </button>
                                    </span>
                                </Dropdown.Trigger>

                                <Dropdown.Content>
                                    <Dropdown.Link
                                        to='/profile'
                                        as="button"
                                        linkMode={true}
                                        className="flex items-center"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                        </svg>
                                        Профиль
                                    </Dropdown.Link>
                                    <Dropdown.Link
                                        onClick={logout}
                                        as="button"
                                        className="flex items-center"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                                        </svg>
                                        Выход
                                    </Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>
                        </>
                    )}
                </div>
            </div>

            <div className="-me-2 flex items-center md:hidden">
                <ThemeSwitcher className="mr-2"/>
                <button
                    onClick={() =>
                        setShowingNavigationDropdown(
                            (previousState) => !previousState,
                        )
                    }
                    className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 transition duration-150 ease-in-out hover:bg-gray-100 hover:text-gray-500 focus:bg-gray-100 focus:text-gray-500 focus:outline-none dark:text-gray-500 dark:hover:bg-gray-900 dark:hover:text-gray-400 dark:focus:bg-gray-900 dark:focus:text-gray-400"
                >
                    <svg
                        className="h-6 w-6"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <path
                            className={
                                !showingNavigationDropdown
                                    ? 'inline-flex'
                                    : 'hidden'
                            }
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 6h16M4 12h16M4 18h16"
                        />
                        <path
                            className={
                                showingNavigationDropdown
                                    ? 'inline-flex'
                                    : 'hidden'
                            }
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>
        </div>
    </div>

    <div
        className={
            (showingNavigationDropdown ? 'block' : 'hidden') +
            ' m:hidden'
        }
    >
        <div className="space-y-1 pb-3 pt-2">
            {user?.admin && ( 
                <ResponsiveNavLink
                    to='/admin/users'
                    active={(location.pathname).startsWith("/admin")}
                    onClick={() => setShowingNavigationDropdown(false)}
                    className="flex items-center"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                    Админ-панель
                </ResponsiveNavLink>
            )}
            
            <ResponsiveNavLink
                to='/routes'
                active={location.pathname === '/routes'}
                onClick={() => setShowingNavigationDropdown(false)}
                className="flex items-center"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clipRule="evenodd" />
                </svg>
                Маршруты
            </ResponsiveNavLink>
            
            <ResponsiveNavLink
                to='/create-route'
                active={location.pathname === '/create-route'}
                onClick={() => setShowingNavigationDropdown(false)}
                className="flex items-center"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Создать маршрут
            </ResponsiveNavLink>
            
            <ResponsiveNavLink
                to='/services'
                active={location.pathname === '/services'}
                onClick={() => setShowingNavigationDropdown(false)}
                className="flex items-center"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
                </svg>
                Сервисы
            </ResponsiveNavLink>
        </div>

        <div className="border-t border-gray-200 pb-1 pt-4 dark:border-gray-600">
            {user ? (
                    <>
                        <div>
                            <div className="flex">
                                <Avatar email={user?.email} size="md" className="ms-3 mt-1"/>
                                <div className="px-4">
                                    <div className="text-base font-medium text-gray-800 dark:text-gray-200">
                                        {user?.username}
                                    </div>
                                    <div className="text-sm font-medium text-gray-500">
                                        {user?.email}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3 space-y-1">
                                <ResponsiveNavLink 
                                    to='/profile'
                                    active={location.pathname === '/profile'}
                                    onClick={() => setShowingNavigationDropdown(false)}
                                    className="flex items-center"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                    </svg>
                                    Профиль
                                </ResponsiveNavLink>
                                <ResponsiveNavLink
                                    as="button"
                                    onClick={logout}
                                    className="flex items-center w-full"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                                    </svg>
                                    Выход
                                </ResponsiveNavLink>
                            </div>
                        </div>
                    </>
                )
                : (<div className="mt-3 space-y-1">
                    <ResponsiveNavLink 
                        to='/login' 
                        active={location.pathname === '/login'}
                        onClick={() => setShowingNavigationDropdown(false)}
                        className="flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Вход
                    </ResponsiveNavLink>
                    <ResponsiveNavLink
                        to='/register' 
                        active={location.pathname === '/register'}
                        onClick={() => setShowingNavigationDropdown(false)}
                        className="flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6z" />
                        </svg>
                        Регистрация
                    </ResponsiveNavLink>
                </div>)}
        </div>
    </div>
</nav>

            {header && (
                <header className="bg-white shadow dark:bg-gray-800">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            <main>
                {/*{children}*/}

                {(loading) ? (
                    <Spiner/>
                ) : (
                    <>
                        <Outlet/>
                    </>
                )}

            </main>
        </div>
    ) : (
<div className='min-h-screen flex flex-col items-center justify-center'>
    <Spiner/>
</div>
    );
}
