import Avatar from "../Components/Avatar.jsx";
import {useState} from "react";
import TextInput from "../Components/TextInput.jsx";
import PrimaryButton from "../Components/PrimaryButton.jsx";
import {api} from "../api/api.js";
import {toast} from "react-toastify";
import Spiner from "../Components/Spiner.jsx";
import {Helmet} from "react-helmet";

export default function TaskThree() {
    // State для хранения поискового запроса
    const [query, setQuery] = useState('');

    // State для хранения результатов
    const [results, setResults] = useState({});

    //State для загрузки
    const [loading, setLoading] = useState(false);

    // State для хранения поискового запроса, который вернул сервер
    const [searchQuery, setSearchQuery] = useState('');

    // Submit-обработчик для поиска
    const handleSearch = (e) => {
        e.preventDefault(); // Сбрасываем деятельность submit по умолчанию
        getTaskThree(query); // Вызываем функция запроса-ответа
    };

    // Функция запроса-ответа для задания 3
    const getTaskThree = async (q) => {
        // Функция для обработки ответа пользователя на вопрос.
        try {
            setLoading(true); // Устанавливаем состояние загрузки в true.
            const response = await api.taskThree(q); // Отправляем ответ на сервер.

            if (response?.data?.results) {
                console.log('searchResult запрос ' + response?.data?.results);
                const normalizedData = Object.keys(response?.data?.results).length === 0
                    ? {}
                    : response?.data?.results;
                console.log('NormalizedData:', normalizedData);
                setResults(normalizedData);
            } else {
                setResults({});
                //toast.error('Не удалось получить ');
            }
            //toast.success(response?.status);
            setSearchQuery(q);
        } catch (error) {
            // Обработка ошибок при отправке ответа
            toast.error((error?.message || 'Ошибка при получении данных с сервера') + ` Код: ${error?.status}`); // Отображаем сообщение об ошибке
        } finally {
            setLoading(false); // Устанавливаем состояние загрузки в false в любом случае (успех или ошибка)
        }
    };
    return (
        <>
            {/* Установка названия вкладки */}
            <Helmet>
                <title>Task three</title>
            </Helmet>
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div
                        className="bg-white overflow-hidden shadow-sm sm:rounded-lg dark:border-gray-700 dark:bg-gray-800">
                        <div className="p-6 text-gray-900">
                            <h1 className="text-2xl font-bold mb-6 dark:text-gray-200">Поиск по сайту</h1>

                            <form onSubmit={handleSearch} className="mb-8">
                                <div className="flex gap-2">
                                    <TextInput
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Введите поисковый запрос..."
                                        className=" block w-full"
                                        required
                                    />
                                    <PrimaryButton
                                        type="submit"
                                    >
                                        Найти

                                    </PrimaryButton>
                                </div>
                            </form>
                            {/*Если загрузка, то рендерим спинер, а иначе пытаемся вывести результаты поиска*/}
                            {loading ? (
                                <Spiner />
                            ) : (
                            <div>
                                {/*Если получили текст запроса от сервера, то выводим его*/}
                                {searchQuery && (
                                    <div className="mb-4">
                                        <h2 className="font-bold mb-6 text-gray-600 dark:text-gray-200">
                                            Результаты поиска: "{searchQuery}"
                                        </h2>
                                        {results.length > 0 && (
                                            <p className="text-sm text-gray-500">
                                                Найдено {results.length} результатов
                                            </p>
                                        )}
                                    </div>
                                )}
                                {/*Если имеются результаты поиска, то выводим их. Если же ничего не найдено, то сообщаем об этом*/}
                                {results && results.length > 0 ? (
                                    <div className="space-y-6">
                                        {results.map((user) => (
                                            <div key={user._id}
                                                 className="flex items-center border-b border-gray-200 pb-6">
                                                <Avatar email={user.email} size="md" className="me-3 mb-1"/>
                                                <div className="flex-1">
                                                    <p className="text-lg font-medium text-gray-900 truncate dark:text-gray-200">
                                                        {user.username}
                                                    </p>
                                                    <p className="text-gray-600 mb-2">
                                                        {user.email}
                                                    </p>
                                                </div>
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <div className="text-sm text-gray-500 dark:text-gray-200">
                                                        Зарегистрирован: {new Date(user.created_at).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : searchQuery ? (
                                    <div className="text-center py-12">
                                        <p className="text-xl text-gray-500 dark:text-gray-200">
                                            По вашему запросу ничего не найдено.
                                        </p>
                                        <p className="mt-2 text-sm text-gray-400">
                                            Попробуйте изменить поисковый запрос
                                        </p>
                                    </div>
                                ) : (
                                    <div className="text-center text-xl py-12 text-gray-500 dark:text-gray-200">
                                        <p>Введите запрос в поле выше для поиска по сайту</p>
                                    </div>
                                )}
                            </div>
                            ) }
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
