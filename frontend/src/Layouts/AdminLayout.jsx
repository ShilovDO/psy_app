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
import {api} from "../api/api";
import {toast} from "react-toastify";


export default function AdminLayout({header}) {
    const context = useContext(UseThemeContext);

    const {user, setLoading, loading, getInfoBase, globalLoading} = context;

    // State для бургер-меню в мобильной версии
    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);

    const location = useLocation();

    const navigate = useNavigate();

    // При изменении пути...
    useEffect(() => {
        // если globalLoading хука завершён, то запрашиваем вновь информацию (тему, пользователя)
        setTimeout(() => {
            // Перенаправляем на /login, сохраняя текущий URL для возврата после входа
            if (globalLoading) {
                getInfoBase();
            }
            if (!user?.admin){
                navigate('/');
            }
        }, 500);

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
            <nav className="w-64 border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 flex-shrink-0 sticky top-[60px] h-[calc(100vh-60px)] overflow-y-auto hidden sm:block">
    <div className="p-4">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6 flex items-center">
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
        
    </div>

    {/* Sidebar for mobile */}
    <div className="fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-16 bg-white shadow-md dark:bg-gray-800 sm:hidden">
    <div className="flex h-full flex-col items-center space-y-4 overflow-y-auto py-4">
      {/* Navigation Items */}
      <ResponsiveNavLink
        to="/admin/users"
        active={location.pathname === '/admin/users'}
        className="flex h-12 w-12 items-center justify-center rounded-md transition hover:bg-gray-100 dark:hover:bg-gray-700"
      >
 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
        </svg>
      </ResponsiveNavLink>

      <ResponsiveNavLink
        to="/admin/services"
        active={location.pathname === '/admin/services'}
        className="flex h-12 w-12 items-center justify-center rounded-md transition hover:bg-gray-100 dark:hover:bg-gray-700"
      >
       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
        </svg>
      </ResponsiveNavLink>

  

      {/* User Section */}
      <div className="mt-auto w-full">
        {user ? (
          <>
           
          </>
        ) : (
          <>
      
          </>
        )}
      </div>
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