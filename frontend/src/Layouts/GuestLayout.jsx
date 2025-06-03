import ApplicationLogo from '../Components/ApplicationLogo';
import {Link} from "react-router-dom";
import { Navigate } from "react-router-dom";
import {useContext} from "react";
import UseThemeContext from "../hooks/useThemeContext.js";

export default function GuestLayout({children}) {
    const context = useContext(UseThemeContext);

    const { user } = context;

    const fallbackPath = "/";

    const from = location.state?.from || fallbackPath;

    //Перенаправление, если пользователь пытается посетить гостевую страницу будучи аутентификацированным
    if (user) {
        return <Navigate to={from} replace />;
    }
    return (
        <div>
            <p>{from}</p>
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
                    {children}
                </div>
            </div>
        </div>
    );
}
