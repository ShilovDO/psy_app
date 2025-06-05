import ApplicationLogo from '../Components/ApplicationLogo';
import {Link} from "react-router-dom";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import {useContext, useEffect} from "react";
import UseThemeContext from "../hooks/useThemeContext.js";
import Spiner from '../Components/Spiner';

export default function GuestLayout() {
    const context = useContext(UseThemeContext);
    const location = useLocation();
    const { user, globalLoading, getInfoBase, loading, setLoading } = context;

    const fallbackPath = "/";

    let from = location.state?.from || fallbackPath;

    //Перенаправление, если пользователь пытается посетить гостевую страницу будучи аутентификацированным
    if (user) {
        return <Navigate to={from} replace />;
    }

    useEffect(() => {
        if (user) {
            return <Navigate to={from} replace />;
        }    
    }, [user]);


    // При изменении пути...
    useEffect(() => {
        // если globalLoading хука завершён, то запрашиваем вновь информацию (тему, пользователя)
        setLoading(true);
        setTimeout(() => {
            //  Перенаправляем на /login, сохраняя текущий URL для возврата после входа
            if (globalLoading) {
                getInfoBase();
            }
        }, 500);

    }, [location]);
    return (
        <div>
            {loading ? (<Spiner/>) : (
                <>
            <p>{from}</p>
            <p>{user?.id}</p>
            <div
                className="flex flex-col items-center h-screen bg-gray-100 pt-6 sm:justify-center sm:pt-0 dark:bg-gray-900">

                <div>
                    <Link to='/'>
                        <ApplicationLogo className="h-20 w-20 fill-current text-gray-500"/>
                    </Link>
                </div>
                {/*<ThemeSwitcher></ThemeSwitcher>*/}
                <div
                    className="mt-6 w-full overflow-visible bg-white px-6 py-4 shadow-md sm:max-w-md sm:rounded-lg dark:bg-gray-800">
                     <Outlet/>
                </div>
            </div> 
            </>
           )}
        </div> 
    );
}
