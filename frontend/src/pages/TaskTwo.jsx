import StatCard from "../Components/StatCard.jsx";
import {useEffect, useLayoutEffect, useState} from "react";
import {api} from "../api/api.js";
import {toast} from "react-toastify";
import Spiner from "../Components/Spiner.jsx";
import {Helmet} from "react-helmet";

export default function TaskTwo()  {
    // State для хранения общего количества пользователей
    const [totalUsers, setTotalUsers] = useState(null);

    // State для хранения количества пользователей за текущий месяц
    const [lastMonthUsers, setLastMonthUsers] = useState(null);

    // State для хранения крайнего пользователя в системе
    const [lastUser, setLastUser] = useState(null);

    // State для загрузки
    const [loading, setLoading] = useState(false);

    // Функция запрос-ответа для второго задания
    const getTaskTwo = async () => {
        // Функция для обработки ответа пользователя на вопрос.
        try {
            setLoading(true); // Устанавливаем состояние загрузки в true.
            const response = await api.taskTwo(); // Отправляем ответ на сервер.

            if (response?.data?.totalUsers) {
                console.log('totalUsers запрос ' + response?.data?.totalUsers);
                if (Number.isInteger(response?.data?.totalUsers))
                    setTotalUsers(response?.data?.totalUsers);
                else{
                    toast.error('Пришедшее общее количество пользователей не является целым числом!');
                }
            } else{
                setTotalUsers(null);
                //toast.error('Не удалось получить общее количество пользователей');
            }

            if (response?.data?.lastMonthUsers) {
                if (Number.isInteger(response?.data?.lastMonthUsers))
                    setLastMonthUsers(response?.data?.lastMonthUsers);
                else{
                    toast.error('Пришедшее количество пользователей за месяц не является целым числом!');
                }
            } else{
                setLastMonthUsers(null);
                //toast.error('Не удалось получить количество пользователей за месяц');
            }

            if (response?.data?.lastUser) {
                console.log('lastUser запрос ' + response?.data?.lastUser);
                const normalizedData = Object.keys(response?.data?.lastUser).length === 0
                    ?  null
                    : response?.data?.lastUser;
                setLastUser(normalizedData);
            } else{
                setLastUser(null);
                toast.error('Не удалось получить крайнего зарегистрировавшегося пользователя за месяц');
            }
            //toast.success(response?.status);
        } catch (error) {
            // Обработка ошибок при отправке ответа
            toast.error((error?.message || 'Ошибка при получении данных с сервера') + ` Код: ${error?.status}`); // Отображаем сообщение об ошибке
        } finally {
            setLoading(false); // Устанавливаем состояние загрузки в false в любом случае (успех или ошибка)

        }
    };

    // useEffect для вызова функции запроса-ответа при откртии страницы
    useEffect(() => {
        setTimeout(() => {
            // Код, который выполнится после задержки
            getTaskTwo();
        }, 100);
    }, []);

    return (
            <div className="py-12">
                {/* Установка названия вкладки */}
                <Helmet>
                    <title>Task two</title>
                </Helmet>
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg dark:border-gray-700 dark:bg-gray-800">
                        <div className="p-6 text-gray-900">
                            <h1 className="text-2xl font-bold mb-6 dark:text-gray-200">Список пользователей</h1>
                            {/* Если идёт загрузка, то рендерим спинер, иначе пытаемся выводить данные по заданию*/}
                            {loading ? (<Spiner />) : (<>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Общее поличество пользователей (если оно определено) */}
                                    {totalUsers && (
                                        <StatCard
                                            title="Total count of users"
                                            value={totalUsers}
                                        />
                                    )}
                                    {/* Количество пользователей за текущий месяц (если оно определено)*/}
                                    {lastMonthUsers && (
                                        <StatCard
                                            title="Total count of users for this month"
                                            value={lastMonthUsers}
                                        />
                                    )}
                                    {/* Крайний зарегистрированный пользователь*/}
                                    {lastUser && (
                                        <StatCard
                                            title="The last registered user"
                                            value={lastUser?.username || 'Нет данных'}
                                            email={lastUser?.email}
                                        />
                                    )}

                                </div>
                            </div>
                            </> )}
                        </div>
                    </div>
                </div>
            </div>
    );
}
