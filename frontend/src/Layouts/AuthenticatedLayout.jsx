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
import {api} from "../api/api.js";
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
            toast.error((error?.message || 'Ошибка при получении данных с сервера') + ` Код: ${error?.status}`); // Отображаем сообщение об ошибке
        } finally {
            //setLoading(false); // Устанавливаем состояние загрузки в false в любом случае (успех или ошибка)
            setShowingNavigationDropdown(false); // гасим бургер меню при выходе из аккаунта
        }
    };

    useEffect(() => {
        console.info(user);
    }, [user]);


    if (userGetting && !user) {
        // Перенаправляем на /login, сохраняя текущий URL для возврата после входа
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
      }

    return userGetting ? (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <nav className="border-b border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800">
                <div className="mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between">
                        <div className="flex">
                            <div className="flex shrink-0 items-center">
                                <Link to="/">
                                    <ApplicationLogo
                                        className="block h-9 w-auto fill-current text-gray-800 dark:text-gray-200"/>
                                </Link>
                            </div>

                            <div className="hidden space-x-8 sm:-my-px sm:ms-10 sm:flex">
                            {user?.admin && ( 
                                <NavLink
                                to='/admin/users'
                                active={(location.pathname).startsWith("/admin")}
                            >
                                Админ-панель
                            </NavLink>
                                )}
                            
                            <NavLink
                                to='/routes'
                                active={location.pathname === '/routes'}
                                className="block"
                            >
                                Маршруты
                            </NavLink>
                            <NavLink
                                to='/create-route'
                                active={location.pathname === '/create-route'}
                            >
                                Создать маршрут
                            </NavLink>
                            <NavLink
                            to='/services'
                            active={location.pathname === '/services'}
                            className="w-full pb-1"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
                            </svg>
                            Список сервисов
                        </NavLink>
                            </div>

                        </div>

                        <div className="hidden sm:ms-6 sm:flex sm:items-center">
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
                                                <Avatar email={user?.email} size="md" className="me-2"/>
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
                                                    //   href={route('profile.edit')}
                                                    to='/profile'
                                                    as="button"
                                                >
                                                    Профиль
                                                </Dropdown.Link>
                                                <Dropdown.Link
                                                    // href={route('logout')}
                                                    onClick={logout}
                                                    as="button"
                                                >
                                                    Выход
                                                </Dropdown.Link>
                                            </Dropdown.Content>
                                        </Dropdown>
                                    </>
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
                            to="/task-one"
                            active={location.pathname === '/task-one'}
                            onClick={() => setShowingNavigationDropdown(false)}
                        >
                            Task one
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            to="/task-two"
                            active={location.pathname === '/task-two'}
                            onClick={() => setShowingNavigationDropdown(false)}
                        >
                            Task two
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            // href={route('taskThree')}
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
                                            <ResponsiveNavLink to='/profile'
                                                               active={location.pathname === '/profile'}
                                                               onClick={() => setShowingNavigationDropdown(false)}
                                            >
                                                Профиль
                                            </ResponsiveNavLink>
                                            <ResponsiveNavLink
                                                as="button"
                                                onClick={logout}
                                            >
                                                Выход
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
