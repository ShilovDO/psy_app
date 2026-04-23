import ProfileInformation from './Partials/ProfileInformation';
import {useContext} from "react";
import UseThemeContext from "../../hooks/useThemeContext.js";
import {Navigate} from "react-router-dom";
import DeleteUserForm from "./Partials/DeleteUserForm.jsx";
import {Helmet} from "react-helmet";
export default function Edit() {
    // Подключаем контекст
    const context = useContext(UseThemeContext);
    // Берём state пользователя для взятия из него информации
    const { user, getInfoBase } = context;

    // Путь, куда будем перенаправлять пользователя, если он не вошёл в аккаунт
    const fallbackPath = "/login";

    // Если пользователя нет, то перенаправляем на страницу входа
    if (!user) {
        return <Navigate to={fallbackPath} replace />;
    }
    return (
            <div className="py-12">
                {/* Установка названия вкладки */}
                <Helmet>
                    <title>Личный кабинет</title>
                </Helmet>
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">

                    <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8 dark:bg-gray-800">
                        {/* Выводим информацию о пользователе*/}
                        <ProfileInformation
                            className="max-w-xl"
                            user={user}
                            getInfoBase={getInfoBase}
                        />
                    </div>
                </div>
            </div>
    );
}
