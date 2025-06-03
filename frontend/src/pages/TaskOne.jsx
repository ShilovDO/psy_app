import Avatar from "../Components/Avatar.jsx";
import {useEffect, useState} from "react";
import {api} from "../api/api.js";
import {toast} from "react-toastify";
import Spiner from "../Components/Spiner.jsx";
import {Helmet} from "react-helmet";

export default function TaskOne() {
    // State для хранения полученных пользователей
    const [users, setUsers] = useState([]);
    // State для загрузки
    const [loading, setLoading] = useState(false);

    // Функция для запроса-ответа для задания 1
    const getTaskOne = async () => {
        try {
            setLoading(true); // Устанавливаем состояние загрузки в true.
            const response = await api.taskOne(); // Отправляем ответ на сервер.

            if (response?.data?.users) {

                // Обрабатываем полученный ответ
                const normalizedData = Object.keys(response?.data?.users).length === 0
                    ? null
                    : response?.data?.users;
                setUsers(normalizedData);
            } else {
                setUsers(null);
                //toast.error('Не удалось получить данные пользователей в задании 1');
            }
            //toast.success(response?.status);
        } catch (error) {
            // Обработка ошибок при отправке ответа
            toast.error((error?.message || 'Ошибка при получении данных с сервера.') + `Код ошибки: ${error?.status}`); // Отображаем сообщение об ошибке
        } finally {
            setLoading(false); // Устанавливаем состояние загрузки в false в любом случае (успех или ошибка)
        }
    };

    // useEffect для запуска функции запроса-ответа при открытии страницы
    useEffect(() => {
        setTimeout(() => {
            // Код, который выполнится после задержки
            getTaskOne();
        }, 100);
    }, []);

    return (
        <div className="py-12">
            {/* Установка названия вкладки */}
            <Helmet>
                <title>Task one</title>
            </Helmet>

            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg dark:border-gray-700 dark:bg-gray-800">
                    <div className="p-6 text-gray-900">
                        <h1 className="text-2xl font-bold mb-6 dark:text-gray-200">List of users (last names)</h1>
                        {/* Если идёт процесс загрузки, то рисуем спинер, иначе пытаемся выводить пользователей */}
                        {loading ? (<Spiner/>) : (<>
                            {/*Если пользователей получилось добыть, то рисуем их */}
                            {users && (
                                <div className="space-y-4">
                                    {users.map((user) => (
                                        <div key={user._id}
                                             className="flex items-center gap-3 p-4 border-b border-gray-100">
                                            <Avatar email={user.email} size="md" className="me-2"/>
                                            <div className="flex-1">
                                                <p className="text-lg font-medium text-gray-900 truncate dark:text-gray-200">
                                                    {user.lastname}
                                                </p>
                                                <p className="text-sm font-medium text-gray-900 truncate dark:text-gray-200">
                                                    {user.username}
                                                </p>
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-200">
                                                Зарегистрирован: {new Date(user.created_at).toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>)} </>)}
                    </div>
                </div>
            </div>
        </div>
    );
}
