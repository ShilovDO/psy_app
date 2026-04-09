import Avatar from "../../Components/Avatar.jsx";
import { useEffect, useState } from "react";
import { api } from "../../api/api.js";
import { toast } from "react-toastify";
import Spiner from "../../Components/Spiner.jsx";
import TextInput from "../../Components/TextInput.jsx";
import { Helmet } from "react-helmet";
import { useForm } from "react-hook-form";
import Pagination from "../../Components/Pagination.jsx";
import Dropdown from "../../Components/Dropdown.jsx";
import { useSearchParams } from "react-router-dom";
import { RadioGroup } from "@headlessui/react";
import { Button } from "@headlessui/react";
export default function Users() {
    const PER_PAGE_OPTIONS = [
        { value: 5, label: "5 записей" },
        { value: 10, label: "10 записей" },
        { value: 20, label: "20 записей" },
        { value: 50, label: "50 записей" }
    ];

    const SORT_OPTIONS = [
        { value: "name_desc", label: "По убыванию имени пользователя" },
        { value: "name_asc", label: "По возрастанию имени пользователя" },
        { value: "email_desc", label: "По убыванию email" },
        { value: "email_asc", label: "По возрастанию email" },
        { value: "id_desc", label: "Сначала новые" },
        { value: "id_asc", label: "Сначала старые" },
    ];

    const [usersData, setUsersData] = useState({
        items: [],
        total: 0,
        page: 1,
        per_page: 10,
        total_pages: 1
    });

    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [mailFree, setMailFree] = useState(true);

    const [searchParams, setSearchParams] = useSearchParams();
    const currentPage = parseInt(searchParams.get("page")) || 1;

    const [sortParam, setSortParam] = useState(localStorage.getItem('user_sort') || 'name_asc');
    const [perPage, setPerPage] = useState(parseInt(localStorage.getItem('users_per_page_user') || 10));

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue
    } = useForm({
        mode: "onTouched",
        defaultValues: {
            username: '',
            mail: '',
            password: '',
            admin: false
        },
    });

    const fetchUsers = async (page, per_page, sort) => {
        try {
            setLoading(true);
            const [field, direction] = sort.split("_");
            const response = await api.getUsers(page, per_page, field, direction);
            if (response?.data) {
                setUsersData(response.data);
            } else {
                setUsersData(prev => ({ ...prev, items: [] }));
                toast.error("Не удалось получить список пользователей");
            }
        } catch (error) {
            toast.error((error?.message || "Ошибка при получении данных") + ` Код ошибки: ${error?.status}`);
        } finally {
            setLoading(false);
        }
    };

    const handlePerPageChange = (e) => {
        const newPerPage = parseInt(e.target.value);
        setPerPage(newPerPage);
        localStorage.setItem('users_per_page_user', newPerPage.toString());
        setSearchParams({ page: 1 });
    };

    const handleSortChange = (e) => {
        setSortParam(e.target.value);
        localStorage.setItem('user_sort', e.target.value);
        setSearchParams({ page: 1 });
    };

    const handleCreateClick = () => {
        setIsCreating(true);
        setCurrentUserId(null);
        reset({
            username: '',
            mail: '',
            password: '',
            admin: false
        });
        setIsModalOpen(true);
    };

    const handleEditClick = (user) => {
        setIsCreating(false);
        setCurrentUserId(user.id);

        setValue('username', user.username);
        setValue('mail', user.mail);

        // 👇 ключевая строка
        setValue(
            'admin',
            user.admin === null ? "null" : String(user.admin)
        );

        setIsModalOpen(true);
    };

    const handleDelete = async (userId) => {
        if (window.confirm("Удалить пользователя?")) {
            try {
                await api.deleteUser(userId);
                toast.success("Пользователь удален");
                fetchUsers(currentPage, perPage, sortParam);
            } catch (error) {
                toast.error(error.response?.data?.detail || "Ошибка при удалении");
            }
        }
    };

    const onSubmit = async (data) => {
        try {
            // 👇 приводим к нормальному виду
            const normalizedData = {
                ...data,
                admin:
                    data.admin === "null"
                        ? null
                        : data.admin === "true"
            };

            if (isCreating && mailFree) {
                await api.postRegister(normalizedData);
                toast.success("Пользователь создан");
            } else {
                await api.updateUser({ ...normalizedData, id: currentUserId });
                toast.success("Пользователь обновлен");
            }

            setIsModalOpen(false);
            fetchUsers(currentPage, perPage, sortParam);
        } catch (error) {
            toast.error(error.response?.data?.detail || "Ошибка");
        }
    };

    const handleMail = async (e) => {
        const mail = e.target.value;
        setValue("mail", mail, { shouldValidate: true });
        if (!mail) return;
        try {
            const res = await api.checkMail(mail);
            setMailFree(res.data);
        } catch (error) {
            toast.error("Ошибка проверки почты");
        }
    };

    const handlePageChange = (page) => {
        setSearchParams({ page });
    };

    useEffect(() => {
        const timer = setTimeout(() => 
            {fetchUsers(currentPage, perPage, sortParam)},
            100);      
    }, [currentPage, sortParam, perPage]);

    useEffect(() => {
        const handleEsc = (event) => {
            if (event.key === "Escape") setIsModalOpen(false);
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, []);

    return (
        <div className="py-12">
            <Helmet>
                <title>Список пользователей</title>
            </Helmet>

            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div className="bg-white shadow-sm sm:rounded-lg dark:border-gray-700 dark:bg-gray-800">
                    <div className="p-6 text-gray-900">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                            <h1 className="text-2xl font-bold dark:text-gray-200">Список пользователей</h1>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                    Всего: {usersData.total} пользователей
                                </span>
                                <br/>
                                <div className="flex gap-2 mt-2 flex-wrap">
                                    <select
                                        value={sortParam}
                                        onChange={handleSortChange}
                                        className="p-2 mt-2 rounded-md border dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    >
                                        {SORT_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        value={perPage}
                                        onChange={handlePerPageChange}
                                        className="p-2 mt-2 rounded-md border dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    >
                                        {PER_PAGE_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 me-3">

                                <button
                                    onClick={handleCreateClick}
                                    className="flex items-center focus:outline-none text-white bg-green-400 hover:bg-green-500 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm py-2.5 px-2.5 me-2 mb-2 dark:bg-green-900 dark:hover:bg-green-800 dark:focus:ring-green-900 transition-all duration-500 overflow-hidden max-w-10 hover:max-w-[200px] group"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5 flex-shrink-0"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M12 4v16m8-8H4"/>
                                    </svg>
                                    <span
                                        className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 whitespace-nowrap">
                                        Добавить пользователя
                                    </span>
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <Spiner/>
                        ) : (
                            <>
                                {usersData.items && usersData.items.length > 0 ? (
                                    <div className="space-y-4">
                                        {usersData.items.map((user) => (
                                            <div
                                                key={user.id}
                                                className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-700 transition-colors"
                                            >
                                                <div className="flex-1 flex items-center gap-3">
                                                    <Avatar email={user.mail} size="md" className="me-2"/>
                                                    <div className="flex-1">
                                                        <p className="text-lg font-medium text-gray-900 truncate dark:text-gray-200">
                                                            {user.username}
                                                        </p>
                                                        <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                                                            {user.mail}
                                                        </p>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                                            {user.admin ? 'Администратор' : user.admin == false ? 'Психолог' : "Клиент"}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Dropdown>
                                                        <Dropdown.Trigger>
                                                            <button
                                                                type="button"
                                                                className="inline-flex justify-center items-center h-11 w-11 bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm py-2.5 me-2 mb-2 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 dark:focus:ring-gray-800 transition-colors duration-300"
                                                            >
                                                                <svg
                                                                    className="h-full w-auto text-center m-0"
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    viewBox="0 0 20 20"
                                                                    fill="currentColor"
                                                                >
                                                                    <path
                                                                        d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"
                                                                    />
                                                                </svg>
                                                            </button>
                                                        </Dropdown.Trigger>

                                                        <Dropdown.Content>
                                                            <Dropdown.Link
                                                                as="button"
                                                                onClick={() => handleEditClick(user)}
                                                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600"
                                                            >
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    className="h-5 w-5 mr-2"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                >
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                                                </svg>
                                                                Изменить
                                                            </Dropdown.Link>

                                                            <Dropdown.Link
                                                                as="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDelete(user.id);
                                                                }}
                                                                className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-600"
                                                            >
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    className="h-5 w-5 mr-2"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                >
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                                                </svg>
                                                                Удалить
                                                            </Dropdown.Link>
                                                        </Dropdown.Content>
                                                    </Dropdown>
                                                </div>
                                            </div>
                                        ))}

                                        <Pagination
                                            currentPage={usersData.page}
                                            totalPages={usersData.total_pages}
                                            onPageChange={handlePageChange}
                                        />
                                    </div>
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-400">Нет пользователей для
                                        отображения</p>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Модальное окно */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md dark:bg-gray-800">
                        <div className="p-6">
                            <h2 className="text-xl font-bold mb-4 dark:text-gray-200">
                                {isCreating ? 'Добавить нового пользователя' : 'Редактировать пользователя'}
                            </h2>

                            <form onSubmit={handleSubmit(onSubmit)}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Имя пользователя
                                    </label>
                                    <input
                                        type="text"
                                        {...register('username', {required: 'Обязательное поле'})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                    {errors.username && (
                                        <p className="mt-1 text-sm text-red-600 dark:text-red-500">{errors.username.message}</p>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        {...register('mail', {
                                            required: 'Обязательное поле',
                                            pattern: {
                                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                message: "Некорректный email"
                                            }
                                        })}
                                        onChange={handleMail}

                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                    {errors.mail && (
                                        <p className="mt-1 text-sm text-red-600 dark:text-red-500">{errors.mail.message}</p>
                                    )}
                                    {!mailFree && (
                                        <p className="mt-1 text-sm text-red-600 dark:text-red-500">Эта почта занята!</p>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {isCreating ? 'Пароль' : 'Новый пароль (оставьте пустым, чтобы не менять)'}
                                    </label>
                                    {isCreating ? (
                                            <>
                                                <TextInput
                                                    id="password"
                                                    type="password"
                                                    {...register('password', {
                                                        required: "Поле обязательно к заполнению",
                                                        pattern: {
                                                            value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]).{8,}$|^$/,
                                                            message: "Пароль должен содержать минимум 8 символов, включая заглавные и строчные буквы, цифры и спецсимволы"
                                                        }
                                                    })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                />
                                                {errors.password && (
                                                    <p className="mt-1 text-sm text-red-600 dark:text-red-500">{errors.password.message}</p>
                                                )}
                                            </>)
                                        :
                                        (
                                            <>
                                                <input
                                                    type="password"
                                                    {...register('password', {
                                                        pattern: {
                                                            value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]).{8,}$/,
                                                            message: "Пароль должен содержать минимум 8 символов, включая заглавные и строчные буквы, цифры и спецсимволы"
                                                        }
                                                    })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                />
                                                {errors.password && (
                                                    <p className="mt-1 text-sm text-red-600 dark:text-red-500">{errors.password.message}</p>
                                                )}
                                            </>)}
                                </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Роль пользователя
                                        </label>

                                        <div className="space-y-2">
                                            <div className="flex items-center">
                                                <input
                                                    type="radio"
                                                    value="true"
                                                    {...register("admin")}
                                                    className="h-4 w-4"
                                                />
                                                <label className="ml-2">Администратор</label>
                                            </div>

                                            <div className="flex items-center">
                                                <input
                                                    type="radio"
                                                    value="false"
                                                    {...register("admin")}
                                                    className="h-4 w-4"
                                                />
                                                <label className="ml-2">Психолог</label>
                                            </div>

                                            <div className="flex items-center">
                                                <input
                                                    type="radio"
                                                    value="null"
                                                    {...register("admin")}
                                                    className="h-4 w-4"
                                                />
                                                <label className="ml-2">Клиент</label>
                                            </div>
                                        </div>
                                    </div>

                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                                    >
                                        Отмена
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        {isCreating ? 'Зарегистрировать' : 'Сохранить'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}