import ApplicationLogo from '../Components/ApplicationLogo';
import Dropdown from '../Components/Dropdown';
import NavLink from '../Components/NavLink';
import ResponsiveNavLink from '../Components/ResponsiveNavLink';
import {useContext, useEffect, useLayoutEffect, useState} from 'react';
import ThemeSwitcher from "../Components/ThemeSwitcher.jsx";
import GeneralLayout from "../Layouts/GeneralLayout.jsx";
import Avatar from "../Components/Avatar.jsx";
import {Link, Outlet, useLocation, useNavigate} from "react-router-dom";
import '../index.css';
import UseThemeContext from "../hooks/useThemeContext.js";
import Spiner from "../Components/Spiner.jsx";
import {api} from "../api/api.js";
import {toast} from "react-toastify";


export default function AdminLayout({header}) {
    const context = useContext(UseThemeContext);

    const {user, loading, getInfoBase, globalLoading} = context;

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
            toast.error((error?.message || 'Ошибка при получении данных с сервера') + ` Код: ${error?.status}`); // Отображаем сообщение об ошибке
        } finally {
            //setLoading(false); // Устанавливаем состояние загрузки в false в любом случае (успех или ошибка)
            setShowingNavigationDropdown(false); // гасим бургер меню при выходе из аккаунта
        }
    };
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
            {/* Левая навигационная панель */}
            <nav className="w-64 border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 flex-shrink-0 hidden sm:block">
                <div className="p-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6 flex text-center items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            Админ-панель
        </h2>
                    <div className="space-y-2">
                        <NavLink
                            to='/admin/users'
                            active={location.pathname === '/admin/users'}
                            className="w-full pb-1"
                        >
                                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                 Список пользователей
                        </NavLink>
                        
                        <NavLink
                            to='/admin/services'
                            active={location.pathname === '/admin/services'}
                            className="w-full pb-1"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
                            </svg>
                            Список сервисов
                        </NavLink>
                        <br/>

                        <br/>
                    </div>
                </div>
            </nav>

            {/* Основное содержимое */}
            <div className="flex-1 flex flex-col">
                {/* Верхняя панель с меню пользователя */}
                <nav className="border-b border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800 sm:hidden">
                    <div className="mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 justify-between">
                            <div className="flex">
                                <div className="flex shrink-0 items-center">
                                    <Link to="/">
                                        <ApplicationLogo
                                            className="block h-9 w-auto fill-current text-gray-800 dark:text-gray-200"/>
                                    </Link>
                                </div>
                            </div>

                            <div className="hidden sm:ms-6 sm:flex sm:items-center">
                                <div className="relative ms-3">
                                    {user ? (
                                        <>
                                            <Dropdown>
                                                <Dropdown.Trigger>
                                            <span className="inline-flex rounded-md">
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center rounded-md border border-transparent bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-500 transition duration-150 ease-in-out hover:text-gray-700 focus:outline-none dark:bg-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                                                >
                                                    <Avatar email={user.email} size="md" className="me-2"/>
                                                    {user.username}

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
                                                    >
                                                        Profile
                                                    </Dropdown.Link>
                                                    <Dropdown.Link
                                                        onClick={logout}
                                                        as="button"
                                                    >
                                                        Log Out
                                                    </Dropdown.Link>
                                                </Dropdown.Content>
                                            </Dropdown>
                                        </>
                                    ) : (
                                        <div className="hidden space-x-3 sm:-my-px sm:ms-10 sm:flex">
                                            <NavLink
                                                className="rounded-md py-2 text-black ring-1 ring-transparent transition hover:text-black/70 focus:outline-none focus-visible:ring-[#FF2D20] dark:text-white dark:hover:text-white/80 dark:focus-visible:ring-white"
                                                to='/login'
                                                active={location.pathname === '/login'}>
                                                Log in
                                            </NavLink>
                                            <NavLink
                                                className="rounded-md py-2 text-black ring-1 ring-transparent transition hover:text-black/70 focus:outline-none focus-visible:ring-[#FF2D20] dark:text-white dark:hover:text-white/80 dark:focus-visible:ring-white"
                                                to="/register"
                                                active={location.pathname === '/register'}>
                                                Register
                                            </NavLink>
                                        </div>
                                    )}
                                </div>
                                <ThemeSwitcher></ThemeSwitcher>
                            </div>

                            <div className="-me-2 flex items-center sm:hidden">
                                <ThemeSwitcher></ThemeSwitcher>
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
                            ' sm:hidden'
                        }
                    >
                        <div className="space-y-1 pb-3 pt-2">
                            <ResponsiveNavLink
                                to="/routes"
                                active={location.pathname === '/routes'}
                                onClick={() => setShowingNavigationDropdown(false)}
                            >
                                Маршруты
                            </ResponsiveNavLink>
                            <ResponsiveNavLink
                                to="/task-two"
                                active={location.pathname === '/task-two'}
                                onClick={() => setShowingNavigationDropdown(false)}
                            >
                                Task two
                            </ResponsiveNavLink>
                            <ResponsiveNavLink
                                to='/task-three'
                                active={location.pathname === '/task-three'}
                                onClick={() => setShowingNavigationDropdown(false)}
                            >
                                Task three
                            </ResponsiveNavLink>
                        </div>

                        <div className="border-t border-gray-200 pb-1 pt-4 dark:border-gray-600">
                            {user ? (
                                    <>
                                        <div>
                                            <div className="flex">
                                                <Avatar email={user.email} size="md" className="ms-3 mt-1"/>
                                                <div className="px-4">

                                                    <div className="text-base font-medium text-gray-800 dark:text-gray-200">
                                                        {user.username}
                                                    </div>
                                                    <div className="text-sm font-medium text-gray-500">
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-3 space-y-1">
                                                <ResponsiveNavLink to='/profile'
                                                                   active={location.pathname === '/profile'}
                                                                   onClick={() => setShowingNavigationDropdown(false)}
                                                >
                                                    Profile
                                                </ResponsiveNavLink>
                                                <ResponsiveNavLink
                                                    as="button"
                                                    onClick={logout}
                                                >
                                                    Log Out
                                                </ResponsiveNavLink>
                                            </div>
                                        </div>
                                    </>
                                )
                                : (<div className="mt-3 space-y-1">
                                    <ResponsiveNavLink to='/login' active={location.pathname === '/login'}
                                                       onClick={() => setShowingNavigationDropdown(false)}
                                    >
                                        Log in
                                    </ResponsiveNavLink>
                                    <ResponsiveNavLink
                                        to='/register' active={location.pathname === '/register'}
                                        onClick={() => setShowingNavigationDropdown(false)}
                                    >
                                        Sign up
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

                <main className="flex-1">
                    {(loading) ? (
                        <Spiner/>
                    ) : (
                        <>
                            <Outlet/>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}